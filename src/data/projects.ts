// star counts read off the api on 2026-09-05.
// `featured` is what shows on the home page. picked for what they say about
// the work, not for star count.

export type Project = {
  name: string;
  description: string;
  url: string;
  stars: number;
  stack: string[];
  state?: "wip" | "shelved";
  featured?: boolean;
  // one line for the home page, where there is no room for the full description
  short?: string;
};

export const projects: Project[] = [
  {
    name: "ciot",
    description:
      "cpu inference for ternary neural nets. weights are -1, 0 or 1, so the matmul is adds and subtracts and no multiplies at all. c++ and simd intrinsics, no dependencies.",
    short: "ternary nets on cpu. no multiplies in the matmul, just adds and subtracts.",
    url: "https://github.com/Cintu07/ciot",
    stars: 23,
    stack: ["c++", "simd", "inference"],
    featured: true,
  },
  {
    name: "strata",
    description:
      "an inference engine for a 200b mixture of experts model on a 16gb laptop, where nvme sits on the critical path of every token and not just the cold start. two mechanisms, predicting which experts are needed several layers ahead, and scheduling prefill around experts rather than around layers. everyone else assumes the hot set eventually fits in ram.",
    short:
      "200b mixture of experts on a 16gb laptop, with nvme on the critical path of every token.",
    url: "https://github.com/Cintu07/strata",
    stars: 0,
    stack: ["rust", "moe", "nvme", "inference"],
    state: "wip",
    featured: true,
  },
  {
    name: "talos",
    description:
      "layer 4 firewall in ebpf and xdp. filtering happens in the kernel before the packet reaches the stack. dynamic blacklist, rate limits, tui on top.",
    short: "layer 4 firewall in ebpf. drops the packet before it reaches the stack.",
    url: "https://github.com/Cintu07/talos",
    stars: 3,
    stack: ["go", "c", "ebpf", "xdp"],
    featured: true,
  },
  {
    name: "kren",
    description:
      "shared memory ipc with no copies. one writer, many readers, a ring in mapped memory.",
    url: "https://github.com/Cintu07/kren",
    stars: 5,
    stack: ["rust", "ipc", "shared memory"],
  },
  {
    name: "wth-is-this",
    description:
      "point it at a repo you have never seen and it tells you the stack, the shape of the tree, and what looks wrong.",
    url: "https://github.com/Cintu07/wth-is-this",
    stars: 6,
    stack: ["javascript", "cli"],
  },
  {
    name: "shade",
    description:
      "a c++23 callable wrapper. inline buffer so small callables never touch the heap, a vtable per type, move only, and it keeps every signature qualifier.",
    url: "https://github.com/Cintu07/shade",
    stars: 4,
    stack: ["c++23", "templates"],
  },
  {
    name: "styx",
    description:
      "membership that refuses to lie. it hands back a probability instead of a boolean, because a gossip layer does not actually know.",
    url: "https://github.com/Cintu07/styx",
    stars: 4,
    stack: ["go", "distributed"],
  },
  {
    name: "aegis",
    description:
      "a proxy that speaks the postgres wire protocol. logs queries, routes reads away from writes, rewrites what it is allowed to, blocks what it is not.",
    url: "https://github.com/Cintu07/aegis",
    stars: 2,
    stack: ["go", "postgres", "wire protocol"],
  },
  {
    name: "void",
    description:
      "an ide that runs entirely in the tab. the toolchain is wasm, the workers are the processes, indexeddb is the disk. no server.",
    url: "https://github.com/Cintu07/void",
    stars: 3,
    stack: ["typescript", "wasm", "workers"],
  },
  {
    name: "golem",
    description:
      "four stl containers written from scratch in c++23. allocators, iterators, exception safety, the whole thing.",
    url: "https://github.com/Cintu07/golem",
    stars: 0,
    stack: ["c++23", "data structures"],
  },
  {
    name: "quifer",
    description:
      "finds sybil farms by fingerprinting the order of every transaction a wallet has ever made.",
    url: "https://github.com/Cintu07/quifer",
    stars: 1,
    stack: ["python", "graphs"],
  },
  {
    name: "iglegais",
    description: "memory. or a brain. still deciding which.",
    url: "https://github.com/phimemory/iglegais",
    stars: 3,
    stack: ["python", "memory"],
    state: "wip",
  },
];

export const featured = projects.filter((p) => p.featured);
