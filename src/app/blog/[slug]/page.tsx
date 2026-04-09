"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { posts } from "../data";
import { ChevronLeft } from "lucide-react";
import React from "react";

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

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeContent: string[] = [];

    return lines.map((line, i) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const code = codeContent.join('\n');
          codeContent = [];
          return (
            <pre key={i} className="my-8 p-5 rounded-xl bg-white/[0.03] border border-white/[0.05] overflow-x-auto shadow-2xl">
              <code className="text-[13px] font-mono text-neutral-300 leading-relaxed">
                {code}
              </code>
            </pre>
          );
        } else {
          inCodeBlock = true;
          return null;
        }
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return null;
      }

      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-[32px] md:text-[40px] font-bold text-white mt-12 mb-8 tracking-tighter leading-tight">{line.replace('# ', '')}</h1>;
      }
      
      if (line.startsWith('## ')) {
        const title = line.replace('## ', '');
        const id = title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
        return <h2 id={id} key={i} className="text-[20px] md:text-[24px] font-bold text-neutral-100 mt-12 mb-6 tracking-tight scroll-mt-24">{title}</h2>;
      }

      if (line.startsWith('> ')) {
        return (
          <div key={i} className="my-8 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-neutral-600" />
            <p className="text-[16px] md:text-[18px] text-neutral-300 italic leading-relaxed relative z-10">
              {line.replace('> ', '')}
            </p>
          </div>
        );
      }

      if (line.startsWith('---')) {
        return <hr key={i} className="my-12 border-white/[0.08]" />;
      }

      if (line.startsWith('- ')) {
        return (
          <div key={i} className="flex gap-3 mb-4 text-neutral-400 leading-relaxed text-[16px] pl-2">
            <span className="text-neutral-600 mt-1">•</span>
            <span>{line.replace('- ', '')}</span>
          </div>
        );
      }

      if (line.trim() === '') return <div key={i} className="h-4" />;

      const parts = line.split('`');
      if (parts.length > 1) {
        return (
          <p key={i} className="text-neutral-400 leading-relaxed text-[16px] mb-6">
            {parts.map((part, index) => 
              index % 2 === 1 ? (
                <code key={index} className="px-1.5 py-0.5 rounded bg-white/[0.07] text-neutral-200 font-mono text-[0.85em] border border-white/[0.05]">
                  {part}
                </code>
              ) : part
            )}
          </p>
        );
      }

      return <p key={i} className="text-neutral-400 leading-relaxed text-[16px] mb-6">{line}</p>;
    }).filter(el => el !== null);
  };

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
      </div>

      {/* Article Body */}
      <div className="blog-content prose prose-invert">
        {renderContent(post.content)}
      </div>
    </motion.article>
  );
}
