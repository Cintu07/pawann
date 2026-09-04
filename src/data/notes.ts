// the titles, states, dates and star counts all come live from github.
// this file is only the part the api cannot know: what the bug actually was.
// keyed by "owner/repo#number". anything without an entry just shows its title.

export const notes: Record<string, string> = {
  "apache/arrow-rs#10981":
    "concat narrowed the combined value length with an unchecked `as i32`, so a caller-controlled element width wrapped negative. the fallible pattern it needed was already in use directly above it in the same function.",
  "apache/arrow-rs#10983":
    "substring wraps start and length to i32 on Utf8 but not on LargeUtf8. same call, same data, different answer depending on which offset width the array happens to use.",
  "HelixDB/helix-db#1075":
    "the neon and scalar distance kernels disagree on 38% of random vector pairs at 22 dimensions and 93% at 1536, worst case 30 ulp. the existing equivalence test fed them integers, where every intermediate is exactly representable, so it agreed bit for bit and could not fail. i confirmed the replacement can fail by tightening its tolerance until it did.",
  "HelixDB/helix-db#1050":
    "proved the louvain modularity test could not fail. injected one bug, then made the old whole-phase test pass and a new per-move test fail on the same bug.",
  "HelixDB/helix-db#1038":
    "net minus 109 lines. the build stopped needing openssl on the host at all.",
  "LMCache/LMCache#4904":
    "two different tag sets serialise to the same cache key. that key is both the on-disk filename and the remote object key, so one entry silently reads back as another.",
  "tinygrad/tinygrad#15925":
    "TRUNC had no backward pass, so any gradient flowing through it was dropped silently rather than erroring. four lines.",
  "tinygrad/tinygrad#15811":
    "the cuda toolchain version was missing from the compile cache key, so a toolchain upgrade served stale kernels.",
  "tinygrad/tinygrad#15806":
    "nan propagating out of the inactive branch of a where, through sqrt backward.",
  "slatedb/slatedb#2072":
    "pinned the bincode variant index for the v3 cache keys, so reordering an enum cannot silently reinterpret data already written to disk.",
  "hydra-db/hydradb#162":
    "the query optimizer returns different rows depending on which direction it expands the plan. this is the differential test that pins both orders to the same result.",
  "hydra-db/hydradb#149":
    "randomised differential tests over the sparse traversal kernels.",
  "hydra-db/hydradb#148":
    "the sparse kernels disagree on a zero-hop start that has no edges.",
  "hydra-db/hydradb#147":
    "one high-degree vertex could blow the whole result budget, because the cap was on vertices and not on rows.",
  "hydra-db/hydradb#163":
    "synthetic bolt relationship ids collided with the real id range.",
  "ai-dynamo/dynamo#14329":
    "request-trace header capture matched only exact keys, so prefixed headers were missed and sensitive ones could not be excluded. nvidia's inference runtime, rust.",
  "supermemoryai/supermemory#1164":
    "a retrieval against an empty profile returned an error instead of an empty result, so every first-time user looked like a failure rather than a cold start.",
  "supermemoryai/supermemory#1236":
    "i filed the issue first, then sent the pin that fixed it.",
  "rux-lang/Rux#34":
    "the integer ** operator crashed every program that used it.",
  "rux-lang/Rux#58":
    "\\u{...} escapes were being dropped in HIR string and char literals.",
  "dodopayments/dodo-adapters#90":
    "the string 'false' was parsing as true, so nobody could turn the email off.",
};

// github descriptions are terse and some of mine are jokes. this replaces them
// on the site only. anything not listed falls back to the real repo description.
export const projectCopy: Record<
  string,
  { description: string; stack: string[]; state?: "wip"; short?: string }
> = {
  ciot: {
    description:
      "cpu inference for ternary neural nets. weights are -1, 0 or 1, so the matmul is adds and subtracts and no multiplies at all. hand written simd, no third party dependencies.",
    short: "ternary nets on cpu. no multiplies in the matmul, just adds and subtracts.",
    stack: ["c++23", "simd", "inference"],
  },
  strata: {
    description:
      "an inference engine for a 200b mixture of experts model on a 16gb laptop, where nvme sits on the critical path of every token and not just the cold start. two mechanisms: predicting which experts are needed several layers ahead, and scheduling prefill around experts rather than around layers.",
    short: "200b mixture of experts on a 16gb laptop, nvme on the critical path of every token.",
    stack: ["rust", "moe", "nvme"],
    state: "wip",
  },
  kren: {
    description:
      "shared memory ipc with no copies. one writer, many readers, a ring buffer in mapped memory, nothing serialised on the hot path.",
    short: "zero copy shared memory ipc. one writer, many readers.",
    stack: ["rust", "ipc", "mmap"],
  },
  aegis: {
    description:
      "a proxy that speaks the postgres wire protocol directly. logs queries, routes reads away from writes, rewrites what it is allowed to and blocks what it is not.",
    short: "postgres wire protocol proxy. read/write routing and policy in the middle.",
    stack: ["go", "postgres", "wire protocol"],
  },
  talos: {
    description:
      "layer 4 firewall in ebpf and xdp. filtering happens in the kernel at the xdp hook, before the packet reaches the network stack. dynamic blacklist, rate limits, tui on top.",
    short: "layer 4 firewall in ebpf. drops the packet before it reaches the stack.",
    stack: ["go", "c", "ebpf", "xdp"],
  },
  shade: {
    description:
      "a c++23 callable wrapper covering the same ground as std::function, with the storage, dispatch and lifetime written from scratch. inline buffer so small targets never touch the heap, per type vtable, move only, every signature qualifier preserved.",
    stack: ["c++23", "templates"],
  },
  styx: {
    description:
      "membership that refuses to lie. it hands back a probability instead of a boolean, because a gossip layer does not actually know.",
    stack: ["go", "distributed"],
  },
  golem: {
    description:
      "four stl containers written from scratch in c++23. optional, vector, variant, unordered_map. real allocator support, manual lifetimes, exception safety.",
    stack: ["c++23", "data structures"],
  },
  quifer: {
    description:
      "finds sybil farms by fingerprinting the order of every transaction a wallet has ever made, then clustering the wallets whose orderings match.",
    stack: ["python", "graphs"],
  },
  void: {
    description:
      "an ide that runs entirely in the tab. the toolchain is wasm, web workers are the processes, indexeddb is the disk. no server anywhere.",
    stack: ["typescript", "wasm", "workers"],
  },
  iglegais: { description: "memory. or a brain. still deciding which.", stack: ["python"], state: "wip" },
  helix: {
    description: "rotation based memory that does not decay. a recurrent cell that swaps gating for rotation on a complex valued phase manifold.",
    stack: ["python", "pytorch"],
  },
  yarnix: {
    description: "context engine on top of helix. 2m parameters, generates text on cpu, no gpu anywhere.",
    stack: ["python", "pytorch"],
  },
  hyli: { description: "voice agent that remembers you between calls.", stack: ["go", "telephony"] },
  "wth-is-this": {
    description: "point it at a repo you have never seen and it tells you the stack, the shape of the tree, and what looks wrong.",
    stack: ["javascript", "cli"],
  },
  fortisUI: { description: "dither ui components. react, no dependencies.", stack: ["typescript", "react"] },
  FontPeek: { description: "chrome extension that tells you the font under any text you select.", stack: ["javascript"] },
  "code-detox": {
    description: "points at a javascript repo and finds what nobody deleted. dead files, unused exports, components nothing renders, imports that go nowhere.",
    stack: ["typescript", "cli"],
  },
  commitcraft: { description: "writes the commit message from the diff, so the log stops saying \"fix\".", stack: ["javascript", "cli"] },
};

// what shows on the home page, in this order.
export const FEATURED = ["ciot", "strata", "aegis"];
