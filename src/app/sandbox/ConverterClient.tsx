"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent } from "react";
import Link from "next/link";
import { Bold, ChevronLeft, Code, Download, Heading2, Image as ImageIcon, Italic, Link as LinkIcon, Quote, Sparkles, Trash2, Upload, X, Copy, Check } from "lucide-react";
import "./studio.css";
import Preview from "./Preview";
import { detectLanguage, fence, looksLikeHtmlDocument, parseFrontmatter, setFenceLang, toMarkdown, type ConvertResult, type Lang } from "@/lib/studio/convert";
import { buildPostFile, describe, extractSvgs, IMAGE_DIR, readingMinutes, referencedImages, slugFromTitle, slugify, stripLeadingTitle, suggestTags, today } from "@/lib/studio/post";
import { commitFiles, explain, fileExists, readText, SITE, upsertBook, waitForDeploy, whoami, type BookEntry, type PublishFile } from "@/lib/studio/publish";
import { clearImages, loadImages, removeImage, saveImage } from "@/lib/studio/store";
import { entryBytes, pdfTitle, readTgz, summarize } from "@/lib/studio/archive";

const DRAFT_KEY = "pawan_studio_draft_v2";
const OLD_DRAFT_KEY = "pawan_blog_draft";
const TOKEN_KEY = "pawan_studio_gh_token";

interface Fields {
  title: string;
  slug: string;
  slugSet: boolean;
  date: string;
  description: string;
  descSet: boolean;
  tags: string;
  tagsSet: boolean;
  cover: string;
}

const BLANK: Fields = { title: "", slug: "", slugSet: false, date: "", description: "", descSet: false, tags: "", tagsSet: false, cover: "" };

interface Img {
  name: string;
  mime: string;
  bytes: Uint8Array;
  url: string;
}

type Layout = "edit" | "split" | "preview";

const isImage = (f: File) => f.type.startsWith("image/") || /\.(svg|png|jpe?g|gif|webp|avif)$/i.test(f.name);
const isPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);
/** a source bundle: .tgz or .tar.gz */
const isBundle = (f: File) => /\.(tgz|tar\.gz)$/i.test(f.name);
const mb = (n: number) => `${(n / 1_000_000).toFixed(1)} mb`;
const nameToTitle = (name: string) => name.replace(/\.(pdf|tgz|tar\.gz)$/i, "").replace(/[-_]+/g, " ");
/** github refuses a file over 100 MB, and a push with one in it fails after the whole upload */
const GITHUB_FILE_LIMIT = 95_000_000;

function extensionFor(file: File): string {
  const fromName = /\.([a-z0-9]+)$/i.exec(file.name)?.[1]?.toLowerCase();
  if (fromName && /^(png|jpe?g|gif|webp|avif|svg)$/.test(fromName)) return fromName === "jpeg" ? "jpg" : fromName;
  const fromMime = file.type.split("/")[1]?.replace("+xml", "").replace("jpeg", "jpg");
  return fromMime || "png";
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function looksStructured(html: string): boolean {
  return /<(h[1-6]|pre|ul|ol|table|blockquote|img|p)[\s>]/i.test(html);
}

/** blank lines around a block so it does not glue itself to the text beside it */
function pad(before: string, after: string, text: string): string {
  const lead = before === "" || /\n\n$/.test(before) ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const tail = after === "" || /^\n\n/.test(after) ? "" : after.startsWith("\n") ? "\n" : "\n\n";
  return lead + text.replace(/\n+$/, "") + tail;
}

const isBlock = (md: string) => /^(```|~~~|#{1,6}\s|>\s|\|)/.test(md) || md.includes("\n\n");

/** point image links at the names the images were stored under */
const rewriteImageRefs = (text: string, byOriginal: Map<string, string>) =>
  text.replace(/!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g, (whole, alt: string, src: string) => {
    const stored = byOriginal.get(decodeURIComponent(src.split(/[\\/]/).pop() ?? "").toLowerCase());
    return stored ? `![${alt}](${IMAGE_DIR}${stored})` : whole;
  });

export default function ConverterClient() {
  const [md, setMd] = useState("");
  const [f, setF] = useState<Fields>(BLANK);
  const [layout, setLayout] = useState<Layout>("split");
  const [images, setImages] = useState<Record<string, Img>>({});
  const [report, setReport] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [saved, setSaved] = useState("");
  const [panel, setPanel] = useState(false);
  const [token, setToken] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [liveUrls, setLiveUrls] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [posts, setPosts] = useState<string[] | null>(null);
  const [kind, setKind] = useState<"post" | "book">("post");
  const [book, setBook] = useState({ title: "", subtitle: "", blurb: "", year: String(new Date().getFullYear()) });
  const [pdf, setPdf] = useState<File | null>(null);
  const [code, setCode] = useState<File | null>(null);

  const ta = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<Record<string, Img>>({});
  const hydrated = useRef(false);

  // ---------------------------------------------------------------- load / save

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as { md: string } & Partial<Fields>;
        setMd(d.md ?? "");
        setF({ ...BLANK, ...d, date: d.date || today() });
      } else {
        setF({ ...BLANK, date: today() });
        const old = localStorage.getItem(OLD_DRAFT_KEY);
        if (old) setMd(old);
      }
      setToken(localStorage.getItem(TOKEN_KEY) ?? "");
    } catch {
      setF({ ...BLANK, date: today() });
    }
    if (window.innerWidth < 900) setLayout("edit");
    loadImages().then((stored) => {
      const next: Record<string, Img> = {};
      for (const s of stored) {
        const bytes = new Uint8Array(s.bytes);
        next[s.name] = { name: s.name, mime: s.mime, bytes, url: URL.createObjectURL(new Blob([bytes], { type: s.mime })) };
      }
      imagesRef.current = next;
      setImages(next);
    });
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ md, ...f }));
        setSaved("saved in this browser");
      } catch {
        setSaved("could not save, storage is full");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [md, f]);

  // -------------------------------------------------------------- derived

  // typing only has to update the textarea. everything computed from the whole draft follows one beat behind,
  // and on a long post that beat is what keeps the keys from feeling heavy
  const lazy = useDeferredValue(md);
  const h1 = useMemo(() => /^#\s+(.+)$/m.exec(lazy)?.[1]?.trim() ?? "", [lazy]);
  const title = f.title || h1;
  const slug = f.slugSet ? f.slug : slugFromTitle(title);
  const body = useMemo(() => stripLeadingTitle(lazy, title), [lazy, title]);
  const description = useMemo(() => (f.descSet ? f.description : describe(body)), [f.descSet, f.description, body]);
  const autoTags = useMemo(() => suggestTags(lazy).join(", "), [lazy]);
  const tags = f.tagsSet ? f.tags : autoTags;
  const words = useMemo(() => (lazy.trim() ? lazy.trim().split(/\s+/).length : 0), [lazy]);
  const minutes = useMemo(() => readingMinutes(lazy), [lazy]);
  const previewImages = useMemo(() => Object.fromEntries(Object.values(images).map((i) => [IMAGE_DIR + i.name, i.url])), [images]);
  const byline = `${f.date || today()} · ${minutes} min read`;
  const set = (patch: Partial<Fields>) => setF((p) => ({ ...p, ...patch }));

  // -------------------------------------------------------------- editing

  const insert = useCallback((text: string) => {
    const el = ta.current;
    if (!el) {
      setMd((m) => m + text);
      return;
    }
    const a = el.selectionStart;
    const b = el.selectionEnd;
    setMd(el.value.slice(0, a) + text + el.value.slice(b));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + text.length, a + text.length);
    });
  }, []);

  /** a block of its own, with blank lines around it */
  const insertBlock = useCallback((text: string) => {
    const el = ta.current;
    if (!el) {
      setMd((m) => (m ? m.replace(/\n*$/, "\n\n") : "") + text);
      return;
    }
    insert(pad(el.value.slice(0, el.selectionStart), el.value.slice(el.selectionEnd), text));
  }, [insert]);

  const wrap = (before: string, after = before) => {
    const el = ta.current;
    if (!el) return;
    const a = el.selectionStart;
    const b = el.selectionEnd;
    const chosen = el.value.slice(a, b);
    setMd(el.value.slice(0, a) + before + chosen + after + el.value.slice(b));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + before.length, a + before.length + chosen.length);
    });
  };

  const fenceSelection = () => {
    const el = ta.current;
    if (!el) return;
    const a = el.selectionStart;
    const b = el.selectionEnd;
    const chosen = el.value.slice(a, b);
    if (!chosen.trim()) return wrap("```\n", "\n```");
    const lang = detectLanguage(chosen).lang;
    const block = pad(el.value.slice(0, a), el.value.slice(b), fence(chosen, lang));
    setMd(el.value.slice(0, a) + block + el.value.slice(b));
    setReport([`fenced the selection as ${lang}`]);
  };

  const tidy = () => {
    const res = toMarkdown(md, { fragment: true });
    setMd(res.markdown);
    setReport(res.report.length ? res.report : ["nothing to fix"]);
  };

  // -------------------------------------------------------------- images

  const addImages = useCallback(async (files: File[]): Promise<string[]> => {
    const names: string[] = [];
    const next = { ...imagesRef.current };
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const ext = extensionFor(file);
      let base = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
      if (/^image\d*$/.test(base)) base = `image-${Date.now().toString(36)}`;
      let name = `${base}.${ext}`;
      for (let n = 2; next[name] && !sameBytes(next[name].bytes, bytes); n++) name = `${base}-${n}.${ext}`;
      if (!next[name]) {
        const mime = file.type || (ext === "svg" ? "image/svg+xml" : `image/${ext}`);
        next[name] = { name, mime, bytes, url: URL.createObjectURL(new Blob([bytes], { type: mime })) };
        saveImage({ name, mime, bytes: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer });
      }
      names.push(name);
    }
    imagesRef.current = next;
    setImages(next);
    return names;
  }, []);

  const dropImage = (name: string) => {
    const { [name]: gone, ...rest } = imagesRef.current;
    if (gone) URL.revokeObjectURL(gone.url);
    imagesRef.current = rest;
    setImages(rest);
    removeImage(name);
    if (f.cover === IMAGE_DIR + name) set({ cover: "" });
  };

  const imageMarkdown = (name: string) => `![](${IMAGE_DIR}${name})`;

  // ------------------------------------------------------------- importing

  /** a whole web page becomes the draft: its text, its diagrams stored as images, and its title, date and tags in the fields */
  const adoptDocument = useCallback(async (res: ConvertResult, source: string, attached = new Map<string, string>()) => {
    const diagrams = (res.figures ?? []).map((g) => new File([g.content], g.name, { type: "image/svg+xml" }));
    const stored = await addImages(diagrams);
    const byOriginal = new Map(attached);
    diagrams.forEach((d, i) => byOriginal.set(d.name.toLowerCase(), stored[i]));
    setMd(rewriteImageRefs(res.markdown, byOriginal));
    setF({
      ...BLANK,
      title: res.meta.title ?? "",
      date: res.meta.date ?? today(),
      description: res.meta.description ?? "",
      descSet: Boolean(res.meta.description),
      tags: res.meta.tags?.join(", ") ?? "",
      tagsSet: Boolean(res.meta.tags),
    });
    setReport([...res.report, `from ${source}, the draft is ready to publish`]);
  }, [addImages]);

  /** a pdf is a book and a .tgz is the source it was built from: both go to the publish panel, not into the draft */
  const adoptBook = useCallback(async (pdfs: File[], bundles: File[]): Promise<string[]> => {
    const notes: string[] = [];
    let bookFile: File | null = pdfs[0] ?? null;
    if (pdfs.length > 1) notes.push(`only ${pdfs[0].name} is used, ${pdfs.length - 1} more pdf${pdfs.length > 2 ? "s were" : " was"} skipped`);
    const bundle = bundles[0];
    if (bundles.length > 1) notes.push(`only ${bundle.name} is attached, ${bundles.length - 1} more bundle${bundles.length > 2 ? "s were" : " was"} skipped`);

    if (bundle) {
      try {
        const unpacked = await readTgz(bundle);
        const info = summarize(unpacked.files);
        notes.push(`${bundle.name}: ${info.count} files, ${mb(info.unpacked)} unpacked, kept as the book's source download`);
        if (!bookFile && info.pdf) {
          const name = info.pdf.name.split("/").pop() ?? "book.pdf";
          bookFile = new File([entryBytes(unpacked, info.pdf) as BlobPart], name, { type: "application/pdf" });
          notes.push(`took ${name} out of the bundle as the book`);
        }
      } catch {
        notes.push(`${bundle.name} did not open as a .tgz, it is still attached as it is`);
      }
      setCode(bundle);
    }

    if (bookFile) {
      const chosen = bookFile;
      setPdf(chosen);
      const found = await pdfTitle(new Uint8Array(await chosen.arrayBuffer()));
      setBook((b) => ({ ...b, title: b.title || found || nameToTitle(chosen.name) }));
      notes.push(`book: ${chosen.name}, ${mb(chosen.size)}`);
    } else {
      notes.push("no pdf yet. add the book's pdf in the publish panel");
    }
    setKind("book");
    setLog([]);
    setLiveUrls([]);
    setPanel(true);
    return notes;
  }, []);

  const handleFiles = useCallback(async (dropped: File[], replace: boolean) => {
    const books = dropped.filter(isPdf);
    const bundles = dropped.filter(isBundle);
    const bookNotes = books.length || bundles.length ? await adoptBook(books, bundles) : [];
    const files = dropped.filter((x) => !isPdf(x) && !isBundle(x));
    if (!files.length) {
      setReport(bookNotes);
      return;
    }

    const pics = files.filter(isImage);
    const texts = files.filter((x) => !isImage(x));
    const names = await addImages(pics);
    const byOriginal = new Map(pics.map((p, i) => [p.name.toLowerCase(), names[i]]));

    if (!texts.length) {
      insertBlock(names.map(imageMarkdown).join("\n\n"));
      setReport([...bookNotes, `added ${names.length} image${names.length > 1 ? "s" : ""}`]);
      return;
    }
    const file = texts[0];
    const res = toMarkdown(await file.text(), { filename: file.name });
    if (res.document) {
      if (md.trim() && !replace && !confirm("this is a whole page. replace the current draft with it?")) return;
      await adoptDocument(res, file.name, byOriginal);
      return;
    }
    const out = rewriteImageRefs(res.markdown, byOriginal);
    const notes = [...res.report];
    if (texts.length > 1) notes.push(`only ${file.name} was read, ${texts.length - 1} other file${texts.length > 2 ? "s were" : " was"} skipped`);
    if (pics.length) notes.push(`attached ${pics.length} image${pics.length > 1 ? "s" : ""}`);

    if (replace || !md.trim()) {
      setMd(out);
      setF((p) => ({
        ...p,
        title: res.meta.title ?? (res.kind === "code" ? file.name : p.title),
        date: res.meta.date ?? p.date,
        description: res.meta.description ?? p.description,
        descSet: Boolean(res.meta.description) || p.descSet,
        tags: res.meta.tags?.join(", ") ?? p.tags,
        tagsSet: Boolean(res.meta.tags) || p.tagsSet,
        cover: res.meta.cover ?? p.cover,
      }));
    } else {
      const el = ta.current;
      const a = el?.selectionStart ?? md.length;
      const b = el?.selectionEnd ?? md.length;
      insert(pad(md.slice(0, a), md.slice(b), out));
    }
    const all = [...bookNotes, ...notes];
    setReport(all.length ? all : [`read ${file.name}, nothing needed fixing`]);
  }, [addImages, adoptBook, adoptDocument, insert, insertBlock, md]);

  const onPaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const data = e.clipboardData;
    const pics = Array.from(data.files).filter(isImage);
    if (pics.length) {
      e.preventDefault();
      const names = await addImages(pics);
      insertBlock(names.map(imageMarkdown).join("\n\n"));
      setReport([`pasted ${names.length} image${names.length > 1 ? "s" : ""}`]);
      return;
    }
    const text = data.getData("text/plain");
    const html = data.getData("text/html");
    const editor = data.getData("vscode-editor-data");
    if (!text && !html) return;

    // the source of a whole page, however big: it never reaches the editor, only the post made from it does
    if (looksLikeHtmlDocument(text)) {
      e.preventDefault();
      if (md.trim() && !confirm("this is a whole web page. replace the current draft with it as a post?")) return;
      await adoptDocument(toMarkdown(text, { filename: "paste.html" }), "the pasted html");
      return;
    }

    let hint: string | null = null;
    if (editor) {
      try { hint = (JSON.parse(editor) as { mode?: string }).mode ?? null; } catch { /* not json */ }
    }
    const res = !editor && html && looksStructured(html)
      ? toMarkdown(html, { filename: "paste.html", fragment: true })
      : toMarkdown(text, { fragment: true, hint });
    if (res.kind === "text" && res.markdown.trim() === text.trim()) return; // nothing to fix, let the browser paste it

    e.preventDefault();
    const el = e.currentTarget;
    const a = el.selectionStart;
    const b = el.selectionEnd;
    const piece = isBlock(res.markdown) ? pad(el.value.slice(0, a), el.value.slice(b), res.markdown) : res.markdown.replace(/\n+$/, "");
    insert(piece);
    setReport(res.report);
  };

  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleFiles(files, false);
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    if (md.trim() && files.some((x) => !isImage(x) && !isPdf(x) && !isBundle(x)) && !confirm("replace the current draft with this file?")) return;
    handleFiles(files, true);
  };

  const onImagePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length) await handleFiles(files, false);
  };

  // --------------------------------------------------------- existing posts

  const listPosts = async () => {
    try {
      const res = await fetch(`https://api.github.com/repos/${SITE.owner}/${SITE.repo}/contents/content/posts`);
      const items = (await res.json()) as { name: string }[];
      setPosts(items.filter((i) => i.name.endsWith(".md")).map((i) => i.name));
    } catch {
      setPosts([]);
    }
  };

  const openPost = async (name: string) => {
    if (md.trim() && !confirm("replace the current draft with this post?")) return;
    const res = await fetch(`https://raw.githubusercontent.com/${SITE.owner}/${SITE.repo}/${SITE.branch}/content/posts/${name}`);
    const fm = parseFrontmatter(await res.text());
    setMd(fm.body.trim() + "\n");
    setF({
      title: fm.meta.title ?? "", slug: name.replace(/\.md$/, ""), slugSet: true, date: fm.meta.date ?? today(),
      description: fm.meta.description ?? "", descSet: true, tags: fm.meta.tags?.join(", ") ?? "", tagsSet: true, cover: fm.meta.cover ?? "",
    });
    setPosts(null);
    setReport([`opened ${name} from the blog`]);
  };

  // --------------------------------------------------------------- output

  const postFile = () =>
    buildPostFile({
      title, slug, date: f.date || today(), description, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), cover: f.cover, body,
    });

  const copyMarkdown = () => {
    navigator.clipboard.writeText(postFile());
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([postFile()], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "post"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const publish = async () => {
    const say = (line: string) => setLog((l) => [...l, line]);
    setLog([]);
    setLiveUrls([]);
    if (!title.trim()) return say("the post needs a title");
    if (!slug) return say("the post needs a slug");
    if (!body.trim()) return say("the post is empty");
    if (!token.trim()) return say("paste a github token first");

    setBusy(true);
    try {
      const target = { token: token.trim() };
      say(`signed in as ${await whoami(target)}`);
      localStorage.setItem(TOKEN_KEY, token.trim());

      const svg = extractSvgs(body, slug);
      const used = new Set(referencedImages(svg.markdown));
      if (f.cover.startsWith(IMAGE_DIR)) used.add(f.cover.slice(IMAGE_DIR.length));

      const path = `content/posts/${slug}.md`;
      const files: PublishFile[] = [{ path, content: buildPostFile({
        title, slug, date: f.date || today(), description, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), cover: f.cover, body: svg.markdown,
      }) }];
      for (const name of used) {
        const img = imagesRef.current[name];
        if (img) files.push({ path: `assets/img/${name}`, content: img.bytes });
        else say(`${name} is not in the editor, so the blog keeps whatever it already has`);
      }
      for (const s of svg.files) files.push({ path: `assets/img/${s.name}`, content: s.content });

      const exists = await fileExists(target, path);
      if (exists && !confirm(`${slug} is already published. replace it?`)) {
        say("cancelled");
        return;
      }
      say(`committing ${files.length} file${files.length > 1 ? "s" : ""}`);
      const done = await commitFiles(target, `${exists ? "update post" : "post"}: ${title.trim()}`, files);
      say(`committed ${done.sha.slice(0, 7)}`);

      const result = await waitForDeploy(target, done.sha, say);
      setLiveUrls([`${SITE.url}/posts/${slug}/`]);
      say(result === "success" ? "live on the blog" : result === "failure" ? "the build failed, check the actions tab" : "pushed. it goes live in about a minute");
      if (result === "success") {
        // pawann.dev lists posts from the blog's posts.json, so drop its cache now
        const ok = await fetch("/api/revalidate-blog", { method: "POST" }).then((r) => r.ok, () => false);
        say(ok ? `listed on ${location.host} too` : `${location.host} lists it within five minutes`);
      }
    } catch (err) {
      say(explain(err));
    } finally {
      setBusy(false);
    }
  };

  const publishBook = async () => {
    const say = (line: string) => setLog((l) => [...l, line]);
    setLog([]);
    setLiveUrls([]);
    if (!pdf) return say("pick the pdf first");
    if (!book.title.trim()) return say("the book needs a title");
    if (!token.trim()) return say("paste a github token first");
    for (const [what, file] of [["pdf", pdf], ["source", code]] as const) {
      if (file && file.size > GITHUB_FILE_LIMIT) return say(`the ${what} is ${mb(file.size)}. github refuses a file over 100 mb, so shrink it first`);
    }

    setBusy(true);
    try {
      const target = { token: token.trim() };
      say(`signed in as ${await whoami(target)}`);
      localStorage.setItem(TOKEN_KEY, token.trim());

      const name = `${slugify(book.title)}.pdf`;
      const codeName = `${slugify(book.title)}-source.tgz`;
      const entry: BookEntry = {
        title: book.title.trim(),
        ...(book.subtitle.trim() ? { subtitle: book.subtitle.trim() } : {}),
        ...(book.blurb.trim() ? { blurb: book.blurb.trim() } : {}),
        ...(book.year.trim() ? { year: book.year.trim() } : {}),
        pdf: `/assets/books/${name}`,
        ...(code ? { code: `/assets/books/${codeName}` } : {}),
      };
      const current = await readText(target, "content/books.json");
      const list = current ? (JSON.parse(current) as BookEntry[]) : [];
      const previous = list.find((b) => b.pdf === entry.pdf);
      const replacing = Boolean(previous);
      // a book that is replaced keeps the source it already had, unless a new one came with it
      if (!entry.code && previous?.code) entry.code = previous.code;
      if (replacing && !confirm(`${book.title} is already up. replace it?`)) {
        say("cancelled");
        return;
      }
      const files: PublishFile[] = [
        { path: `assets/books/${name}`, content: new Uint8Array(await pdf.arrayBuffer()) },
        ...(code ? [{ path: `assets/books/${codeName}`, content: new Uint8Array(await code.arrayBuffer()) }] : []),
        { path: "content/books.json", content: `${JSON.stringify(upsertBook(list, entry), null, 2)}\n` },
      ];
      say(`uploading ${name}, ${mb(pdf.size)}${code ? ` and ${codeName}, ${mb(code.size)}` : ""}`);
      const done = await commitFiles(target, `${replacing ? "update book" : "book"}: ${entry.title}`, files);
      say(`committed ${done.sha.slice(0, 7)}`);
      const result = await waitForDeploy(target, done.sha, say);
      setLiveUrls([`${SITE.url}/books/`]);
      say(result === "success" ? "live, the cover is made from page one" : result === "failure" ? "the build failed, check the actions tab" : "pushed. it goes live in about a minute");
    } catch (err) {
      say(explain(err));
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    if (!confirm("clear the draft and its images?")) return;
    setMd("");
    setF({ ...BLANK, date: today() });
    setReport([]);
    Object.values(imagesRef.current).forEach((i) => URL.revokeObjectURL(i.url));
    imagesRef.current = {};
    setImages({});
    await clearImages();
  };

  // stable, so the preview's sections that did not change are not asked to render again
  const onLang = useCallback((index: number, lang: Lang) => setMd((m) => setFenceLang(m, index, lang)), []);

  // --------------------------------------------------------------- render

  const tool = "p-1.5 rounded text-ink-faint hover:text-gold hover:bg-surface-2 transition-colors cursor-pointer";
  const btn = "px-3 py-1.5 rounded border border-rule-strong font-mono text-[12px] text-ink-soft hover:text-gold hover:border-gold transition-colors cursor-pointer inline-flex items-center gap-1.5";
  const field = "w-full bg-surface border border-rule-strong rounded px-3 py-2 text-[14px] text-ink focus:outline-none focus:border-gold";
  const label = "block font-mono text-[11px] text-ink-faint mb-1";

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-rule-strong">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className={tool} title="home"><ChevronLeft className="w-4 h-4" /></Link>
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold tracking-tight leading-none">sandbox</h1>
            <p className="font-mono text-[11px] text-ink-faint mt-1">{saved || "ready"} · {words} words</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className={btn} onClick={() => fileInput.current?.click()}><Upload className="w-3.5 h-3.5" /> import</button>
          <button className={btn} onClick={tidy}><Sparkles className="w-3.5 h-3.5" /> tidy</button>
          <button className={btn} onClick={copyMarkdown}>{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} copy md</button>
          <button className={btn} onClick={download}><Download className="w-3.5 h-3.5" /> .md</button>
          <button className={`${btn} !bg-ink !text-bg hover:!bg-gold hover:!text-bg`} onClick={() => setPanel(true)}>publish</button>
          <div className="flex border border-rule-strong rounded overflow-hidden font-mono text-[11px]">
            {(["edit", "split", "preview"] as Layout[]).map((m) => (
              <button key={m} onClick={() => setLayout(m)} className={`px-3 md:px-2.5 py-1.5 cursor-pointer ${m === "split" ? "hidden md:block" : ""} ${layout === m ? "bg-surface-2 text-ink" : "text-ink-faint hover:text-gold"}`}>{m}</button>
            ))}
          </div>
        </div>
      </header>

      <input ref={fileInput} type="file" multiple accept=".md,.markdown,.txt,.html,.htm,.rs,.go,.ts,.tsx,.js,.jsx,.py,.c,.h,.cpp,.hpp,.java,.sql,.sh,.json,.yaml,.yml,.toml,.css,image/*,.svg,.pdf,.tgz,.tar.gz" className="hidden" onChange={onPick} />
      <input ref={imageInput} type="file" multiple accept="image/*,.svg" className="hidden" onChange={onImagePick} />

      <main className={`flex-1 grid gap-0 ${layout === "split" ? "md:grid-cols-2" : "grid-cols-1"} min-h-0`}>
        {layout !== "preview" && (
          <section className="flex flex-col border-r border-rule min-w-0" onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
            <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b border-rule">
              <button className={tool} title="bold" onClick={() => wrap("**")}><Bold className="w-4 h-4" /></button>
              <button className={tool} title="italic" onClick={() => wrap("*")}><Italic className="w-4 h-4" /></button>
              <button className={tool} title="heading" onClick={() => wrap("\n## ", "")}><Heading2 className="w-4 h-4" /></button>
              <button className={tool} title="link" onClick={() => wrap("[", "](https://)")}><LinkIcon className="w-4 h-4" /></button>
              <button className={tool} title="quote" onClick={() => wrap("\n> ", "")}><Quote className="w-4 h-4" /></button>
              <button className={tool} title="code. select text first and the language is detected" onClick={fenceSelection}><Code className="w-4 h-4" /></button>
              <button className={tool} title="add images" onClick={() => imageInput.current?.click()}><ImageIcon className="w-4 h-4" /></button>
              <div className="ml-auto flex items-center gap-1">
                <button className="font-mono text-[11px] text-ink-faint hover:text-gold px-2 cursor-pointer" onClick={listPosts}>open a post</button>
                {md && <button className={`${tool} hover:!text-red-700`} title="clear draft" onClick={clearAll}><Trash2 className="w-4 h-4" /></button>}
              </div>
            </div>

            {posts && (
              <div className="px-3 py-2 border-b border-rule bg-surface-2 flex flex-wrap gap-2 font-mono text-[12px]">
                {posts.length === 0 && <span className="text-ink-faint">no posts found</span>}
                {posts.map((p) => <button key={p} onClick={() => openPost(p)} className="text-gold hover:underline cursor-pointer">{p.replace(/\.md$/, "")}</button>)}
                <button onClick={() => setPosts(null)} className="ml-auto text-ink-faint cursor-pointer"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            <div className="relative flex-1 flex flex-col min-h-[55vh]">
              <textarea
                ref={ta}
                value={md}
                onChange={(e) => setMd(e.target.value)}
                onPaste={onPaste}
                spellCheck
                placeholder={"paste anything. markdown, plain text, a web page, a chat answer, code, a screenshot.\ncode is found and fenced with its language. images are kept.\n\nor drop files here, a .md and its images together work.\n\na whole html page, even a huge one, becomes a finished post: paste its source or drop the .html file.\nthe title, intro, code, tables and every diagram are filled in for you.\n\na .pdf becomes a book, and a .tgz is the source it was built from. drop them and the publish panel opens."}
                className="flex-1 w-full resize-none bg-transparent p-4 sm:p-5 font-mono text-[13.5px] leading-[1.7] text-ink placeholder:text-ink-faint focus:outline-none"
              />
              {dragging && (
                <div className="absolute inset-0 bg-bg/85 border-2 border-dashed border-gold flex items-center justify-center font-mono text-[13px] text-gold pointer-events-none">
                  drop a file, a pdf, a .tgz or images
                </div>
              )}
            </div>

            {(report.length > 0 || Object.keys(images).length > 0) && (
              <div className="border-t border-rule px-3 py-2 space-y-2">
                {report.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center font-mono text-[11.5px] text-ink-soft">
                    {report.map((r) => <span key={r} className="px-2 py-0.5 rounded bg-surface-2">{r}</span>)}
                    <button onClick={() => setReport([])} className="text-ink-faint hover:text-gold cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                {Object.keys(images).length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {Object.values(images).map((img) => (
                      <div key={img.name} className="relative shrink-0 w-20 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" title={`click to insert ${img.name}`} onClick={() => insertBlock(imageMarkdown(img.name))} className="w-20 h-14 object-cover rounded border border-rule-strong cursor-pointer bg-white" />
                        <button onClick={() => dropImage(img.name)} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-ink text-bg hidden group-hover:flex items-center justify-center cursor-pointer" title="remove"><X className="w-3 h-3" /></button>
                        <p className="font-mono text-[9.5px] text-ink-faint truncate mt-0.5">{img.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {layout !== "edit" && (
          <section className="overflow-y-auto px-5 sm:px-8 py-6 bg-bg min-w-0 md:max-h-[calc(100vh-61px)]">
            {md.trim() ? (
              <Preview markdown={body} title={title} byline={byline} images={previewImages} onLang={onLang} />
            ) : (
              <p className="font-mono text-[12.5px] text-ink-faint">the preview looks like the published blog. start writing or paste something.</p>
            )}
          </section>
        )}
      </main>

      {panel && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/30" onClick={() => setPanel(false)}>
          <aside className="w-full max-w-[28rem] h-full overflow-y-auto bg-bg border-l border-rule-strong p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold">publish to {SITE.url.replace("https://", "")}</h2>
              <button onClick={() => setPanel(false)} className={tool}><X className="w-4 h-4" /></button>
            </div>

            <div className="flex border border-rule-strong rounded overflow-hidden font-mono text-[12px]">
              {(["post", "book"] as const).map((k) => (
                <button key={k} onClick={() => { setKind(k); setLog([]); setLiveUrls([]); }} className={`flex-1 py-1.5 cursor-pointer ${kind === k ? "bg-ink text-bg" : "text-ink-faint hover:text-gold"}`}>{k === "post" ? "a post" : "a book"}</button>
              ))}
            </div>

            {kind === "post" ? (
              <>
            <div><label className={label}>title</label><input className={field} value={title} onChange={(e) => set({ title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>slug</label><input className={field} value={slug} onChange={(e) => set({ slug: slugify(e.target.value), slugSet: true })} /></div>
              <div><label className={label}>date</label><input className={field} type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} /></div>
            </div>
            <div><label className={label}>description</label><textarea className={`${field} resize-none`} rows={3} value={description} onChange={(e) => set({ description: e.target.value, descSet: true })} /></div>
            <div><label className={label}>tags, comma separated</label><input className={field} value={tags} onChange={(e) => set({ tags: e.target.value, tagsSet: true })} /></div>
            <div>
              <label className={label}>cover image, used for the link preview</label>
              <select className={field} value={f.cover} onChange={(e) => set({ cover: e.target.value })}>
                <option value="">none</option>
                {Object.values(images).map((i) => <option key={i.name} value={IMAGE_DIR + i.name}>{i.name}</option>)}
                {f.cover && !images[f.cover.slice(IMAGE_DIR.length)] && <option value={f.cover}>{f.cover.slice(IMAGE_DIR.length)}</option>}
              </select>
            </div>
              </>
            ) : (
              <>
            <div>
              <label className={label}>the pdf</label>
              <label className={`${field} flex items-center justify-between cursor-pointer`}>
                <span className="truncate">{pdf ? pdf.name : "choose a pdf"}</span>
                <span className="font-mono text-[11px] text-ink-faint">{pdf ? `${(pdf.size / 1_000_000).toFixed(1)} mb` : "browse"}</span>
                <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0] ?? null;
                  setPdf(file);
                  if (file && !book.title) {
                    const found = await pdfTitle(new Uint8Array(await file.arrayBuffer()));
                    setBook((b) => ({ ...b, title: b.title || found || nameToTitle(file.name) }));
                  }
                }} />
              </label>
              <p className="font-mono text-[11px] text-ink-faint mt-1.5">the cover and page count come from the pdf itself.</p>
            </div>
            <div>
              <label className={label}>the source, optional</label>
              <label className={`${field} flex items-center justify-between cursor-pointer`}>
                <span className="truncate">{code ? code.name : "choose a .tgz"}</span>
                <span className="font-mono text-[11px] text-ink-faint">{code ? mb(code.size) : "browse"}</span>
                <input type="file" accept=".tgz,.tar.gz,application/gzip,application/x-gzip" className="hidden" onChange={(e) => setCode(e.target.files?.[0] ?? null)} />
              </label>
              <p className="font-mono text-[11px] text-ink-faint mt-1.5">
                {code
                  ? <>a second download on the book&apos;s page. <button className="text-gold underline cursor-pointer" onClick={() => setCode(null)}>take it off</button></>
                  : "the code the book was built from, offered as a second download."}
              </p>
            </div>
            <div><label className={label}>title</label><input className={field} value={book.title} onChange={(e) => setBook({ ...book, title: e.target.value })} /></div>
            <div><label className={label}>subtitle</label><input className={field} value={book.subtitle} onChange={(e) => setBook({ ...book, subtitle: e.target.value })} /></div>
            <div><label className={label}>what it is about</label><textarea className={`${field} resize-none`} rows={4} value={book.blurb} onChange={(e) => setBook({ ...book, blurb: e.target.value })} /></div>
            <div><label className={label}>year</label><input className={field} value={book.year} onChange={(e) => setBook({ ...book, year: e.target.value })} /></div>
              </>
            )}

            <div>
              <label className={label}>github token</label>
              <input className={field} type="password" autoComplete="off" placeholder="github_pat_..." value={token} onChange={(e) => setToken(e.target.value)} />
              <p className="font-mono text-[11px] text-ink-faint mt-1.5 leading-relaxed">
                stays in this browser only. make a fine-grained token for {SITE.owner}/{SITE.repo} with Contents read and write, and Actions read.{" "}
                <a className="text-gold underline" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">create one</a>
                {token && <> · <button className="text-gold underline cursor-pointer" onClick={() => { setToken(""); localStorage.removeItem(TOKEN_KEY); }}>forget it</button></>}
              </p>
            </div>

            <button disabled={busy} onClick={kind === "post" ? publish : publishBook} className="w-full py-2.5 rounded bg-ink text-bg font-mono text-[13px] hover:bg-gold transition-colors disabled:opacity-50 cursor-pointer">
              {busy ? "publishing..." : kind === "post" ? "publish the post" : "publish the book"}
            </button>

            {log.length > 0 && (
              <ul className="font-mono text-[12px] text-ink-soft space-y-1">
                {log.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            )}
            {liveUrls.map((u) => <a key={u} className="block font-mono text-[12.5px] text-gold underline break-all" href={u} target="_blank" rel="noreferrer">{u}</a>)}
          </aside>
        </div>
      )}
    </div>
  );
}
