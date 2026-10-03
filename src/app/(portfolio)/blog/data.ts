export interface BlogPost {
  title: string;
  slug: string;
  date: string;
  description: string;
  content: string;
  tags: string[];
  imageURL?: string;
  minutes?: number;
  og?: string;
}

export const posts: BlogPost[] = [
  {
    title: "ciot: a cpu inference engine for ternary networks",
    slug: "ciot-ternary-inference",
    date: "May 26, 2026",
    description: "0.54 ms per 1024x1024 ternary matvec on a snapdragon x laptop. zero dependencies, one binary, ~3,000 lines of c++ and python.",
    tags: ["C++", "SIMD", "Machine Learning", "Ternary Networks"],
    imageURL: "/ciot-banner.jpg",
    content: `
# ciot: a cpu inference engine for ternary networks

> 0.54 ms per 1024x1024 ternary matvec on a snapdragon x laptop. zero dependencies, one binary, ~3,000 lines of c++ and python. github: [@Cintu07/ciot](https://github.com/Cintu07/ciot).

the standard story for running a neural network goes like this. install pytorch. install cuda. install a runtime. spin up a gpu. wait for warmup. get tokens out. **ciot is the version of that story where you delete every word after "install"**. a c++ binary opens a \`.bits\` file and produces tokens. that is the whole thing.

i started this because i wanted to know how fast ternary weights could actually run if you took the framework overhead seriously and stripped it. not how fast in theory, where you can wave your hands at flops, but how fast in practice on a laptop you actually own. the answer turns out to be: faster than i expected, by a factor of about six over a clean scalar baseline, and the code that gets you there is short enough to read in one sitting.

most of the engine is not the kernel. once the matvec is fast and correct, you still need a tokenizer, a model loader, a kv cache, a rope table, an attention loop, and a tiny transformer trainer to produce weights that aren't random. each one of those is a place where you can quietly leak performance with a bad layout or an allocator that does not align.

this post walks through the engine top to bottom. how the weights are stored, how they get from float32 down to three values without losing the signal, how the simd kernel goes branchless on three different instruction sets, how the rest of the transformer hangs off that kernel, and how every claim in the readme is verified bit-for-bit against a scalar reference. the first two or three commits on github are roughly what i posted on twitter and linkedin. everything else came after the matvec was correct and i wanted a real model running on top of it.

## why ternary

ternary networks store each weight as one of three values: -1, 0, or +1. a multiply by such a weight is not actually a multiply. it is an add, a no-op, or a subtract. a ternary matrix times a vector is a sequence of pick-or-skip-and-flip operations, which a cpu is extremely good at when the layout cooperates.

recent ternary-leaning research (bitnet 1.58b and the wave of follow-ups) shows that with the right training recipe, ternary weights cost surprisingly little accuracy versus float32. the catch is that to actually run them quickly you need a kernel that exploits the bit-level structure. blas does not have a "ternary gemm" routine. cublas does not either. so you write your own, or you give up the throughput and just store ternary values inside float32 like a coward.

ciot writes its own.

the choice of *three* values, not two, also matters. binary networks (-1, +1 only) are easier to encode but lose the ability to express "this connection is irrelevant", which turns out to be most of them. ternary keeps a sparsity dimension for free: anywhere a weight wanted to be near zero, it gets a zero. zeros cost no compute in the kernel because they appear in neither bit plane. you do not skip them with a branch. you just never read them in the first place. that is the property that lets ternary feel sparse without paying for sparsity bookkeeping.

the related work mostly lives in the "1-bit" and "1.58-bit" lineage: bitnet, the b1.58 paper, and a few hugging face threads on quantizing pretrained models down to ternary. all of it consistently shows that the accuracy gap from float to ternary is much smaller than the storage gap. the kernel side is where the published literature thins out. people benchmark gemm on simulated bit packings or fall back to int8 fused kernels. very few people write the actual bit-plane code on actual silicon. ciot is mostly an attempt to take that part seriously and write it down.

## storing 64 weights in 16 bytes

the storage layout is the first thing to get right. for ternary you want one bit-plane that answers "is this weight +1" and another that answers "is this weight -1". if both bits are zero, the weight is zero. you never explicitly store the zeros. you never store any redundancy. just two bits per weight.



in code, a row chunk of 64 weights is two \`uint64\`s. for a matrix of \`rows\` rows and \`cols\` columns you have \`blocks64 = ceil(cols / 64)\` and two flat arrays of \`rows * blocks64\` \`uint64\`s, plus a tiny \`float\` per row for the row scale (more on that in a minute).

\`\`\`cpp
struct TernaryMatrix {
    std::uint32_t rows = 0;
    std::uint32_t cols = 0;
    std::uint32_t blocks64 = 0;
    std::uint64_t* pos_bits = nullptr;   // rows * blocks64
    std::uint64_t* neg_bits = nullptr;   // rows * blocks64
    float*         row_scale = nullptr;  // rows
};
\`\`\`

a 1024x1024 ternary matrix in this format takes 1024 \\* 16 \\* 2 = 32 kb for the bit planes plus 4 kb for scales. the same matrix as \`float32\` is 4 mb. that is a 113x compression ratio, and the layout is already in the exact shape simd wants. you didn't pay for it. it fell out of the encoding choice.

the \`.bits\` file on disk is the in-memory layout with a tiny header on top: an 8-byte magic string (\`CIOTBIT1\`), the dimensions, and \`blocks64\`, then the row scales, then \`pos_bits\`, then \`neg_bits\`. the loader reads four values, validates the magic, allocates aligned memory, and \`read()\`s the rest in two contiguous calls. no parser. no schema. mmap would work too. the file format is the array.

a few things about that layout that are worth saying out loud, because they took longer to get right than the kernel did:

**alignment is a property, not a hint.** every allocation in ciot goes through \`aligned_malloc\` with a 64-byte alignment, which is the cache line size on every cpu in the supported list. \`_mm512_maskz_load_ps\` faults at runtime if the pointer is not 64-byte aligned, so this is not optional on avx-512. the wrapper handles both posix (\`posix_memalign\`) and windows (\`_aligned_malloc\`) flavors so the same code compiles on a snapdragon laptop, a mac mini, and a desktop with a ryzen in it. the alignment is set once in \`Ciot.h\`, and the rest of the code reads from a single constant:

\`\`\`cpp
constexpr std::size_t CIOT_CACHELINE = 64;
constexpr std::uint32_t CIOT_TERNARY_BLOCK = 64;
\`\`\`

the two \`64\`s being equal is not a coincidence. one block of 64 ternary weights produces 16 bytes of bit-plane data, which is exactly one quarter of a cache line. four blocks fill a cache line. the prefetcher does the rest.

**row-major was the right call.** column-major would have packed the bits the other way and made batch-of-vectors easier, but the dominant operation in decode-time inference is "one row at a time, accumulate one float into y[r]". row-major lets each row's pos and neg arrays be a single contiguous span in memory. the inner loop reads \`pos_bits[row_base + b]\` and \`neg_bits[row_base + b]\` with stride 8 bytes. that is the easiest pattern for the cpu to handle.

**why two planes and not one packed nibble.** an obvious alternative is "store each weight as 2 bits in a packed byte: 00 = 0, 01 = +1, 10 = -1, 11 = unused". it sounds more compact but it is the same density (2 bits per weight either way), and it forces the kernel to do a per-element comparison to decide which of the three cases applies. with two planes, the kernel never makes a per-weight decision. it does the +1 work, then it does the -1 work, then it subtracts. zero weights handle themselves by being absent from both planes. the encoding choice and the kernel shape are the same idea written in two different files.

## getting from float to ternary without losing the signal

if you take a trained float matrix and naively round every weight to the nearest of {-1, 0, +1}, you get a ternary matrix that looks like the original and has lost most of its signal. all the small weights collapse to zero. the bigger weights get clamped at ±1. the row sums drift.

the fix is delta-sigma style error compensation. when you round one weight, the residual (what you threw away) gets added to the next weight before that one is rounded. a row full of small positive values does not lose them: every few weights the running residual crosses the threshold and emits a \`+1\` that captures the cumulative signal.



the packer is in pure-python stdlib. no numpy. the entire quantizer is one function:

\`\`\`python
def quantize_row_error_compensated(row):
    scale = sum(abs(v) for v in row) / len(row)
    threshold = 0.5 * scale
    carry = 0.0
    quantized = []
    for value in row:
        adjusted = value + carry
        if adjusted >  threshold: q =  1
        elif adjusted < -threshold: q = -1
        else: q = 0
        carry = adjusted - (q * scale)
        quantized.append(q)
    return scale, quantized
\`\`\`

per-row scale \`s\` is the mean absolute value of that row. the threshold for a nonzero quantization is \`0.5 * s\`. each weight goes to one of {-1, 0, +1}. the residual \`(value + carry - q*s)\` becomes the carry for the next column. that's it. delta-sigma modulation applied to weight quantization.

the per-row scale \`s\` is the one cheat in the whole encoding. when the kernel computes \`y[r] = sum over c of (w[r,c] * x[c])\`, it scales the final result by \`row_scale[r]\` to recover the magnitude that the {-1, 0, +1} representation throws away. the scale is a single float per row, so for a 1024x1024 matrix it costs 4 kb. that is rounding error compared to the 32 kb of bit planes, and it buys you back enough dynamic range that the matrix actually behaves like the original.

the threshold being half the scale is the only tunable in the quantizer, and it lands where it does for a clean reason. a value of magnitude exactly \`s\` should round to \`±1\` (it is one full quantum). a value of magnitude \`0\` should round to \`0\`. the symmetric midpoint is \`0.5*s\`. anything above \`+0.5*s\` is closer to \`+1\` than to \`0\` in scale units, and gets a \`+1\`. you could pick a different threshold to bias the matrix sparser or denser, but the half-scale midpoint is the maximum-likelihood choice if you assume the weights are roughly uniformly distributed inside \`[-s, +s]\`.

per-row scaling instead of per-matrix is the other deliberate choice. transformer weight matrices have rows that look very different from one another, especially after training. the q/k/v projections develop attention heads, and a "head" inside the weights is a band of rows with their own magnitude. a single matrix-wide scale would crush some bands and amplify others. per-row scales let each band live in its own dynamic range and recover correctly on the kernel side. the cost is the 4 kb of scales i mentioned above, which is the cheapest insurance you will ever buy for a network.

what ternary cannot represent is the fine relationships between weights of similar magnitude. two weights of value \`+0.21\` and \`+0.27\` both become \`+1\`. the kernel cannot tell them apart. for some layers this matters (the lm head, especially), and the right way to handle it is to train with ternary-aware loss, not to fix it after the fact. the included python trainer does this in the dumbest possible way (sgd, no fancy schedules) and it still gets reasonable behavior out of small models. a proper ternary fine-tuning recipe would go a lot further.

## the branchless simd kernel

this is the core of ciot. one function. three simd variants (avx-512, avx2, neon) and one scalar reference, all sharing the same shape. zero data-dependent branches in the hot loop.

the high-level idea: for each row \`r\`, walk down the row in chunks of 64 columns. for each chunk you have one \`uint64\` pos mask and one \`uint64\` neg mask. you load 4 or 8 or 16 floats from the input vector \`x\` (depending on the lane width). you turn the relevant bits of the mask into a vector boolean and use it to conditionally zero out the values. you accumulate into a separate \`acc_pos\` and \`acc_neg\`. at the end you do \`hsum(acc_pos - acc_neg)\` and multiply by the row scale.

the entire trick is the "turn bits into a boolean vector" step.



the neon path is the cleanest one to read. load 4 input floats into a 4-lane vector. broadcast 4 relevant bits of \`pos_bits\` into another 4-lane integer vector (every lane gets the same nibble). AND that with \`{1, 2, 4, 8}\` and compare \`> 0\`. the lane where bit \`k\` was set produces a \`1\`, the lane where it was not produces a \`0\`. bit-select between \`x\` and \`0\` using that mask. add into \`acc_pos\`. same shape for \`neg\`. at the end, subtract and reduce.

here is the actual inner loop, lifted from \`src/kernels/ternary_simd.cpp\`:

\`\`\`cpp
static inline float32x4_t masked_load4(const float* x, std::uint32_t offset,
                                       std::uint32_t bits,
                                       uint32x4_t lane_bits,
                                       uint32x4_t zero_u32,
                                       float32x4_t zero_f32) {
    const float32x4_t values = vld1q_f32(x + offset);
    const uint32x4_t word    = vdupq_n_u32(bits);
    const uint32x4_t active  = vcgtq_u32(vandq_u32(word, lane_bits), zero_u32);
    return vbslq_f32(active, values, zero_f32);
}

// inside the per-row loop:
for (std::uint32_t b = 0; b < full_blocks; ++b) {
    const std::uint64_t pos = matrix->pos_bits[row_base + b];
    const std::uint64_t neg = matrix->neg_bits[row_base + b];
    const std::uint32_t base = b << 6U;
    for (std::uint32_t c = 0; c < 64U; c += 4U) {
        acc_pos = vaddq_f32(acc_pos, masked_load4(x, base+c, (pos>>c)&0xFU, lane_bits, zero_u32, zero_f32));
        acc_neg = vaddq_f32(acc_neg, masked_load4(x, base+c, (neg>>c)&0xFU, lane_bits, zero_u32, zero_f32));
    }
}
\`\`\`

the avx2 version is the same shape with 8 lanes and a wider lane mask, \`{1, 2, 4, 8, 16, 32, 64, 128}\`. there is no \`_mm256_maskz_load_ps\` on plain avx2, so the active mask is a \`cmpgt\` result that gets \`_mm256_and_ps\`'d with the loaded float vector.

the avx-512 version is cleaner because avx-512 has native mask registers and \`_mm512_maskz_load_ps\`. you can feed the 16-bit slice of the \`uint64\` directly to the masked load, no \`cmpgt\` needed:

\`\`\`cpp
acc_pos = _mm512_add_ps(acc_pos, _mm512_maskz_load_ps((__mmask16)((pos >>  0U) & 0xFFFFU), x + base +  0U));
acc_pos = _mm512_add_ps(acc_pos, _mm512_maskz_load_ps((__mmask16)((pos >> 16U) & 0xFFFFU), x + base + 16U));
acc_pos = _mm512_add_ps(acc_pos, _mm512_maskz_load_ps((__mmask16)((pos >> 32U) & 0xFFFFU), x + base + 32U));
acc_pos = _mm512_add_ps(acc_pos, _mm512_maskz_load_ps((__mmask16)((pos >> 48U) & 0xFFFFU), x + base + 48U));
\`\`\`

four masked loads cover an entire 64-column block per accumulator. that is eight masked loads per block total (four pos, four neg). this is about as dense as the compute gets.

zero \`if\` statements. zero \`else\` statements. no table lookups. no data-dependent branches in the inner loop. the cpu loves this, because what does not exist cannot be mispredicted. the branch predictor never sees this loop and has nothing to do.

**why two accumulators instead of one.** an obvious alternative is to fold the sign in at every step: compute \`(pos_bit - neg_bit) * x[c]\` and accumulate into a single number. it is also a wrong-looking alternative once you think in simd. computing \`(pos - neg)\` per-lane needs both bit planes participating in the same instruction, and turning that into a \`±1\` factor needs a \`sub\` or a \`xor\`. two accumulators dodge the issue entirely. the positives lane is "values where pos_bit = 1, zero otherwise". the negatives lane is symmetric. they never interact until the final reduction, where you do one \`sub\` per row. it is the same arithmetic split into two non-overlapping passes, and it lets each pass use the simplest possible instruction (a masked load or a select-and-add).

**tail handling.** matrices whose column count is not a multiple of 64 have a tail block at the end. ciot deals with this in the most boring way possible: a scalar fallback for the last \`cols % 64\` columns. the tail is at most 63 columns out of \`cols\`, which means at worst it costs about 6% of the row at 1024 columns and a lot less at typical model widths. nothing here is clever. you do not need cleverness for code that runs once per row.

**how the three backends end up the same shape.** the kernel is one function, three implementations, all sharing a single struct, a single bit layout, and a single horizontal reduction at the end:

| backend | lane width | mask source | "make active" instruction | horizontal sum |
| --- | --- | --- | --- | --- |
| avx-512 | 16 | native mask register | \`_mm512_maskz_load_ps\` (mask is the input) | \`_mm512_reduce_add_ps\` |
| avx2 | 8 | float-vector \`and\` | \`_mm256_cmpgt_epi32\` then \`_mm256_and_ps\` | manual hsum256 |
| arm neon | 4 | bool-vector \`cmpgt\` | \`vcgtq_u32\` then \`vbslq_f32\` | \`vaddvq_f32\` on aarch64 |
| scalar | 1 | bit shift | \`(uint64 >> bit) & 1\` cast to int | \`sum\` is a \`float\` |

the differences are real, but they cancel: avx-512 has dedicated mask registers so it skips the cmpgt step entirely, but it also has to do four masked loads per 64-column block instead of one because each load covers 16 lanes. neon has narrower vectors so it covers 64 lanes in sixteen masked loads, but each load is cheaper. across the three, the throughput lands within a factor of two of each other for the same matrix size, which is what you would expect from kernels that all do the same logical work.

**runtime dispatch (or lack of it).** ciot currently picks the simd backend at compile time using preprocessor flags: if the compiler sees \`__AVX512F__\`, the avx-512 kernel becomes \`matvec_ternary_native\`. if it sees \`__AVX2__\`, that becomes \`matvec_ternary_native\`. and so on. there is exactly one \`matvec_ternary_native\` in any given build of the binary. the only runtime choice is whether \`CIOT_BACKEND=scalar\` is set in the environment, in which case \`matvec_ternary_simd\` calls the scalar path instead.

\`\`\`cpp
DispatchBackend selected_backend() {
    static DispatchBackend selected = []() {
        const char* forced = std::getenv("CIOT_BACKEND");
        if (forced && std::strcmp(forced, "scalar") == 0) return DispatchBackend::Scalar;
        return DispatchBackend::Native;
    }();
    return selected;
}
\`\`\`

the static lambda runs exactly once (the first time \`selected_backend\` is called) and the result is cached. every subsequent call is a load of a single integer. there is no per-matvec dispatch cost beyond that.

this design is intentional. proper runtime dispatch on x86, where one binary supports both avx-512 and avx2 hosts and picks at startup via cpuid, requires multi-object compilation with per-tu instruction sets, which the makefile does not currently set up. it is on the next-steps list. for now, you build the binary for the cpu you have. on arm you do not have this problem because there is essentially one neon for the cpus people actually use.

**the part that took the longest.** writing the neon kernel was about an evening. writing the avx2 kernel was another evening. writing the avx-512 kernel was about an hour once i found out mask registers existed. what took multiple days was getting the tail handling, alignment, row scale application, and \`bench_matvec\` warmup logic right so the timings i was reading were not lying to me.

## the rest of the transformer

a kernel alone is not an inference engine. once the matvec is fast and correct, you have to build the surrounding ops out of pieces that are just as careful. ciot's surface area here is intentionally small:

\`\`\`
rmsnorm           // 6 lines
rope_table_apply  // table lookup + 2 multiplies per pair
softmax_inplace   // 2 passes, max-subtract for stability
kv_cache_append   // memcpy
mha_attention_decode    // dot products + softmax + weighted sum
transformer_block_decode_mha  // ties it all together
\`\`\`

**rmsnorm** is six lines. compute the rms, divide each element by it, multiply by a per-element gain.

\`\`\`cpp
void rmsnorm(float* out, const float* x, const float* weight, std::uint32_t n, float eps) {
    float ss = 0.0f;
    for (std::uint32_t i = 0; i < n; ++i) ss += x[i] * x[i];
    const float inv_rms = 1.0f / std::sqrt((ss / n) + eps);
    for (std::uint32_t i = 0; i < n; ++i) out[i] = x[i] * inv_rms * weight[i];
}
\`\`\`

no batch dimension. no running statistics. no learnable bias. layernorm-without-the-mean is enough.

**rope** is the part everyone worries about because rotary position embeddings involve a \`cos\` and a \`sin\` per dimension pair. that is fine at training time and a nightmare at decode time, where you call it 32 times per token through the stack. ciot's trick is to precompute the entire \`cos\` and \`sin\` table when the model loads:

\`\`\`cpp
for (pos = 0; pos < max_position; ++pos)
    for (i = 0; i < even_dim; i += 2)
        table->cos[pos*even_dim + i] = std::cos(pos * pow(theta, -i/even_dim));
        // same for sin
\`\`\`

at runtime, applying rope is two multiplies and an add per dimension pair, sourced entirely from the table. zero transcendental functions in the hot path. the rope benchmark in the readme finishes a full 1024-dim rotation in 0.45 microseconds. it is statistically zero compared to the rest of the layer.

**the kv cache** is a flat buffer. one for keys, one for values. you append with \`memcpy\`. you attend by walking back through the buffer. for multi-head attention, the layout is interleaved by head so that the inner attention loop is a clean linear walk through memory rather than a strided one.



if you stored the cache token-major (\`[t0_h0_k, t0_h1_k, t1_h0_k, t1_h1_k, ...]\`), every key for a given head would be \`num_heads * head_dim\` floats apart. that is a strided load. the cpu prefetcher would still pull it, but you would waste cache lines on the keys you do not want, and on x86 the gather/scatter pattern would dominate the runtime. by grouping all of head 0's keys contiguously, the inner dot-product loop walks straight through memory and the hardware prefetcher does the right thing automatically.

**attention itself** is standard scaled dot-product with causal masking. it lives in \`mha_attention_decode\` in \`src/model/mha_cache.cpp\` and the entire function is about thirty lines:

\`\`\`cpp
for (h = 0; h < num_heads; ++h) {
    const float* keys   = cache->buffer + 2*h * max_tokens * head_dim;
    const float* values = keys + max_tokens * head_dim;
    const float* q      = query + h * head_dim;
    float* scores       = score_scratch + h * max_tokens;

    for (t = 0; t < used; ++t) {
        const float* k = keys + t * head_dim;
        float dot = 0.0f;
        for (i = 0; i < head_dim; ++i) dot += q[i] * k[i];
        scores[t] = dot * scale;
    }
    softmax_inplace(scores, used);

    float* out = attn_out + h * head_dim;
    for (i = 0; i < head_dim; ++i) out[i] = 0.0f;
    for (t = 0; t < used; ++t)
        for (i = 0; i < head_dim; ++i)
            out[i] += scores[t] * values[t*head_dim + i];
}
\`\`\`

three loops per head, all of them dense linear walks. softmax in the middle is two passes: one to find the max for numerical stability, one to exp and normalize.

put it all together and you have a transformer decode block: rmsnorm, then q/k/v projections via ternary matvec, rope the q and k, append k/v to the cache, attend over the accumulated cache, project the attention output, residual add, rmsnorm again, ffn with relu (two more ternary matvecs), residual add. that's \`transformer_block_decode_mha\` in \`src/model/tiny_transformer.cpp\`, and it's the whole thing for one layer.

**six ternary matvecs per layer.** that's the load. four for attention (q, k, v, output) and two for the ffn (up, down). everything between them is float arithmetic on \`dim\`-sized vectors, which is cheap because \`dim\` is at most a few hundred or thousand. the matvecs dominate the runtime. the rest of the layer is overhead that scales linearly with \`dim\`, while a matvec scales as \`dim * dim\`. this is why the readme's transformer-256 benchmark finishes in 0.15 ms and the bare 1024x1024 matvec is 0.54 ms: a full transformer block with \`dim = 256\` runs the six matvecs at \`256x256\` each, plus all the attention plumbing, and the total cost lands a third of one bigger matvec.

**rope table memory.** at \`max_position = 64\` and \`dim = 256\`, the cos and sin tables are each 64 \\* 256 \\* 4 bytes = 64 kb. that fits comfortably in L1 on every cpu in the supported list. for \`max_position = 2048\` and \`dim = 1024\`, the tables are 8 mb each, which spills out of L2. at that point you have a choice between recomputing on the fly (which costs a \`cos\` and a \`sin\` per dimension pair) or eating the L3 traffic. ciot picks the table because L3 traffic is roughly free compared to a software \`cos\` call, and decode-time inference never benefits from streaming a computation in chunks.

**why the cache layout is interleaved by head.** if you stored the cache token-major (\`[t0_h0_k, t0_h1_k, t1_h0_k, t1_h1_k, ...]\`), every key for a given head would be \`num_heads * head_dim\` floats apart in memory. that is a strided load. the cpu prefetcher would still pull it, but you would waste cache lines on the keys belonging to other heads, and on x86 the gather pattern would dominate the runtime once \`num_heads\` gets big. by grouping all of head 0's keys contiguously, the inner dot-product loop walks straight through memory and the hardware prefetcher does exactly the right thing automatically. there is no software prefetch in this code. there does not need to be.

the layout is set once in \`mha_kv_cache_init\`. it is one allocation, \`2 * num_heads * max_tokens * head_dim\` floats, with the layout \`[head0_K | head0_V | head1_K | head1_V | ...]\`. append is one \`memcpy\` per head per side. attention is a triple-nested loop with no allocation. the cache never resizes. if you exceed \`max_tokens\` it stops appending and you get whatever the model can produce from the prefix you have. this is the right behavior for decode-time inference on a fixed context budget.

## how we know it is correct

the easiest way to make a fast kernel produce wrong answers is to not check. ciot's verification strategy is a single environment variable: \`CIOT_BACKEND=scalar\`.

\`\`\`cpp
DispatchBackend selected_backend() {
    static DispatchBackend selected = []() {
        const char* forced = std::getenv("CIOT_BACKEND");
        if (forced && std::strcmp(forced, "scalar") == 0) return DispatchBackend::Scalar;
        return DispatchBackend::Native;
    }();
    return selected;
}

void matvec_ternary_simd(const TernaryMatrix* matrix, const float* x, float* y) {
    if (selected_backend() == DispatchBackend::Scalar) {
        matvec_ternary_ref(matrix, x, y);   // pure scalar loop
        return;
    }
    matvec_ternary_native(matrix, x, y);    // simd
}
\`\`\`

the scalar path is a textbook reference. it loops rows, then columns, decodes the bit, multiplies, accumulates. simple enough that it is impossible to be subtly wrong:

\`\`\`cpp
for (r = 0; r < matrix->rows; ++r) {
    float sum = 0.0f;
    for (c = 0; c < matrix->cols; ++c) {
        // decode the ternary value via the bit planes
        const std::uint32_t block = c >> 6U;
        const std::uint64_t mask  = 1ULL << (c & 63U);
        const int sign = ((pos[row_base + block] & mask) != 0)
                       - ((neg[row_base + block] & mask) != 0);
        sum += sign * x[c];
    }
    y[r] = sum * row_scale[r];
}
\`\`\`

every benchmark computes a checksum (\`sum(y)\`) and prints it next to the timing. if the simd checksum does not match the scalar checksum for the same matrix and input, the simd path is broken. for ciot, all three simd variants produce exactly the same checksum as the scalar reference: \`1.951170\` for the 1024x1024 hero benchmark. they are not subtly wrong. they are not faster because they are cheating on numerics. they are faster because the cpu does less work per cycle.

this also catches the second-most-common bug, which is the compiler optimizing the whole benchmark away because nothing reads \`y\`. summing \`y\` reads every output element. the loop has to actually happen.

**a note on floating-point reproducibility.** the checksums match across simd and scalar because the order of operations is carefully aligned. floating-point addition is not associative: \`(a + b) + c\` can differ from \`a + (b + c)\` in the last bit, and a vectorized accumulator inherently changes the order. ciot avoids this trap by accumulating into \`acc_pos\` and \`acc_neg\` lane-wise in the same logical order as the scalar reference, then doing the horizontal reduction at the end with a deterministic tree (\`vaddvq\` on neon, \`_mm512_reduce_add_ps\` on avx-512, \`_mm_hadd_ps\` cascade on avx2). the per-lane order is consistent across runs and across backends, which is why the checksums collapse to the same hex bits.

if you were doing this for a research result, you would care more about absolute reproducibility (different cpus could still differ at very low bits). for an inference engine you care about "the simd path does not introduce a systematic bias relative to the reference path," which is the stronger property and which the checksum match verifies cleanly.

**what the checksum does not catch.** the checksum is a sum, so it does not catch a transposition of two outputs that exactly cancels. in practice this never happens for real bit-plane bugs (they always introduce a magnitude error), but the production test suite also runs a per-element comparison with a tolerance to be safe. the readme just reports the checksum because it is the cleanest one-number sanity check, and because the actual error pattern of a broken kernel almost always shows up as a wildly different checksum, not a subtle one.

## the numbers

every measurement below comes from \`--bench-linear-pro\` and similar commands in the repo. warmup is 20 iterations, repeats is 9. the median is the headline number, the p95 catches thermal throttling, the checksum proves nothing was skipped.

<p align="center">
  <img src="ciot-figures/ciot_latency.png" width="700" alt="scalar vs neon, 1024x1024 ternary matvec">
</p>

5.7x speedup is the linear-matvec hero number on snapdragon x. for everything else:

<p align="center">
  <img src="ciot-figures/ciot_benchmarks.png" width="780" alt="all seven benchmarks, checksum verified">
</p>

a few things worth noting from the full table:

- **the kernel is well-behaved across cache levels.** across 256, 512, 1024, 2048 the throughput stays at 7.9 to 8.8 gop/s. that is the matrix going from "fits in l1" to "fits in l2" to "barely fits in l3" without the kernel falling off a cliff. the bit-plane format helps here: at 1024x1024 the full weight set is 36 kb, which is happy in any modern l2.
- **rope is statistically free.** 0.45 microseconds for a 1024-dim rotation when the table is precomputed. compare that to the milliseconds people sometimes report when they call \`cosf\` per dimension per token.
- **the multi-head decode block is the same speed as the single-head one.** because the heads share the same attention shape and the matvec is the dominant cost, splitting \`dim\` into \`num_heads * head_dim\` does not change the floor.
- **the scalar path is a real reference, not a strawman.** it's the same \`-O3 -march=native\` binary, same matrix, same input, same checksum. it just decodes one bit at a time instead of 64.

**what "logical gop/s" means.** every benchmark in ciot reports throughput as "logical gop/s", which counts a ternary multiply-accumulate as two ops (one multiply, one add), the same way a dense float gemm would count it. it is a conservative way of comparing against dense baselines: ciot's "real" cost per ternary mac is closer to a third of a dense float mac, but reporting it that way would inflate the numbers without making them comparable to anything. the convention is also why you can run \`--bench-suite\` against a \`cublas\` number and have a fair conversation about who is doing what.

**why median, not mean.** the benchmark harness runs \`iters\` matvecs per repeat and \`repeats\` repeats. for the hero benchmark that's 200 \\* 9 = 1,800 matvecs total. it sorts the per-repeat times and reports the median, the min, the p95, and the max. the mean is omitted on purpose. medians are robust to a single bad sample (an OS context switch, an interrupt, a thermal blip). means are not. p95 is included because thermal throttling will not show up in the median but it will absolutely show up at the tail. if you see a benchmark where p95 is more than 2x the median, you're throttling.

**reproducing the headline.** if you want the headline 0.54 ms number on a snapdragon x, the commands are in the readme. if you want it on x86, you compile with \`make avx2\` or \`make avx512\`. on a recent intel laptop the avx-512 kernel lands somewhere between 0.3 and 0.5 ms depending on whether the cpu is in the right p-state when the benchmark starts. warm up before measuring. plug the laptop in. close the browser tabs.

## the python side, briefly

the only thing besides c++ in the repo is a python toolchain. all of it is stdlib only. no numpy, no pytorch.

- \`scripts/pack_ternary.py\` (~130 lines) is the float32-to-\`.bits\` packer with the error compensation shown above.
- \`scripts/train_tiny_transformer.py\` (~1,200 lines) is a pure-python transformer trainer: word-level tokenizer, multi-head causal attention with full forward/backward gradients, rmsnorm with analytical backward, sgd with gradient clipping, row-wise ternary quantization with error compensation, \`.bits\` model export.
- \`scripts/run_tests.py\` is the harness that compiles the binary, runs every benchmark, compares simd against scalar, validates checksums, and emits a csv.

the trainer is not going to produce a useful model. its architecture is tiny by design and sgd is the wrong optimizer for this task. what it does prove is that the pipeline closes: you can feed it text on one end and pull tokens out the other end through the c++ inference loop, with weights quantized to ternary by the python side. closing that loop end-to-end is the part i added after the social media post. before that, the c++ side could load synthetic weights and time them. now it can load a real trained model directory and emit text.

the constraint of stdlib-only was deliberate. ciot ships as one c++ binary, and the toolchain that produces its inputs should not require a 2 gb pip install. the trainer is slow (pure-python list-of-lists matmul, no fma anywhere) but it is dependency-free and you can read every line of it. if you outgrow it, the \`.bits\` format is documented in the header and you can produce one from pytorch in about thirty lines.

\`scripts/run_tests.py\` is what turns the readme into a verifiable claim. it builds the binary fresh, runs every benchmark in sequence, captures the native simd output, then re-runs the matvec hero with \`CIOT_BACKEND=scalar\` and compares the checksum. it emits a csv to \`data/\` and a formatted report to stdout. if the comparison passes on your machine, the kernel is working on your machine.

## what i would change

the engine is intentionally narrow. if something does not help run ternary weights faster, it goes in a python script outside the core. there are a few things i still want to add:

- **x86 runtime dispatch.** right now the build picks between avx-512 and avx2 at compile time. i want both paths in one binary, with the dispatcher picking at startup based on cpuid. this is mostly a build-system problem, not a kernel problem.
- **a real batched kernel.** the current \`matmat_ternary_simd\` runs the single-token matvec \`batch\` times. for true prompt-style batching, you want to load the weight row once and reuse it across the batch from registers. that's a kernel that fuses the outer batch loop into the inner column loop.
- **a real tokenizer.** the bpe path in the repo handles ascii correctly and stumbles on unicode. closing this means a byte-level bpe table with proper utf-8 handling, not a port of the current logic.
- **fixing the embedding bypass.** in \`--model-generate\` the embedding step is currently a one-hot vector indexed by the token id, instead of a real lookup into the trained \`embed\` matrix. trained models lose half their expressive power because of this. it's a one-day fix.

what i would not change is the storage format or the kernel shape. the bit-plane layout and the masked-add structure are the parts that make this whole thing fast and verifiable. everything else can be a python script.

## closing

ternary inference does not need a framework. it needs a kernel that takes bits seriously and a handful of glue around it that does not fight the kernel. ciot is the smallest version of that idea i could ship as one binary.

the code is on github at [@Cintu07/ciot](https://github.com/Cintu07/ciot). the readme has the build commands. if you want to read it in order, start with \`src/kernels/ternary_simd.cpp\`, then \`src/model/model_loader.cpp\`, then \`src/main.cpp\`. the 1024x1024 hero benchmark prints checksum \`1.951170\` on every supported cpu.

\`\`\`
git clone https://github.com/Cintu07/ciot
cd ciot && make
./bin/ciot --bench-linear-pro 1024 1024 200 9 20
\`\`\`

thanks for reading.


`,
  },
  {
    title: "Building a Membership System That Says \"I Don't Know\"",
    slug: "styx-membership-system",
    date: "Oct 24, 2025",
    description: "Most failure detectors lie. STYX is a distributed membership system that returns a probability distribution instead of a boolean, handling uncertainty with honesty.",
    tags: ["Distributed Systems", "Go", "Architecture"],
    imageURL: "/styx-hero.jpg",
    content: `
# Building a Membership System That Says "I Don't Know"

Most failure detectors lie. Not maliciously. They just can't handle uncertainty, so they force a binary answer when they don't have enough information to give one. A node times out, the detector marks it dead, and downstream systems treat that as fact. Sometimes it's right. Sometimes the node was just under load, the network was slow, or a GC pause ate the timeout window. Getting it wrong in the dead direction is usually worse than getting it wrong in the alive direction. You split the cluster, drop connections, trigger failover sequences that are hard to reverse.

STYX is a distributed membership system that returns a probability distribution instead of a boolean. You ask whether a node is alive and it says something like: alive 61%, dead 19%, unknown 20%. If it doesn't have enough information, it says unknown instead of guessing. If it detects a network partition where different parts of the cluster see different things, it refuses to answer at all.

This is a writeup of how it was built and why specific decisions were made.

![STYX Architecture Diagram](/styx-diagram.svg)

---

## The core problem

Standard health checks have two failure modes that look identical from outside.

The first is real failure: the process crashed, the disk died, the machine is gone.

The second is temporary unreachability: the network path is congested, the process is paused for GC, the machine is CPU-saturated and not responding to probes within the timeout window.

Both look the same to a naive detector. You send a ping, you wait, you get nothing back, you declare death. The problem is that the two cases require completely different responses. Real failure means route around the dead node and start recovery. Temporary unreachability means wait. If you confuse them, you make the second case worse. You trigger unnecessary recovery, create cascading load, and sometimes cause the very outage you were trying to detect.

The fix is to stop treating a timeout as proof of death. It is evidence. Weak evidence. How weak depends on how long you waited, whether your own machine was under load at the time, and whether other witnesses saw the same thing.

---

## Representing uncertainty as a distribution

Instead of a boolean, STYX uses a three-value probability distribution over every node: \`{alive, dead, unknown}\`, where the three values sum to 1.

\`\`\`go
type Belief struct {
    alive   Confidence
    dead    Confidence
    unknown Confidence
}
\`\`\`

\`Confidence\` is a float64 constrained to \`[0, 1]\`. The \`NewBelief\` constructor validates that the three values sum to 1.0 within floating-point tolerance before accepting them:

\`\`\`go
func NewBelief(alive, dead, unknown float64) (Belief, error) {
    sum := alive + dead + unknown
    if math.Abs(sum-1.0) > BeliefSumEpsilon {
        return Belief{}, fmt.Errorf("%w: got %f", ErrBeliefInvalidSum, sum)
    }
    // ...
}
\`\`\`

The invariant is enforced at construction time so nothing downstream can accidentally use an invalid distribution. Before any evidence arrives, a node starts with \`{0, 0, 1}\`, which is total uncertainty. That is the honest starting state.

A few constraints are baked in as properties the code is written to enforce:

- Belief is never binary. No node ever reaches \`{1, 0, 0}\` or \`{0, 1, 0}\`. The maximum certainty allowed from evidence alone is 90%.
- Unknown is always a floor. Unknown is never allowed to drop below 5%.
- Conflicting evidence widens uncertainty instead of resolving it.

These are not arbitrary. The 90% cap exists because certainty in distributed systems is rare and expensive to establish. The 5% floor on unknown exists because there is always the possibility of observer error or failure modes that the model does not cover. If a system is going to be conservative anywhere, it should be conservative about claiming certainty.

---

## Evidence types and why they don't all weigh the same

The system collects several types of evidence about a node's liveness.

\`\`\`go
const (
    KindDirectResponse    EvidenceKind = iota
    KindTimeout
    KindWitnessReport
    KindCausalEvent
    KindSchedulingJitter
    KindNetworkInstability
)
\`\`\`

A \`DirectResponse\` is the strongest evidence. You sent a probe, got a response, the node is alive right now at that timestamp. The weight starts at 1.0 and decays slightly for high latency. A 1500ms response suggests something is degraded, so the weight drops to 0.6.

A \`Timeout\` is the weakest. The code makes this explicit:

\`\`\`go
// Per Property 4 and 15: timeouts are WEAK evidence, never proof of death.
func NewTimeout(...) Evidence {
    ratio := float64(waitedMS) / float64(expectedMS)
    weight := 0.1
    if ratio > 10.0 {
        weight = 0.3 // Still weak - silence != death
    }
    // ...
}
\`\`\`

Even if you waited ten times the expected duration and got nothing, the maximum timeout evidence weight is 0.3. That will not push dead confidence to anywhere near the 85% threshold required to declare death. Multiple timeouts from multiple witnesses might eventually get there, but a single timeout never will.

A \`CausalEvent\` is the other strong signal. If the node was observed to have produced a causally linked event, something that could only have been created by that process, then the node was alive at that logical timestamp. Weight is always 1.0 for causal events.

\`SchedulingJitter\` and \`NetworkInstability\` are modifier evidence. They don't say the node is alive or dead. They say that other evidence should be taken less seriously because local conditions were degraded.

---

## Jitter tracking

One specific problem with timeout-based evidence is that it can be wrong for reasons that have nothing to do with the target node. If your own machine is under load, running hot, doing a GC pause, or processing a large request, your timeouts become unreliable. You might not have sent the probe on time, or the response might have arrived and sat in a queue while your thread was paused.

STYX tracks local scheduling jitter separately and uses it to discount timeout evidence:

\`\`\`go
func (jt *JitterTracker) GetJitterFactor() float64 {
    // ...
    if maxJitter > 2.0 {
        return 0.1 // Extreme jitter event detected
    }
    if mean > 0.5 {
        return 0.2 // Sustained high jitter
    }
    if mean > 0.2 {
        return 0.5 // Moderate jitter
    }
    return 1.0 - (mean * 2.5)
}
\`\`\`

The jitter factor is then applied to every timeout evidence weight before it gets recorded:

\`\`\`go
ev = evidence.NewTimeout(ts, expectedMS, actualDuration.Milliseconds(), source, target)
ev.Weight *= jitterFactor
// Cap at 0.3 regardless
if ev.Weight > 0.3 {
    ev.Weight = 0.3
}
\`\`\`

The result is that timeouts observed during high-jitter periods get almost no weight. The system effectively says: "I know I didn't get a response, but I also know my own machine was misbehaving, so I can't blame the target."

This matters in production because machines that are under load enough to start timing out probes are also usually experiencing scheduling jitter. The two failure modes correlate, and naive detectors interpret both as evidence that the target is failing.

---

## Evidence decay

Evidence gets stale. A direct response from three minutes ago is weaker evidence of current liveness than a response from three seconds ago.

\`\`\`go
func (e Evidence) EffectiveWeight(now styxtime.LogicalTimestamp, halfLife uint64) float64 {
    age := e.Timestamp.AgeSince(now)
    decayFactor := pow(0.5, float64(age)/float64(halfLife))
    return e.Weight * decayFactor
}
\`\`\`

The default half-life is 100 logical time units. Evidence that is twice as old as the half-life has 25% of its original weight. The system naturally shifts from "confident alive from recent responses" toward "uncertain, need fresher data" as time passes without new evidence.

This is important for the partitioned case. If a node becomes unreachable, you do not want the old alive evidence to stay strong forever. The decay ensures that as time passes without new responses, unknown starts creeping back up.

---

## Logical timestamps instead of wall clocks

Wall clocks are unreliable in distributed systems. NTP can jump backwards. Virtualization causes drift. A machine can freeze and then resume with a timestamp that is hours in the past relative to other nodes.

STYX uses Lamport-style logical timestamps throughout:

\`\`\`go
// Lamport's rule: ts = max(local_ts, received_ts) + 1
func (t *LogicalTimestamp) Update(received LogicalTimestamp) LogicalTimestamp {
    if received > *t {
        *t = received
    }
    t.Increment()
    return *t
}
\`\`\`

This captures the "happens-before" relationship between events without requiring synchronized clocks. If event A caused event B, then \`ts(A) < ts(B)\`. The evidence decay uses logical timestamps, so "stale" means "causally distant" rather than "temporally old."

The tradeoff is that logical time does not translate directly to human-readable duration. You cannot say "this response is 3 minutes old" in logical time units. What you can say is "this response was recorded N events ago." For evidence weighting, that is the right primitive.

---

## Multiple witnesses and aggregation

No single observer has a complete view. STYX is designed to aggregate reports from multiple witnesses, where each witness is another node in the system reporting what it can see.

\`\`\`go
type WitnessReport struct {
    Witness types.NodeID
    Target  types.NodeID
    Belief  types.Belief
    Trust   TrustScore
}
\`\`\`

Aggregation is not a simple average. Two things complicate it.

First, disagreement between witnesses increases uncertainty. If five witnesses all say 90% alive, that is a clear signal. If three say 90% alive and two say 85% dead, that disagreement itself is information. Something unusual is happening, and the right response is to widen the unknown band rather than just average the numbers.

\`\`\`go
if disagreement > 0.3 {
    reduction := disagreement * 0.5
    avgAlive *= (1 - reduction)
    avgDead *= (1 - reduction)
    avgUnknown = 1.0 - avgAlive - avgDead
}
\`\`\`

Second, correlated witnesses do not provide independent evidence. If ten witnesses all have identical reports, that is not ten independent observations. It could be one cluster view replicated across ten nodes. Highly correlated witnesses get their combined confidence reduced by 30%.

---

## Witness trust

Not all witnesses are equally reliable. A witness that consistently gives accurate reports builds trust over time. A witness that consistently gives wrong reports loses trust.

\`\`\`go
const (
    MaxTrust     TrustScore = 1.0
    MinTrust     TrustScore = 0.1
    DefaultTrust TrustScore = 0.8
    DecayRate               = 0.1
    RecoveryRate            = 0.05
)
\`\`\`

Trust decays faster than it recovers. 0.1 per wrong report, 0.05 per correct report. A newly correct witness needs two correct reports to recover from one wrong report. Trust never reaches zero, the minimum is 0.1. A witness with minimum trust still has some influence, just not much.

The trust system interacts with aggregation. Witness reports are weighted by trust score when computing the averaged belief.

---

## Partition detection

A network partition creates a situation where different groups of nodes have genuinely incompatible views of reality. Group A can see node X but not node Y. Group B can see Y but not X. There is no single correct answer to "is X alive?" because it depends on which partition you're in.

STYX detects this pattern and refuses to answer:

\`\`\`go
func (d *Detector) Analyze(reports []witness.WitnessReport, target types.NodeID) (PartitionState, *SplitReality) {
    // ...
    if aliveVotes > 0 && deadVotes > 0 {
        disagreement := float64(min(aliveVotes, deadVotes)) / float64(total)
        if disagreement > d.disagreementThreshold { // 0.4
            d.state = ConfirmedPartition
            // return SplitReality showing both groups
        }
        d.state = SuspectedPartition
    }
}
\`\`\`

If more than 40% of witnesses are in the minority view, the partition is considered confirmed and the oracle returns \`refused: true\` with \`refusal_reason: "network partition detected - witnesses disagree"\`.

This is one of the stronger design choices. A lot of systems would average the conflicting reports and give you a 50/50 distribution, which looks like uncertainty but is actually hiding information. The information being hidden is that the cluster is split. An explicit refusal is more honest. The caller can handle "I don't know" differently from "50% alive, 50% dead."

---

## Death and finality

Death in STYX is irreversible. Once a node is declared dead, it stays dead permanently. If the process restarts and wants to rejoin, it must use a new node ID with an incremented generation counter.

\`\`\`go
func (n NodeID) Rebirth() NodeID {
    return NodeID{
        Base:       n.Base,
        Generation: n.Generation + 1,
    }
}
\`\`\`

This prevents zombie nodes. A node that was declared dead and then came back is, for the purposes of the system, a different node. The generation counter makes old and new identities distinguishable.

The death declaration itself has a high threshold:

\`\`\`go
const (
    MinDeadConfidence     = 0.85
    MinWitnesses          = 3
    MaxDisagreement       = 0.2
    MinNonTimeoutEvidence = 0.3
)
\`\`\`

85% dead confidence from at least 3 witnesses with low disagreement and at least 30% of the evidence being non-timeout. That last constraint is key. If all you have is timeouts, three witnesses that got no responses, that is not enough to declare a node dead. You need at least some positive evidence. Witnesses that tried to communicate and got back something confirming non-responsiveness rather than just absence.

Attempting resurrection always fails:

\`\`\`go
func (e *Engine) AttemptResurrection(id types.NodeID) error {
    if _, exists := e.dead[id]; exists {
        return ErrResurrection
    }
    return nil
}
\`\`\`

There is no API to bring a dead node back to life. The only path is a new identity.

---

## How queries work

The Oracle type is the main interface. You call \`Query(target)\` and get back a \`QueryResult\`:

\`\`\`go
type QueryResult struct {
    Target         types.NodeID
    Belief         types.Belief
    Refused        bool
    RefusalReason  string
    Dead           bool
    WitnessCount   int
    Disagreement   float64
    PartitionState partition.PartitionState
    Evidence       []string
}
\`\`\`

The query path runs through several checks in order: finality check (is the node already declared dead), partition check (would answering be dishonest given a detected split), aggregation, and confidence threshold check.

The \`Evidence\` field in the result is a list of human-readable strings explaining what was considered. Things like "aggregated 7 witness reports", "some witness disagreement detected", "finality: node declared dead". This is useful for debugging because you can see why the system gave the answer it did.

There is also \`QueryWithRequirement\` for when you need a specific confidence level:

\`\`\`go
var StrictRequirement = RequiredConfidence{
    MinAlive:   0.7,
    MinDead:    0.7,
    MaxUnknown: 0.3,
}
\`\`\`

If the belief distribution does not meet the requirements, the oracle refuses to answer rather than returning a low-confidence result. The caller decides whether to use a strict or loose confidence requirement based on what they are doing with the answer.

There is a \`MustQuery\` that panics on refusal. The comment in the code says "USE WITH CAUTION - defeats the purpose of STYX." It exists for cases where you genuinely cannot handle uncertainty and want to opt into the dangerous behavior explicitly.

---

## The HTTP API

The server exposes five endpoints:

- \`GET /query?target=ID\` - query node status
- \`POST /report\` - submit a witness belief report
- \`POST /witnesses\` - register a witness
- \`GET /health\` - health check
- \`GET /metrics\` - Prometheus-format counters

A query returns:

\`\`\`json
{
  "target": 42,
  "alive_confidence": 0.61,
  "dead_confidence": 0.19,
  "unknown": 0.20,
  "refused": false,
  "dead": false,
  "witness_count": 4,
  "disagreement": 0.08,
  "partition_state": "NO_PARTITION",
  "evidence": ["aggregated 4 witness reports"]
}
\`\`\`

A report submission:

\`\`\`json
{
  "witness": 10,
  "target": 42,
  "alive": 0.8,
  "dead": 0.1,
  "unknown": 0.1
}
\`\`\`

The server validates that the belief values sum to 1.0 before accepting the report. Invalid submissions get a 400 with an explanation.

---

## What was left out on purpose

A few things were explicitly not built in this version.

**Multi-producer channels.** The current design is one-to-many: multiple witnesses report, one oracle aggregates. Multiple oracles with consensus is a different, harder problem that would require Paxos or Raft-style agreement on the death declaration. That is out of scope for now.

**Built-in persistence.** If the oracle process restarts, all the accumulated reports are gone. Starting from scratch with no evidence is the correct behavior from an uncertainty perspective. You genuinely do not know anything after a restart. But it means recovery takes longer. Persistent evidence would require careful versioning and expiry logic.

**Automatic probing.** The \`Prober\` module exists and has a \`Probe\` method, but it requires injecting a \`ProbeFunc\`. The actual mechanism for sending a probe is not provided. This keeps the core transport-agnostic but means you have to wire it up yourself.

**The economics module.** There is staking and slashing in \`economics/economics.go\`. Witnesses can stake tokens and get slashed for wrong reports. This is not integrated into the main oracle flow. The idea is that economic incentives would prevent Byzantine witnesses from reporting falsely, but it requires a token system that does not exist yet.

---

## The TLA+ spec

There is a formal specification in \`formal/Styx.tla\` that models the core invariants. The important ones:

\`\`\`
THEOREM Spec => []Property7_BeliefNeverBinary
THEOREM Spec => []Property18_ConfidenceSumsToOne
THEOREM Spec => []Property13_FalseDeathForbidden
THEOREM Spec => Property14_FinalityIrreversible
\`\`\`

The spec is simplified in places. \`UpdateBeliefs\` just sets a fixed distribution rather than modeling the actual aggregation math. It is sufficient to prove the structural properties but would not catch bugs in the aggregation algorithm itself. Useful for reasoning about the system's invariants, not a full correctness proof.

---

## Current state

The oracle and evidence subsystems work. The Prober needs a probe function injected. The economics module is disconnected. The BFT aggregator with ed25519 signatures is implemented but not wired into the main oracle flow. It sits parallel to the simpler \`Aggregator\`.

There is no built-in transport between nodes. Reports have to be submitted via HTTP. A production deployment would need something that periodically sends reports from each node to the oracle about the nodes it can reach. That is two or three hundred lines of gossip protocol that has not been written yet.

The formal spec proves the key invariants on a simplified model. The code implements them in a real system. The gap between the two, the aggregation math, the jitter discount, the evidence decay, is where the interesting bugs will live if they show up.

---

## Practical lessons

**Model uncertainty as a first-class type.** If your system has places where "I don't know" is a valid answer, build a type that represents it explicitly. Do not use nil, -1, or boolean false. Once \`unknown\` is a real value in the type system, you cannot accidentally treat it as known.

**Separate evidence from conclusion.** The evidence set and the belief are different things. Evidence accumulates. Belief is computed from evidence on demand. This makes it easy to recompute beliefs with different decay parameters, add new evidence retroactively, or explain why the current belief is what it is.

**Timeouts are weak evidence by default.** Absence of response is not the same as evidence of absence. Build the weak-by-default assumption into the evidence weight, then let multiple corroborating weak signals accumulate into something actionable.

**Refusal is a valid answer.** Systems that can say "I don't know and won't guess" are safer than systems that always produce an answer. Callers can handle a refusal explicitly. They cannot handle a confidently wrong answer unless they independently verify it.

**Logical clocks for causality, not wall clocks.** Any time you are comparing "which event came first" across processes, wall clocks will eventually lie to you. Lamport timestamps are simple, cheap, and correct for the causality question.

**Death with finality prevents flapping.** If a node can come back from the dead with the same identity, membership systems develop weird corner cases around re-registration, stale state, and conflicting views. Making death irreversible and requiring a generation bump on rejoin eliminates the entire class of "is this the same node or a reborn one?" problems.
`
  }
];
