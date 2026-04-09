"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { posts } from "../data";
import { ChevronLeft, Clock } from "lucide-react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function BlogPost() {
  const params = useParams();
  const post = posts.find((p) => p.slug === params.slug);

  const customEasing: Easing = [0.25, 0.1, 0.25, 1];
  const fade: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: customEasing } 
    }
  };

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 max-w-[700px] mx-auto w-full">
        <h1 className="text-2xl text-white mb-4">Post not found</h1>
        <Link href="/blog" className="text-neutral-500 hover:text-white transition-colors uppercase tracking-widest text-xs font-mono flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back to blog
        </Link>
      </div>
    );
  }

  return (
    <motion.article
      initial="hidden"
      animate="visible"
      variants={fade}
      className="max-w-[700px] mx-auto w-full pb-20"
    >
      <Link href="/blog" className="inline-flex items-center gap-2 text-[12px] font-mono text-neutral-500 hover:text-white transition-colors uppercase tracking-[0.2em] mb-12">
        <ChevronLeft className="w-4 h-4" /> Back to blog
      </Link>

      {/* Hero Image */}
      {post.imageURL && (
        <div className="relative aspect-[16/10] mb-10 rounded-2xl overflow-hidden shadow-2xl border border-white/[0.05]">
            <img 
            src={post.imageURL} 
            alt={post.title}
            className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Metadata */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {post.tags.map(tag => (
          <span key={tag} className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.05]">
            {tag}
          </span>
        ))}
      </div>

      <h1 className="text-[32px] md:text-[44px] font-semibold text-white mb-6 tracking-tight leading-[1.1] text-balance">
        {post.title}
      </h1>

      <div className="flex items-center gap-4 mb-12">
        <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-neutral-500">{post.date}</span>
        <span className="w-1 h-1 rounded-full bg-neutral-700" />
        <span className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.25em] text-neutral-500">
          <Clock className="w-3.1 h-3.1" /> 12 MIN READ
        </span>
      </div>

      {/* Article Body using ReactMarkdown */}
      <div className="blog-content prose prose-invert max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 className="text-[32px] md:text-[40px] font-bold text-white mt-12 mb-8 tracking-tighter leading-tight" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-[20px] md:text-[24px] font-bold text-neutral-100 mt-12 mb-6 tracking-tight" {...props} />,
            p: ({node, ...props}) => <p className="text-neutral-400 leading-relaxed text-[16px] mb-6" {...props} />,
            li: ({node, ...props}) => <li className="text-neutral-400 leading-relaxed text-[16px] mb-2 list-none flex gap-3"><span className="text-neutral-600 mt-1">•</span><span {...props} /></li>,
            code: ({node, className, children, ...props}: any) => {
              const match = /language-(\w+)/.exec(className || '');
              const isInline = !match;
              
              if (isInline) {
                return (
                  <code 
                    className="inline-flex items-center px-1.5 py-0 rounded-md bg-red-500/10 text-red-500 text-[0.85em] border border-red-500/10 font-mono align-baseline mx-0.5 leading-none" 
                    {...props}
                  >
                    {children}
                  </code>
                );
              }

              return (
                <div className="relative group my-8">
                    <pre className="p-6 rounded-xl bg-[#0d0d0d] border border-white/[0.05] overflow-x-auto shadow-2xl">
                        <code className="text-[13px] font-mono text-zinc-300 leading-relaxed" {...props}>
                            {children}
                        </code>
                    </pre>
                    <div className="absolute top-4 right-4 text-[9px] font-mono uppercase tracking-widest text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {match[1]}
                    </div>
                </div>
              );
            },
            blockquote: ({node, ...props}) => (
              <blockquote className="my-8 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] relative overflow-hidden group" {...props}>
                <div className="absolute top-0 left-0 w-1 h-full bg-neutral-600" />
                <div className="text-[16px] md:text-[18px] text-neutral-300 italic leading-relaxed relative z-10" />
              </blockquote>
            ),
            hr: ({node, ...props}) => <hr className="my-12 border-white/[0.08]" {...props} />,
            img: ({node, ...props}: any) => (
                <div className="my-10 rounded-2xl overflow-hidden border border-white/[0.05]">
                    <img className="w-full object-cover" {...props} alt={props.alt || "blog image"} />
                </div>
            )
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>
    </motion.article>
  );
}
