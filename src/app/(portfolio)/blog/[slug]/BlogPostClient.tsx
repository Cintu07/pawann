"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Clock } from "lucide-react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { BlogPost } from "../data";
import { CAPTION_MARK } from "@/lib/blog-caption";

export default function BlogPostClient({ post }: { post: BlogPost }) {
  const minutes = post.minutes ?? Math.max(1, Math.ceil(post.content.trim().split(/\s+/).length / 225));
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
    <motion.article
      initial="hidden"
      animate="visible"
      variants={fade}
      className="max-w-[700px] mx-auto w-full pb-20"
    >
      <Link href="/blog" className="inline-flex items-center gap-2 text-[12px] font-mono text-ink-faint hover:text-gold transition-colors uppercase tracking-[0.2em] mb-12">
        <ChevronLeft className="w-4 h-4" /> Back to blog
      </Link>

      {/* Hero Image */}
      {post.imageURL && (
        <div className="relative aspect-[16/10] mb-10 rounded-2xl overflow-hidden shadow-2xl border border-rule">
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
          <span key={tag} className="text-[10px] uppercase tracking-widest text-ink-faint font-mono px-2.5 py-1 rounded bg-surface-2/70 border border-rule">
            {tag}
          </span>
        ))}
      </div>

      <h1 className="text-[32px] md:text-[44px] font-semibold text-ink mb-6 tracking-tight leading-[1.1] text-balance">
        {post.title}
      </h1>

      <div className="flex items-center gap-4 mb-12">
        <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-ink-faint">{post.date}</span>
        <span className="w-1 h-1 rounded-full bg-neutral-700" />
        <span className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.25em] text-ink-faint">
          <Clock className="w-3.1 h-3.1" /> {minutes} MIN READ
        </span>
      </div>

      {/* Article Body using ReactMarkdown */}
      <div className="blog-content prose prose-invert max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 className="text-[32px] md:text-[40px] font-bold text-ink mt-12 mb-8 tracking-tighter leading-tight" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-[20px] md:text-[24px] font-bold text-neutral-100 mt-12 mb-6 tracking-tight" {...props} />,
            p: ({node, children, ...props}: any) => {
              const hasImg = node?.children?.some((child: any) => child.tagName === "img");
              if (hasImg) {
                return <>{children}</>;
              }
              const first = React.Children.toArray(children)[0];
              if (typeof first === "string" && first.startsWith(CAPTION_MARK)) {
                const rest = React.Children.toArray(children).slice(1);
                return <p className="font-mono text-[11.5px] text-ink-faint mt-8 -mb-6">{first.slice(CAPTION_MARK.length)}{rest}</p>;
              }
              return <p className="text-ink-soft leading-relaxed text-[16px] mb-6" {...props}>{children}</p>;
            },
            li: ({node, ...props}) => <li className="text-ink-soft leading-relaxed text-[16px] mb-2 list-none flex gap-3"><span className="text-ink-faint mt-1">•</span><span {...props} /></li>,
            code: ({node, className, children, ...props}: any) => {
              const match = /language-(\w+)/.exec(className || '');
              const isBlock = !!match || String(children).includes('\n') || String(children).length > 60 || String(children).startsWith('THEOREM');
              
              if (!isBlock) {
                return (
                  <code 
                    className="inline font-mono mx-0.5 break-words text-[13px] md:text-[14px] text-gold bg-surface-2/70 border border-rule px-1.5 py-0.5 rounded"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }

              return (
                <div className="my-8 rounded-xl overflow-hidden border border-rule shadow-2xl bg-[#0d0d0d]">
                    <SyntaxHighlighter
                        language={match ? match[1] : 'text'}
                        style={vscDarkPlus}
                        PreTag="div"
                        codeTagProps={{
                            style: {
                                fontSize: '13px',
                                fontFamily: 'var(--font-mono)',
                                lineHeight: '1.6'
                             }
                        }}
                        customStyle={{
                            margin: 0,
                            padding: '1.5rem',
                            background: 'transparent'
                        }}
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                </div>
              );
            },
            blockquote: ({node, children, ...props}: any) => (
              <blockquote className="my-8 p-6 rounded-2xl bg-surface-2/70 border border-rule relative overflow-hidden group" {...props}>
                <div className="absolute top-0 left-0 w-1 h-full bg-neutral-600" />
                <div className="text-[16px] md:text-[18px] text-ink-soft italic leading-relaxed relative z-10">
                  {children}
                </div>
              </blockquote>
            ),
            hr: ({node, ...props}) => <hr className="my-12 border-rule" {...props} />,
            img: ({node, ...props}: any) => (
                <div className="my-10 rounded-2xl overflow-hidden border border-rule">
                    <img className="w-full object-contain max-h-[500px]" {...props} alt={props.alt || "blog image"} />
                </div>
            ),
            table: ({node, ...props}) => (
              <div className="my-10 w-full overflow-x-auto rounded-2xl border border-rule bg-surface-2/40 shadow-xl">
                <table className="w-full text-left border-collapse text-[13px] md:text-[14px]" {...props} />
              </div>
            ),
            thead: ({node, ...props}) => <thead className="bg-surface-2/60 border-b border-rule" {...props} />,
            tbody: ({node, ...props}) => <tbody className="divide-y divide-white/[0.02]" {...props} />,
            tr: ({node, ...props}) => <tr className="hover:bg-surface-2/40 transition-colors" {...props} />,
            th: ({node, ...props}) => <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-soft" {...props} />,
            td: ({node, ...props}) => <td className="px-4 py-3.5 text-ink-soft font-sans align-middle leading-relaxed" {...props} />
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>
    </motion.article>
  );
}
