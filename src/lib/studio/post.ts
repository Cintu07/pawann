// Everything between "markdown in the editor" and "files in the blog repo".

import { fencedBlocks, normalizeLang, type Meta } from "./convert";

export const IMAGE_DIR = "/assets/img/";

export interface Draft {
  title: string;
  slug: string;
  date: string;
  description: string;
  tags: string[];
  cover: string;
  body: string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function readingMinutes(markdown: string): number {
  return Math.max(1, Math.round(markdown.trim().split(/\s+/).filter(Boolean).length / 225));
}

function plain(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** the first paragraph that is plain prose, cut at a sentence or a word */
export function describe(markdown: string, max = 160): string {
  const paragraphs = markdown.split(/\n{2,}/);
  for (const p of paragraphs) {
    const t = p.trim();
    if (!t || /^(#|>|```|~~~|!\[|[-*+]\s|\d+[.)]\s|\||<)/.test(t)) continue;
    const text = plain(t);
    if (text.length < 20) continue;
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const sentence = cut.lastIndexOf(". ");
    if (sentence > max * 0.5) return cut.slice(0, sentence + 1);
    return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s]+$/, "");
  }
  return "";
}

const TAG_NAMES: Record<string, string> = {
  rust: "rust", go: "go", typescript: "typescript", javascript: "javascript", python: "python", c: "c", cpp: "c++", java: "java", sql: "sql",
};

export function suggestTags(markdown: string): string[] {
  const counts = new Map<string, number>();
  for (const b of fencedBlocks(markdown)) {
    const lang = normalizeLang(b.lang);
    const tag = lang ? TAG_NAMES[lang] : undefined;
    if (tag) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
}

export function stripLeadingTitle(markdown: string, title: string): string {
  const m = /^\s*#\s+(.+)\n+/.exec(markdown);
  if (m && m[1].trim().toLowerCase() === title.trim().toLowerCase()) return markdown.slice(m[0].length);
  return markdown;
}

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

export function buildPostFile(d: Draft): string {
  const head = [
    "---",
    `title: ${oneLine(d.title)}`,
    `date: ${d.date}`,
    `description: ${oneLine(d.description)}`,
    `tags: ${d.tags.map(oneLine).filter(Boolean).join(", ")}`,
    d.cover ? `cover: ${d.cover}` : null,
    "---",
    "",
  ].filter((l) => l !== null).join("\n");
  return head + stripLeadingTitle(d.body, d.title).trim() + "\n";
}

export function referencedImages(markdown: string): string[] {
  const names = new Set<string>();
  const re = /!\[[^\]]*\]\((\/assets\/img\/[^)\s]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown))) names.add(m[1].slice(IMAGE_DIR.length));
  return [...names];
}

export interface Extracted {
  markdown: string;
  files: { name: string; content: string }[];
}

/** raw <svg> blocks and inline-svg fences become files, so the blog can serve them as images */
export function extractSvgs(markdown: string, slug: string): Extracted {
  const files: Extracted["files"] = [];
  const next = () => `${slug || "post"}-diagram-${files.length + 1}.svg`;
  const add = (svg: string) => {
    const name = next();
    files.push({ name, content: svg.trim() + "\n" });
    return `![diagram](${IMAGE_DIR}${name})`;
  };

  const parts = markdown.split(/(^(?:`{3,}|~{3,})[^\n]*\n[\s\S]*?\n(?:`{3,}|~{3,})[ \t]*$)/gm);
  const out = parts.map((part) => {
    const fence = /^(`{3,}|~{3,})\s*(\S*)[^\n]*\n([\s\S]*?)\n(?:`{3,}|~{3,})[ \t]*$/.exec(part);
    if (fence) return fence[2] === "inline-svg" ? add(fence[3]) : part;
    return part.replace(/<svg\b[\s\S]*?<\/svg>/gi, (svg) => add(svg));
  });
  return { markdown: out.join(""), files };
}

export function metaToDraft(meta: Meta, body: string): Partial<Draft> {
  return {
    title: meta.title,
    date: meta.date,
    description: meta.description,
    tags: meta.tags,
    cover: meta.cover,
    body,
  };
}
