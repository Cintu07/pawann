export interface BlogPost {
  title: string;
  slug: string;
  date: string;
  description: string;
  content: string;
  tags: string[];
  imageURL?: string;
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

the standard story for running a neural network goes like this. install pytorch. install cuda. install a runtime. spin up a gpu. wait for warmup. get tokens out. **ciot is the version of that story where you delete every word after \"install\"**. a c++ binary opens a \`.bits\` file and produces tokens. that is the whole thing.

i started this because i wanted to know how fast ternary weights could actually run if you took the framework overhead seriously and stripped it. not how fast in theory, where you can wave your hands at flops, but how fast in practice on a laptop you actually own. the answer turns out to be: faster than i expected, by a factor of about six over a clean scalar baseline, and the code that gets you there is short enough to read in one sitting.

most of the engine is not the kernel. once the matvec is fast and correct, you still need a tokenizer, a model loader, a kv cache, a rope table, an attention loop, and a tiny transformer trainer to produce weights that aren't random. each one of those is a place where you can quietly leak performance with a bad layout or an allocator that does not align.

this post walks through the engine top to bottom. how the weights are stored, how they get from float32 down to three values without losing the signal, how the simd kernel goes branchless on three different instruction sets, how the rest of the transformer hangs off that kernel, and how every claim in the readme is verified bit-for-bit against a scalar reference. the first two or three commits on github are roughly what i posted on twitter and linkedin. everything else came after the matvec was correct and i wanted a real model running.

## why ternary

ternary networks store each weight as one of three values: -1, 0, or +1. a multiply by such a weight is not actually a multiply. it is an add, a no-op, or a subtract. a ternary matrix times a vector is a sequence of pick-or-skip-and-flip operations, which a cpu is extremely good at when the layout cooperates.

recent ternary-leaning research (bitnet 1.58b and the wave of follow-ups) shows that with the right training recipe, ternary weights cost surprisingly little accuracy versus float32. the catch is that to actually run them quickly you need a kernel that exploits the bit-level structure. blas does not have a \"ternary gemm\" routine. cublas does not either. so you write your own, or you give up the throughput and just store ternary values inside float32 like a coward.

ciot writes its own.

the choice of *three* values, not two, also matters. binary networks (-1, +1 only) are easier to encode but lose the ability to express \"this connection is irrelevant\", which turns out to be most of them. ternary keeps a sparsity dimension for free: anywhere a weight wanted to be near zero, it gets a zero. zeros cost no compute in the kernel because they appear in neither bit plane. you do not skip them with a branch. you just never read them in the first place. that is the property that lets ternary feel sparse without paying for sparsity bookkeeping.

the related work mostly lives in the \"1-bit\" and \"1.58-bit\" lineage: bitnet, the b1.58 paper, and a few hugging face threads on quantizing pretrained models down to ternary. all of it consistently shows that the accuracy gap from float to ternary is much smaller than the storage gap. the kernel side is where the published literature thins out. people benchmark gemm on simulated bit packings or fall back to int8 fused kernels. very few people write the actual bit-plane code on actual silicon. ciot is mostly an attempt to take that part seriously and write it down.

## storing 64 weights in 16 bytes

the storage layout is the first thing to get right. for ternary you want one bit-plane that answers \"is this weight +1\" and another that answers \"is this weight -1\". if both bits are zero, the weight is zero. you never explicitly store the zeros. you never store any redundancy. just two bits per weight.

![packing ternary weights into two bit planes](/ciot-bit-planes.png)

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

a 1024x1024 ternary matrix in this format takes 1024 * 16 * 2 = 32 kb for the bit planes plus 4 kb for scales. the same matrix as \`float32\` is 4 mb. that is a 113x compression ratio, and the layout is already in the exact shape simd wants. you didn't pay for it. it fell out of the encoding choice.

the \`.bits\` file on disk is the in-memory layout with a tiny header on top: an 8-byte magic string (\`CIOTBIT1\`), the dimensions, and \`blocks64\`, then the row scales, then \`pos_bits\`, then \`neg_bits\`. the loader reads four values, validates the magic, allocates aligned memory, and \`read()\`s the rest in two contiguous calls. no parser. no schema. mmap would work too. the file format is the array.

a few things about that layout that are worth saying out loud, because they took longer to get right than the kernel did:

**alignment is a property, not a hint.** every allocation in ciot goes through \`aligned_malloc\` with a 64-byte alignment, which is the cache line size on every cpu in the supported list. \`_mm512_maskz_load_ps\` faults at runtime if the pointer is not 64-byte aligned, so this is not optional on avx-512. the wrapper handles both posix (\`posix_memalign\`) and windows (\`_aligned_malloc\`) flavors so the same code compiles on a snapdragon laptop, a mac mini, and a desktop with a ryzen in it. the alignment is set once in \`Ciot.h\`, and the rest of the code reads from a single constant:

\`\`\`cpp
constexpr std::size_t CIOT_CACHELINE = 64;
constexpr std::uint32_t CIOT_TERNARY_BLOCK = 64;
\`\`\`

the two \`64\`s being equal is not a coincidence. one block of 64 ternary weights produces 16 bytes of bit-plane data, which is exactly one quarter of a cache line. four blocks fill a cache line. the prefetcher does the rest.

**row-major was the right call.** column-major would have packed the bits the other way and made batch-of-vectors easier, but the dominant operation in decode-time inference is \"one row at a time, accumulate one float into y[r]\". row-major lets each row's pos and neg arrays be a single contiguous span in memory. the inner loop reads \`pos_bits[row_base + b]\` and \`neg_bits[row_base + b]\` with stride 8 bytes. that is the easiest pattern for the cpu to handle.

**why two planes and not one packed nibble.** an obvious alternative is \"store each weight as 2 bits in a packed byte: 00 = 0, 01 = +1, 10 = -1, 11 = unused\". it sounds more compact but it is the same density (2 bits per weight either way), and it forces the kernel to do a per-element comparison to decide which of the three cases applies. with two planes, the kernel never makes a per-weight decision. it does the +1 work, then it does the -1 work, then it subtracts. zero weights handle themselves by being absent from both planes. the encoding choice and the kernel shape are the same idea written in two different files.

## getting from float to ternary without losing the signal

if you take a trained float matrix and naively round every weight to the nearest of {-1, 0, +1}, you get a ternary matrix that looks like the original and has lost most of its signal. all the small weights collapse to zero. the bigger weights get clamped at ±1. the row sums drift.

the fix is delta-sigma style error compensation. when you round one weight, the residual (what you threw away) gets added to the next weight before that one is rounded. a row full of small positive values does not lose them: every few weights the running residual crosses the threshold and emits a \`+1\` that captures the cumulative signal.

![error-compensated quantization](/ciot-quantization.png)

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

per-row scaling instead of per-matrix is the other deliberate choice. transformer weight matrices have rows that look very different from one another, especially after training. the q/k/v projections develop attention heads, and a \"head\" inside the weights is a band of rows with their own magnitude. a single matrix-wide scale would crush some bands and amplify others. per-row scales let each band live in its own dynamic range and recover correctly on the kernel side. the cost is the 4 kb of scales i mentioned above, which is the cheapest insurance you will ever buy for a network.

what ternary cannot represent is the fine relationships between weights of similar magnitude. two weights of value \`+0.21\` and \`+0.27\` both become \`+1\`. the kernel cannot tell them apart. for some layers this matters (the lm head, especially), and the right way to handle it is to train with ternary-aware loss, not to fix it after the fact. the included python trainer does this in the dumbest possible way (sgd, no fancy schedules) and it still gets reasonable behavior out of small models. a proper ternary fine-tuning recipe would go a lot further.

## the branchless simd kernel

this is the core of ciot. one function. three simd variants (avx-512, avx2, neon) and one scalar reference, all sharing the same shape. zero data-dependent branches in the hot loop.

the high-level idea: for each row \`r\`, walk down the row in chunks of 64 columns. for each chunk you have one \`uint64\` pos mask and one \`uint64\` neg mask. you load 4 or 8 or 16 floats from the input vector \`x\` (depending on the lane width). you turn the relevant bits of the mask into a vector boolean and use it to conditionally zero out the values. you accumulate into a separate \`acc_pos\` and \`acc_neg\`. at the end you do \`hsum(acc_pos - acc_neg)\` and multiply by the row scale.

the entire trick is the \"turn bits into a boolean vector\" step.

![branchless ternary matvec, one simd chunk](/ciot-simd.png)

## multi-head kv cache and interleaved buffers

during transformer generation, key and value vectors must be stored for every token in the sequence. for multi-head attention (mha), we have a key and a value vector per head. the standard way to store this is to allocate separate dynamic buffers per head or to resize the arrays on the fly. that is another place where allocation overhead and cache fragmentation will slowly kill your performance.

ciot allocates a single, contiguous, cache-aligned block of memory for both keys and values across all heads up to the maximum context length. the memory is interleaved by head to ensure that the inner attention loop, which iterates over the context tokens for a single head, can perform a perfectly contiguous linear walk through memory.

![multi-head kv cache, one interleaved buffer](/ciot-kv-cache.png)

each key and value slot is 64-byte aligned. appending a new token's key and value is a single \`memcpy\` per head. because the layout is pre-allocated and static, we never resize, we never allocate on the hot path, and we never miss cache lines. the addressing math is simple:

\`\`\`cpp
// index into the interleaved buffer
std::size_t offset = (2 * head_idx * max_tokens * head_dim) + (token_idx * head_dim);
\`\`\`

## production benchmarks

every optimization is only as good as the numbers it produces. i ran the test suite on a snapdragon x laptop (arm neon) using an optimized release build, and compared the results of our hand-written simd kernel against a clean scalar reference.

![production benchmarks](/ciot-benchmarks.png)

the hand-written arm neon kernel achieves a **5.7x speedup** over the scalar reference path. for a 1024x1024 linear matrix multiply against a vector, the median latency is just **0.54 ms**, delivering a peak throughput of **5.14 gop/s** (giga-operations per second). 

most importantly, every benchmark is verified bit-for-bit. the scalar reference and the optimized simd kernels produce identical output checksums. this means the simd version is not sacrificing numerical accuracy for speed. it is computing the exact same result, just doing it by exploiting the instruction set and the bit-plane layout.

## verifying correctness

when you write your own assembly or intrinsics, you are going to get it wrong. a bit shift by 63 instead of 64, a mask that is off by one, a missing sign extension, and the whole network produces garbage. 

to keep the development honest, the c++ binary has a built-in verification suite. it runs every matrix dimension from 64x64 up to 4096x4096, runs the scalar implementation, runs the simd implementation, and asserts that they match. if a single float differs by more than 1e-5, the build fails. 

this is why there are no dependencies in the project. to build it, you just run \`make\`. to test it, you run \`./ciot verify\`. that is the entire developer loop. the simplicity of the build is what keeps you focused on the code that actually runs on the silicon.
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
