"use client";

import React, { memo, useMemo, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { fencedBlocks, highlight, LANGS, normalizeLang, type Lang } from "@/lib/studio/convert";
import { SITE } from "@/lib/studio/publish";
import { CAPTION_MARK } from "@/lib/blog-caption";
import { splitSections } from "@/lib/studio/sections";

const PLUGINS = [remarkGfm];

const CodeBlock = memo(function CodeBlock({ code, lang, captioned, index, onLang }: {
  code: string;
  lang: Lang;
  captioned: boolean;
  /** which fenced block of the whole post this is, or -1 when it cannot be told */
  index: number;
  onLang: (index: number, lang: Lang) => void;
}) {
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => highlight(code, lang), [code, lang]);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={captioned ? "studio-code captioned" : "studio-code"}>
      <div className="studio-code-bar">
        <select value={lang} onChange={(e) => index >= 0 && onLang(index, e.target.value as Lang)} aria-label="language">
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
});

interface SectionProps {
  text: string;
  fenceBase: number;
  images: Record<string, string>;
  onLang: (index: number, lang: Lang) => void;
}

/**
 * One stretch of the post. Its props are a string and a few stable things, so when a keystroke lands in
 * another section React skips this one, and the markdown in it is not parsed or highlighted again.
 */
const Section = memo(function Section({ text, fenceBase, images, onLang }: SectionProps) {
  const blocks = useMemo(() => fencedBlocks(text), [text]);
  const lines = useMemo(() => text.split("\n"), [text]);

  const components = useMemo<Components>(() => {
    const captionedAt = (line?: number) => {
      if (!line) return false;
      let i = line - 2;
      while (i >= 0 && !lines[i].trim()) i--;
      return i >= 0 && lines[i].startsWith(CAPTION_MARK);
    };
    return {
      pre: ({ node, children }) => {
        const child = React.Children.toArray(children)[0] as React.ReactElement<{ className?: string; children?: React.ReactNode }> | undefined;
        const tag = /language-(\S+)/.exec(child?.props?.className ?? "")?.[1];
        const lang = normalizeLang(tag) ?? "text";
        const code = String(child?.props?.children ?? "").replace(/\n$/, "");
        const line = node?.position?.start.line;
        const local = blocks.findIndex((b) => b.line === line);
        return <CodeBlock code={code} lang={lang} captioned={captionedAt(line)} index={local >= 0 ? fenceBase + local : -1} onLang={onLang} />;
      },
      p: ({ children }) => {
        const kids = React.Children.toArray(children);
        const first = kids[0];
        if (typeof first === "string" && first.startsWith(CAPTION_MARK)) {
          return <p className="code-caption">{first.slice(CAPTION_MARK.length)}{kids.slice(1)}</p>;
        }
        return <p>{children}</p>;
      },
      img: ({ src, alt }) => {
        const own = typeof src === "string" ? src : "";
        // a post opened from the blog points at images that live on the blog
        const url = images[own] ?? (own.startsWith("/assets/") ? SITE.url + own : own);
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={url} alt={alt ?? ""} decoding="async" loading="lazy" />;
      },
      a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noreferrer">{children}</a>
      ),
      table: ({ children }) => (
        <div className="studio-table"><table>{children}</table></div>
      ),
    };
  }, [blocks, lines, fenceBase, images, onLang]);

  return <ReactMarkdown remarkPlugins={PLUGINS} components={components}>{text}</ReactMarkdown>;
});

interface Props {
  markdown: string;
  title: string;
  byline: string;
  /** "/assets/img/x.png" to a blob url for images that only exist in the editor */
  images: Record<string, string>;
  onLang: (index: number, lang: Lang) => void;
}

function Preview({ markdown, title, byline, images, onLang }: Props) {
  // "slope.py" over "{: .code-caption }" is a caption on the blog. here it becomes a marked paragraph,
  // which keeps the fenced blocks in the same order so the language picker still finds its block
  const shown = useMemo(() => markdown.replace(/^(.+)\n\{: \.code-caption \}$/gm, `${CAPTION_MARK}$1\n`), [markdown]);
  const sections = useMemo(() => splitSections(shown), [shown]);

  return (
    <div className="studio-prose">
      {title && <h1>{title}</h1>}
      {byline && <p className="byline">{byline}</p>}
      {sections.map((s, i) => (
        <Section key={i} text={s.text} fenceBase={s.fenceBase} images={images} onLang={onLang} />
      ))}
    </div>
  );
}

export default memo(Preview);
