"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import Link from "next/link";
import type { BlogPost } from "./data";

function getReadingTime({ content, minutes: known }: BlogPost): string {
  const minutes = known ?? Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 225));
  return `${minutes} min read`;
}

export default function BlogList({ posts }: { posts: BlogPost[] }) {
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
      <div className="flex items-center gap-3 mb-12">
        <div className="h-[2px] w-6 bg-gradient-to-r from-neutral-300 to-transparent rounded" />
        <h1 className="text-[20px] font-semibold text-ink tracking-wide leading-none">blog</h1>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10 w-full">
        {posts.map((post) => {
          const readingTime = getReadingTime(post);
          return (
            <Link 
              key={post.slug} 
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-3 w-full"
            >
              {/* Cover Image */}
              {post.imageURL && (
                <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden border border-rule bg-neutral-900 group-hover:border-white/[0.1] transition-all duration-300 shadow-md">
                  <img 
                    src={post.imageURL} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-[102%] transition-transform duration-500"
                  />
                </div>
              )}
              
              {/* Tags */}
              <div className="flex gap-2 flex-wrap mt-1">
                {post.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[10px] font-semibold font-mono uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/15">
                     {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h2 className="text-[18px] font-bold text-neutral-100 group-hover:text-purple-300 transition-colors tracking-tight leading-snug">
                {post.title}
              </h2>

              {/* Description */}
              <p className="text-ink-soft text-[13px] leading-relaxed line-clamp-2">
                {post.description}
              </p>

              {/* Metadata */}
              <div className="flex items-center gap-2 text-ink-faint font-mono text-[9px] uppercase tracking-widest mt-1">
                <span>{post.date}</span>
                <span>•</span>
                <span>{readingTime}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.main>
  );
}

