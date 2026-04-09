"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { posts } from "../data";
import { ChevronLeft } from "lucide-react";

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
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-2xl text-white mb-4">Post not found</h1>
        <Link href="/blog" className="text-neutral-500 hover:text-white transition-colors uppercase tracking-widest text-xs font-mono flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back to blog
        </Link>
      </div>
    );
  }

  // Simple Markdown-to-JSX parser for basic styles
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
            <pre key={i} className="my-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] overflow-x-auto">
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
        return <h1 key={i} className="text-[32px] font-semibold text-white mt-12 mb-6 tracking-tight leading-tight">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-[24px] font-semibold text-neutral-100 mt-10 mb-5 tracking-tight">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('---')) {
        return <hr key={i} className="my-10 border-white/[0.08]" />;
      }
      if (line.startsWith('- ')) {
        return <div key={i} className="flex gap-3 mb-3 text-neutral-400 leading-relaxed text-[16px]">
          <span className="text-neutral-600">•</span>
          <span>{line.replace('- ', '')}</span>
        </div>;
      }
      if (line.trim() === '') {
        return <div key={i} className="h-4" />;
      }

      // Simple handling for inline backticks
      const parts = line.split('`');
      if (parts.length > 1) {
          return (
              <p key={i} className="text-neutral-400 leading-relaxed text-[16px] mb-4">
                  {parts.map((part, index) => 
                      index % 2 === 1 ? (
                          <code key={index} className="px-1.5 py-0.5 rounded bg-white/[0.05] text-neutral-300 font-mono text-[0.9em]">
                              {part}
                          </code>
                      ) : part
                  )}
              </p>
          );
      }

      return <p key={i} className="text-neutral-400 leading-relaxed text-[16px] mb-4">{line}</p>;
    }).filter(el => el !== null);
  };

  return (
    <motion.article
      initial="hidden"
      animate="visible"
      variants={fade}
      className="max-w-[700px] mx-auto pb-20"
    >
      <Link href="/blog" className="inline-flex items-center gap-2 text-[12px] font-mono text-neutral-500 hover:text-white transition-colors uppercase tracking-widest mb-12">
        <ChevronLeft className="w-4 h-4" /> Back to blog
      </Link>

      <div className="mb-12">
        <div className="flex gap-2 mb-4">
          {post.tags.map(tag => (
            <span key={tag} className="text-[10px] uppercase tracking-wider text-neutral-600 font-mono">
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-[40px] font-bold text-white tracking-tight leading-tight mb-4">
          {post.title}
        </h1>
        <p className="text-neutral-500 font-mono text-xs uppercase tracking-[0.2em]">
          {post.date}
        </p>
      </div>

      <div className="blog-content">
        {renderContent(post.content)}
      </div>
    </motion.article>
  );
}
