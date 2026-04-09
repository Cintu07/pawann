"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import Link from "next/link";
import { posts } from "./data";

export default function Blog() {
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
      className="w-full"
    >
      <div className="flex items-center gap-3 mb-16">
        <div className="h-[2px] w-6 bg-gradient-to-r from-neutral-300 to-transparent rounded" />
        <h1 className="text-[20px] font-semibold text-white tracking-wide leading-none uppercase tracking-[0.2em]">blog</h1>
      </div>
      
      <div className="flex flex-col border-t border-white/[0.05]">
        {posts.map((post) => (
          <Link 
            key={post.slug} 
            href={`/blog/${post.slug}`}
            className="group relative block"
          >
            <div className="py-10 border-b border-white/[0.05] transition-all duration-500 group-hover:px-4 -mx-4">
              <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.3em]">
                    {post.date}
                  </span>
                  <div className="flex gap-2">
                    {post.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[9px] uppercase tracking-widest text-neutral-600 font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <h2 className="text-[24px] md:text-[32px] font-medium text-neutral-200 group-hover:text-white transition-all duration-500 tracking-tighter leading-tight mb-4">
                  {post.title}
                </h2>

                <p className="text-neutral-500 group-hover:text-neutral-400 text-[15px] leading-relaxed max-w-[640px] transition-colors duration-500">
                  {post.description}
                </p>

                <div className="mt-8 flex items-center gap-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                   Read content <span className="text-neutral-600">→</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.main>
  );
}
