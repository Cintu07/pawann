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
      className="max-w-[700px] mx-auto w-full"
    >
      <div className="flex items-center gap-3 mb-10">
        <div className="h-[2px] w-6 bg-gradient-to-r from-neutral-300 to-transparent rounded" />
        <h1 className="text-[20px] font-semibold text-white tracking-wide leading-none">blog</h1>
      </div>
      
      <div className="space-y-6">
        {posts.map((post) => (
          <Link 
            key={post.slug} 
            href={`/blog/${post.slug}`}
            className="block group"
          >
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 transition-all duration-300 group-hover:bg-white/[0.04] group-hover:border-white/[0.1] backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                <h2 className="text-[18px] font-medium text-neutral-200 group-hover:text-white transition-colors tracking-tight">
                  {post.title}
                </h2>
                <span className="text-[12px] font-mono text-neutral-500 uppercase tracking-widest whitespace-nowrap">
                  {post.date}
                </span>
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed mb-4 max-w-[600px]">
                {post.description}
              </p>
              <div className="flex gap-2 flex-wrap">
                {post.tags.map(tag => (
                  <span key={tag} className="text-[10px] uppercase tracking-wider text-neutral-600 font-mono bg-black/20 px-2 py-0.5 rounded border border-white/[0.03]">
                     {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.main>
  );
}
