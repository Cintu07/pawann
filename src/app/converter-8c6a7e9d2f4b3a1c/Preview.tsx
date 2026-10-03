"use client";

import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { fencedBlocks, highlight, LANGS, normalizeLang, type Lang } from "@/lib/studio/convert";
import { SITE } from "@/lib/studio/publish";

function CodeBlock({ code, lang, onLang }: { code: string; lang: Lang; onLang: (lang: Lang) => void }) {
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => highlight(code, lang), [code, lang]);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="studio-code">
      <div className="studio-code-bar">
        <select value={lang} onChange={(e) => onLang(e.target.value as Lang)} aria-label="language">
          {LANGS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <button type="button" onClick={copy}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
    </div>
  );
}

interface Props {
  markdown: string;
  title: string;
  byline: string;
  /** "/assets/img/x.png" to a blob url for images that only exist in the editor */
  images: Record<string, string>;
  onLang: (index: number, lang: Lang) => void;
}

export default function Preview({ markdown, title, byline, images, onLang }: Props) {
  const blocks = useMemo(() => fencedBlocks(markdown), [markdown]);

  return (
    <div className="studio-prose">
      {title && <h1>{title}</h1>}
      {byline && <p className="byline">{byline}</p>}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ node, children }) => {
            const child = React.Children.toArray(children)[0] as React.ReactElement<{ className?: string; children?: React.ReactNode }> | undefined;
            const tag = /language-(\S+)/.exec(child?.props?.className ?? "")?.[1];
            const lang = normalizeLang(tag) ?? "text";
            const code = String(child?.props?.children ?? "").replace(/\n$/, "");
            const line = node?.position?.start.line;
            const index = blocks.findIndex((b) => b.line === line);
            return <CodeBlock code={code} lang={lang} onLang={(l) => index >= 0 && onLang(index, l)} />;
          },
          img: ({ src, alt }) => {
            const own = typeof src === "string" ? src : "";
            // a post opened from the blog points at images that live on the blog
            const url = images[own] ?? (own.startsWith("/assets/") ? SITE.url + own : own);
            // eslint-disable-next-line @next/next/no-img-element
            return <img src={url} alt={alt ?? ""} />;
          },
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">{children}</a>
          ),
          table: ({ children }) => (
            <div className="studio-table"><table>{children}</table></div>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
