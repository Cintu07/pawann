"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import { FiStar } from "react-icons/fi";
import { VscRepoForked } from "react-icons/vsc";

const projects = [
  {
    name: "void",
    description: "A fully serverless, browser-native IDE where the entire operating system runs client‑side via WebAssembly, Web Workers, and IndexedDB.",
    url: "https://github.com/Cintu07/void",
    stars: 3,
    forks: 0,
    stack: ["typescript", "wasm", "client-side"]
  },
  {
    name: "talos",
    description: "High-performance Layer 4 firewall using eBPF/XDP. Kernel-fast packet filtering with dynamic blacklisting, rate limiting, and real-time TUI dashboard. Written in Go and C.",
    url: "https://github.com/Cintu07/talos",
    stars: 2,
    forks: 0,
    stack: ["go", "c", "ebpf", "xdp", "networking"]
  },
  {
    name: "kren",
    description: "Zero-Copy Shared Memory IPC Library. High-throughput and extremely low latency process communication layer.",
    url: "https://github.com/Cintu07/kren",
    stars: 4,
    forks: 0,
    stack: ["rust", "ipc", "shared-memory"]
  },
  {
    name: "styx",
    description: "Distributed membership system that refuses to lie. Returns probability distributions instead of booleans for systemic consistency.",
    url: "https://github.com/Cintu07/styx",
    stars: 3,
    forks: 0,
    stack: ["go", "distributed-systems"]
  },
  {
    name: "aegis",
    description: "PostgreSQL wire-protocol proxy. Query logging, safe rewrites, read/write routing, rate limiting, and policy enforcement.",
    url: "https://github.com/Cintu07/aegis",
    stars: 1,
    forks: 0,
    stack: ["go", "postgres", "proxy"]
  },
  {
    name: "ares",
    description: "Inference-time reasoning framework. Trade compute for correctness.",
    url: "https://github.com/Cintu07/ares",
    stars: 3,
    forks: 0,
    stack: ["python", "ai", "inference"]
  },
  {
    name: "yarnix",
    description: "Advanced context-engine for streamlined inference caching and parsing.",
    url: "https://github.com/Cintu07/yarnix",
    stars: 0,
    forks: 0,
    stack: ["python", "machine-learning"]
  },
  {
    name: "helix",
    description: "Rotation-based memory that never decays. Experimental AI state memory system.",
    url: "https://github.com/Cintu07/helix",
    stars: 1,
    forks: 0,
    stack: ["python", "ai-memory"]
  }
];

export default function Projects() {
  const customEasing: Easing = [0.25, 0.1, 0.25, 1];
  const fade: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: customEasing } 
    }
  };

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={fade}
      className="max-w-[700px] mx-auto w-full"
    >
      <div className="flex items-center gap-3 mb-10">
        <div className="h-[2px] w-6 bg-gradient-to-r from-neutral-300 to-transparent rounded" />
        <h1 className="text-[20px] font-semibold text-white tracking-wide leading-none">Top Projects</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {projects.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="group relative rounded-xl bg-gradient-to-r from-zinc-700/50 to-stone-700/50 p-[1px] hover:scale-[102%] hover:shadow-2xl hover:shadow-white/5 transition-all duration-300"
          >
            <div className="flex flex-col h-full justify-between bg-[#111] p-5 rounded-[11px] overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              <div className="relative z-10 mb-6">
                <h2 className="text-[18px] font-semibold text-zinc-200 group-hover:text-white transition-colors tracking-tight leading-none mb-3">
                  {p.name}
                </h2>
                <p className="text-[14px] text-zinc-400 leading-relaxed tracking-tight">
                  {p.description}
                </p>
              </div>
              
              <div className="flex gap-6 relative z-10 items-center">
                <div className="flex text-zinc-500 gap-1.5 text-sm items-center font-medium font-mono">
                  <FiStar />
                  <p className="m-0 leading-none mt-0.5">{p.stars}</p>
                </div>
                {p.forks > 0 && (
                  <div className="flex text-zinc-500 gap-1.5 text-sm items-center font-medium font-mono">
                    <VscRepoForked />
                    <p className="m-0 leading-none mt-0.5">{p.forks}</p>
                  </div>
                )}
                
                {/* Tech stack pill (showing just primary) */}
                <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-500 font-mono px-2 py-0.5 rounded border border-white/5 bg-white/[0.02]">
                  {p.stack[0]}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </motion.main>
  );
}
