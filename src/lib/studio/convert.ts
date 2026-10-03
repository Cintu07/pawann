// Turns whatever gets pasted or uploaded into clean markdown: prose stays
// prose, code is found, labelled with its language and put in a fence.

import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import css from "highlight.js/lib/languages/css";
import diff from "highlight.js/lib/languages/diff";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import go from "highlight.js/lib/languages/go";
import ini from "highlight.js/lib/languages/ini";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

export type Lang =
  | "rust" | "go" | "typescript" | "javascript" | "python" | "c" | "cpp" | "java" | "sql"
  | "bash" | "json" | "yaml" | "toml" | "html" | "css" | "dockerfile" | "diff" | "text";

export const LANGS: { value: Lang; label: string }[] = [
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Shell" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "toml", label: "TOML" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "diff", label: "Diff" },
  { value: "text", label: "Plain text" },
];

const HLJS_NAME: Record<Exclude<Lang, "text">, string> = {
  rust: "rust", go: "go", typescript: "typescript", javascript: "javascript", python: "python",
  c: "c", cpp: "cpp", java: "java", sql: "sql", bash: "bash", json: "json", yaml: "yaml",
  toml: "ini", html: "xml", css: "css", dockerfile: "dockerfile", diff: "diff",
};

const registered: [string, Parameters<typeof hljs.registerLanguage>[1]][] = [
  ["bash", bash], ["c", c], ["cpp", cpp], ["css", css], ["diff", diff], ["dockerfile", dockerfile],
  ["go", go], ["ini", ini], ["java", java], ["javascript", javascript], ["json", json],
  ["python", python], ["rust", rust], ["sql", sql], ["typescript", typescript], ["xml", xml], ["yaml", yaml],
];
for (const [name, def] of registered) {
  if (!hljs.getLanguage(name)) hljs.registerLanguage(name, def);
}

const BY_HLJS = Object.fromEntries(Object.entries(HLJS_NAME).map(([lang, name]) => [name, lang])) as Record<string, Lang>;

const ALIASES: Record<string, Lang> = {
  rust: "rust", rs: "rust",
  go: "go", golang: "go",
  typescript: "typescript", ts: "typescript", tsx: "typescript", mts: "typescript", cts: "typescript",
  javascript: "javascript", js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript", node: "javascript",
  python: "python", py: "python", python3: "python", py3: "python",
  c: "c", h: "c",
  cpp: "cpp", "c++": "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp", hh: "cpp", cplusplus: "cpp",
  java: "java",
  sql: "sql", postgres: "sql", postgresql: "sql", mysql: "sql", sqlite: "sql", psql: "sql",
  bash: "bash", sh: "bash", shell: "bash", zsh: "bash", console: "bash", terminal: "bash", shellscript: "bash", fish: "bash",
  json: "json", jsonc: "json", json5: "json",
  yaml: "yaml", yml: "yaml",
  toml: "toml", ini: "toml",
  html: "html", htm: "html", xml: "html", svg: "html", vue: "html",
  css: "css", scss: "css", less: "css",
  dockerfile: "dockerfile", docker: "dockerfile",
  diff: "diff", patch: "diff",
  text: "text", txt: "text", plain: "text", plaintext: "text", output: "text", log: "text",
};

export function normalizeLang(tag?: string | null): Lang | null {
  if (!tag) return null;
  return ALIASES[tag.trim().toLowerCase()] ?? null;
}

const CODE_EXT = new Set([
  "rs", "go", "ts", "tsx", "mts", "cts", "js", "jsx", "mjs", "cjs", "py", "c", "h", "cpp", "cc", "cxx", "hpp", "hh",
  "java", "sql", "sh", "bash", "zsh", "json", "jsonc", "yaml", "yml", "toml", "css", "scss", "diff", "patch",
]);

export function languageForFilename(name?: string): Lang | null {
  if (!name) return null;
  const base = name.split(/[\\/]/).pop()!.toLowerCase();
  if (base === "dockerfile") return "dockerfile";
  const ext = base.includes(".") ? base.split(".").pop()! : "";
  return CODE_EXT.has(ext) ? (ALIASES[ext] ?? null) : null;
}

// ---------------------------------------------------------------- detection

type Sig = [RegExp, number];

const sig = (list: [string, number][], flags = "gm"): Sig[] => list.map(([source, weight]) => [new RegExp(source, flags), weight]);

const SIGS: Record<string, Sig[]> = {
  rust: sig([
    [String.raw`\bfn\s+\w+\s*(<[^>]*>)?\s*\(`, 3], [String.raw`\blet\s+(mut\s+)?\w+(\s*:\s*[^=]+)?\s*=`, 1], [String.raw`\blet\s+mut\b`, 3],
    [String.raw`\bimpl(<[^>]*>)?\s+[\w:<>]+`, 3], [String.raw`\bpub(\([a-z]+\))?\s+(fn|struct|enum|mod|trait|use|const|static)\b`, 3],
    [String.raw`^\s*use\s+\w+(::\w+)+`, 3], [String.raw`::<`, 2], [String.raw`\b(println|print|eprintln|format|vec|panic|assert|assert_eq|todo|unimplemented|matches|write|writeln)!\s*[\(\[\{]`, 4],
    [String.raw`&mut\s`, 2], [String.raw`\)\s*->\s*[\w:<>&\[\], ']+\s*(\{|where)`, 2], [String.raw`#!?\[(derive|cfg|test|allow|inline|repr)\b`, 4],
    [String.raw`\bmatch\s+[\w.&*()]+\s*\{`, 3], [String.raw`<'[a-z_]+[,>]`, 3], [String.raw`\b(Option|Result|Vec|Box|Arc|Rc|HashMap|String)<`, 2],
    [String.raw`\bunsafe\s*(\{|fn)`, 3], [String.raw`\b(struct|enum|trait)\s+[A-Z]\w*`, 1], [String.raw`\.(unwrap|expect|clone|iter|collect|into|as_ref|await)\(`, 1], [String.raw`\bSome\(|\bNone\b|\bOk\(|\bErr\(`, 2],
  ]),
  go: sig([
    [String.raw`^package\s+\w+`, 4], [String.raw`\bfunc\s+(\(\w+\s+\*?[\w.\[\]]+\)\s+)?\w+\s*(\[[^\]]*\])?\(`, 3], [String.raw`\b\w+\s*:=\s*`, 2], [String.raw`\bdefer\s+\w`, 3],
    [String.raw`\bgo\s+(func\s*\(|\w+\()`, 3], [String.raw`\bfmt\.\w+\(`, 3], [String.raw`^import\s*\(`, 3], [String.raw`\bchan\b|<-\s*\w`, 2],
    [String.raw`\btype\s+\w+\s+(struct|interface)\b`, 4], [String.raw`\berr\s*!=\s*nil\b`, 4], [String.raw`\bmake\((\[\]|map\[|chan )`, 3], [String.raw`\bfor\s+(\w+,\s*)?\w+\s*:=\s*range\b`, 4],
    [String.raw`\[\]\w+\{`, 2], [String.raw`\bnil\b`, 1], [String.raw`\bcontext\.Context\b|\bsync\.(Mutex|WaitGroup|RWMutex)\b`, 3],
  ]),
  typescriptOnly: sig([
    [String.raw`^\s*(export\s+)?(interface|type)\s+\w+(<[^>]*>)?\s*(=|\{|extends)`, 4], [String.raw`:\s*(string|number|boolean|void|unknown|never|any|bigint)\b(\[\])?\s*[,;=)\{|]`, 3],
    [String.raw`\)\s*:\s*(Promise<[^>]*>|string|number|boolean|void|\w+(\[\])?)\s*(=>|\{)`, 3], [String.raw`\bas\s+(const|unknown|any|\w+)\b`, 2], [String.raw`\b(readonly|private|public|protected)\s+\w+\s*[:(]`, 2],
    [String.raw`<[A-Z]\w*(\s+extends\s+\w+)?>\(`, 2], [String.raw`\b(Promise|Record|Partial|Array|Map|Set)<`, 2], [String.raw`\benum\s+[A-Z]\w*\s*\{`, 3], [String.raw`!\.|\w!:|\w\?:\s*\w`, 2], [String.raw`\bimport\s+type\b|\bexport\s+type\b`, 4],
  ]),
  javascript: sig([
    [String.raw`\b(const|let|var)\s+\w+\s*=`, 2], [String.raw`=>`, 1], [String.raw`\bfunction\s*\*?\s*\w*\s*\(`, 2], [String.raw`\bconsole\.(log|error|warn)\(`, 3],
    [String.raw`\brequire\(['"]`, 3], [String.raw`\bmodule\.exports\b|\bexports\.\w+\s*=`, 3], [String.raw`\bdocument\.\w+|\bwindow\.\w+`, 2], [String.raw`===|!==`, 2],
    [String.raw`\bimport\s+[\w{}*,\s]+\s+from\s+['"]`, 3], [String.raw`\bexport\s+(default|const|function|class|async)\b`, 2], [String.raw`\basync\s+(function|\(|\w+\s*=>)|\bawait\s+\w`, 2],
    [String.raw`\bnew\s+(Promise|Map|Set|Array|Error)\(`, 1], [String.raw`\.(map|filter|reduce|forEach|then|catch)\(`, 1], [String.raw`\buse(State|Effect|Ref|Memo|Callback)\(`, 3],
  ]),
  python: sig([
    [String.raw`^\s*def\s+\w+\s*\([^)]*\)\s*(->\s*[^:]+)?\s*:`, 4], [String.raw`^\s*class\s+\w+\s*(\([^)]*\))?\s*:`, 4], [String.raw`^\s*import\s+\w+(\.\w+)*(\s+as\s+\w+)?\s*$`, 3],
    [String.raw`^\s*from\s+[\w.]+\s+import\s+`, 4], [String.raw`\bself\b`, 2], [String.raw`^\s*elif\b`, 3], [String.raw`__name__\s*==|__init__|__main__|__all__`, 4],
    [String.raw`\bprint\(`, 1], [String.raw`\b(None|True|False)\b`, 1], [String.raw`\blambda\s+\w*\s*:`, 2], [String.raw`\bf["'][^"']*\{[^}]+\}`, 3], [String.raw`^\s*@\w+(\.\w+)*(\(.*\))?\s*$`, 2],
    [String.raw`^\s*with\s+.+\s+as\s+\w+\s*:`, 3], [String.raw`^\s*(try|except(\s+\w+)?|finally|else)\s*:`, 2], [String.raw`\bin\s+range\(|\bisinstance\(|\blen\(`, 1], [String.raw`^\s*(async\s+)?def\s`, 1], [String.raw`\bnp\.|\bpd\.|\btorch\.`, 2],
  ]),
  c: sig([
    [String.raw`^\s*#\s*include\s*[<"][\w/.]+\.h[>"]`, 4], [String.raw`\bint\s+main\s*\(`, 3], [String.raw`\b(printf|scanf|fprintf|sprintf|snprintf|fopen|fclose|memcpy|memset|strlen|strcmp)\s*\(`, 2],
    [String.raw`\b(malloc|calloc|realloc|free)\s*\(`, 3], [String.raw`\bstruct\s+\w+\s*\{`, 2], [String.raw`\btypedef\b`, 2], [String.raw`\b(u?int(8|16|32|64)_t|size_t|uintptr_t)\b`, 2],
    [String.raw`\bNULL\b`, 1], [String.raw`\bstatic\s+(inline\s+)?(const\s+)?\w+[\s*]+\w+\s*\(`, 2], [String.raw`^\s*#\s*(define|ifdef|ifndef|endif|pragma)\b`, 3], [String.raw`\w+\s*->\s*\w+`, 1],
  ]),
  cppOnly: sig([
    [String.raw`^\s*#\s*include\s*<(iostream|vector|string|map|unordered_map|set|memory|algorithm|functional|optional|variant|thread|mutex|array|cstdint|cstdio|cmath)>`, 5],
    [String.raw`\bstd::\w+`, 3], [String.raw`\btemplate\s*<`, 4], [String.raw`\bnamespace\s+\w+`, 3], [String.raw`\b(nullptr|constexpr|noexcept|decltype|static_cast|reinterpret_cast|dynamic_cast)\b`, 3],
    [String.raw`\bclass\s+\w+\s*(final\s*)?(:\s*(public|private|protected)\s+\w+)?\s*\{`, 3], [String.raw`\b(cout|cin|cerr)\s*<<`, 4], [String.raw`\bauto\s+(&&?\s*)?\w+\s*=`, 2], [String.raw`\w+::\w+\s*\(`, 1], [String.raw`\b(public|private|protected)\s*:`, 3], [String.raw`\bvirtual\b|\boverride\b`, 3],
  ]),
  java: sig([
    [String.raw`\bpublic\s+(static\s+|final\s+|abstract\s+)*(class|interface|enum|void|int|String|boolean)\b`, 4], [String.raw`System\.(out|err)\.print(ln)?\(`, 5], [String.raw`^\s*import\s+(static\s+)?(java|javax|org|com)\.[\w.*]+;`, 5],
    [String.raw`@(Override|Autowired|Test|Entity|Component|Service|RestController|SuppressWarnings)\b`, 4], [String.raw`String\[\]\s+args`, 4], [String.raw`\bnew\s+\w+(<[^>]*>)?\(`, 1], [String.raw`\bprivate\s+(final\s+)?\w+(<[^>]*>)?\s+\w+\s*;`, 3], [String.raw`\bextends\s+\w+|\bimplements\s+\w+`, 2], [String.raw`\bthrows\s+\w+`, 3],
  ]),
  sql: sig([
    [String.raw`^\s*SELECT\b[\s\S]*?\bFROM\b`, 5], [String.raw`^\s*(INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM)\b`, 5], [String.raw`^\s*(CREATE|ALTER|DROP)\s+(OR\s+REPLACE\s+)?(TABLE|INDEX|VIEW|DATABASE|SCHEMA|FUNCTION|EXTENSION|TYPE)\b`, 5],
    [String.raw`\bWHERE\b[\s\S]*?(=|<|>|IN|LIKE|IS)`, 2], [String.raw`\b(LEFT|RIGHT|INNER|OUTER|FULL|CROSS)?\s*JOIN\b[\s\S]*?\bON\b`, 3], [String.raw`\b(GROUP|ORDER)\s+BY\b`, 3], [String.raw`^\s*WITH\s+\w+\s+AS\s*\(`, 4], [String.raw`\b(PRIMARY\s+KEY|FOREIGN\s+KEY|NOT\s+NULL|REFERENCES|VARCHAR|BIGINT|TIMESTAMPTZ|JSONB)\b`, 3], [String.raw`\b(COUNT|SUM|AVG|MIN|MAX)\s*\(`, 1],
  ], "gmi"),
  bash: sig([
    [String.raw`^#!\s*/(usr/)?bin/(env\s+)?(ba|z)?sh`, 6], [String.raw`^\s*\$\s+\S`, 4], [String.raw`^\s*(sudo|apt(-get)?|brew|npm|npx|pnpm|yarn|pip3?|cargo|rustup|go\s+(run|build|test|install|mod)|git|cd|ls|mkdir|rm|cp|mv|cat|grep|sed|awk|curl|wget|chmod|chown|export|echo|docker|kubectl|make|python3?|node|tar|ssh|scp|source|systemctl|uv|gh)\s+\S`, 3],
    [String.raw`\$\{?\w+\}?`, 1], [String.raw`\s\|\s*\w+`, 1], [String.raw`\s&&\s`, 1], [String.raw`^\s*(fi|done|esac)\s*$`, 3], [String.raw`^\s*if\s+\[\[?\s`, 4], [String.raw`^\s*for\s+\w+\s+in\s+`, 2], [String.raw`\s--[a-z][\w-]*(=|\s|$)`, 1],
  ]),
  html: sig([
    [String.raw`<!doctype\s+html`, 6], [String.raw`<html[\s>]|<head[\s>]|<body[\s>]`, 4], [String.raw`<(div|span|p|a|ul|ol|li|h[1-6]|section|nav|main|header|footer|img|button|form|input|table|tr|td|script|style|link|meta|svg|path)(\s[^>]*)?>`, 2], [String.raw`</(div|span|p|a|ul|li|section|body|html|script|style|table)>`, 2], [String.raw`<\?xml`, 4],
  ], "gmi"),
  css: sig([
    [String.raw`^\s*[.#@:]?[\w-][\w\s.#:>+~,*\[\]="'()-]*\{\s*$`, 2], [String.raw`^\s*[a-z-]+\s*:\s*[^;{}]+;\s*$`, 1], [String.raw`@(media|import|font-face|keyframes|layer|supports|tailwind|apply)\b`, 4], [String.raw`^\s*:root\s*\{`, 4], [String.raw`\b(display|margin|padding|background|color|font-size|border|position|flex|grid)\s*:`, 2], [String.raw`\b\d+(px|rem|em|vh|vw|%)\b`, 1], [String.raw`#[0-9a-f]{3,8}\b`, 1],
  ], "gmi"),
};

const SHEBANG = /^#!\s*\/(?:usr\/)?bin\/(?:env\s+)?(\w+)/;

function count(text: string, re: RegExp, cap = 3): number {
  re.lastIndex = 0;
  let n = 0;
  while (n < cap && re.exec(text)) {
    n++;
    if (re.lastIndex === 0) break;
  }
  return n;
}

function raw(text: string, list: Sig[]): number {
  return list.reduce((sum, [re, w]) => sum + w * count(text, re), 0);
}

export interface Detection {
  lang: Lang;
  confidence: number;
  scores: [Lang, number][];
}

const nonEmpty = (text: string) => text.split("\n").filter((l) => l.trim() !== "");

function structured(text: string): Lang | null {
  const lines = nonEmpty(text);
  if (lines.length === 0) return null;
  const t = text.trim();

  if (/^[{\[]/.test(t) && /[}\]]$/.test(t)) {
    try { JSON.parse(t); return "json"; } catch { /* not strict json, fall through */ }
  }
  if (/^diff --git|^@@ -\d+(,\d+)? \+\d+(,\d+)? @@/m.test(t)) return "diff";
  const instr = lines.filter((l) => /^(FROM|RUN|CMD|ENTRYPOINT|COPY|ADD|ENV|EXPOSE|WORKDIR|ARG|LABEL|USER|VOLUME|HEALTHCHECK)\s/.test(l)).length;
  if (instr >= 2 && lines.some((l) => /^FROM\s/.test(l))) return "dockerfile";

  const codey = (l: string) => /[;{}]\s*$|^\s*(\/\/|\/\*)/.test(l);
  const comment = (l: string) => /^\s*#/.test(l);
  const body = lines.filter((l) => !comment(l));
  if (body.length >= 2) {
    const table = body.filter((l) => /^\s*\[[\w.\-" ]+\]\s*$/.test(l)).length;
    const assigns = body.filter((l) => /^\s*[\w.\-"]+\s*=\s*("[^"]*"|'[^']*'|-?\d[\d._]*|true|false|\[.*\]|\{.*\})\s*(#.*)?$/.test(l)).length;
    if (table >= 1 && assigns >= 1 && table + assigns >= body.length * 0.8) return "toml";
    if (table === 0 && assigns >= 3 && assigns === body.length && !/[({]/.test(t)) return "toml";
    const keys = body.filter((l) => !codey(l) && /^\s*(-\s+)?[\w.\-"'/]+:(\s+\S.*)?$|^\s*-\s+\S/.test(l)).length;
    const hasKey = body.some((l) => /^\s*(-\s+)?[\w.\-"'/]+:(\s|$)/.test(l));
    if (hasKey && keys >= body.length * 0.75 && !/\bdef\s|\bfn\s|\bfunc\s|\bclass\s/.test(t)) return "yaml";
  }
  return null;
}

export function detectLanguage(code: string, hint?: string | null): Detection {
  const fromHint = normalizeLang(hint);
  if (fromHint) return { lang: fromHint, confidence: 1, scores: [[fromHint, 1]] };

  const text = code.replace(/\r\n?/g, "\n");
  const first = text.trimStart().split("\n", 1)[0];
  const shebang = SHEBANG.exec(first);
  if (shebang) {
    const lang = normalizeLang(shebang[1] === "node" ? "js" : shebang[1]) ?? "bash";
    return { lang, confidence: 0.98, scores: [[lang, 10]] };
  }
  const exact = structured(text);
  if (exact) return { lang: exact, confidence: exact === "json" ? 0.99 : 0.9, scores: [[exact, 10]] };

  const s: Record<string, number> = {};
  for (const lang of ["rust", "go", "python", "c", "java", "sql", "bash", "html", "css"]) s[lang] = raw(text, SIGS[lang]);
  const js = raw(text, SIGS.javascript);
  const tsOnly = raw(text, SIGS.typescriptOnly);
  s.javascript = js;
  s.typescript = tsOnly >= 3 ? js + tsOnly : tsOnly;
  const cppOnly = raw(text, SIGS.cppOnly);
  s.cpp = cppOnly >= 3 ? s.c + cppOnly : cppOnly;
  if (cppOnly >= 3) s.c = Math.max(0, s.c - cppOnly);

  const semicolons = (text.match(/;\s*$/gm) ?? []).length;
  const braces = (text.match(/[{}]/g) ?? []).length;
  if (semicolons >= 2 || braces >= 4) s.python = Math.max(0, s.python - 4);
  if (s.html > 0 && (js >= 4 || s.rust >= 4 || s.go >= 4)) s.html = Math.max(0, s.html - 4);
  if (s.sql > 0 && (s.python >= 4 || s.rust >= 4 || s.go >= 4)) s.sql = Math.max(0, s.sql - 4);
  if (s.css > 0 && (js >= 4 || s.rust >= 4 || s.c >= 4 || cppOnly >= 3)) s.css = Math.max(0, s.css - 3);
  if (s.bash > 0 && (s.python >= 6 || s.rust >= 6 || s.go >= 6)) s.bash = Math.max(0, s.bash - 3);

  const ranked = (Object.entries(s) as [Lang, number][]).sort((a, b) => b[1] - a[1]);
  const [best, bestScore] = ranked[0];
  const second = ranked[1]?.[1] ?? 0;

  if (bestScore >= 4 && bestScore >= second * 1.25) {
    return { lang: best, confidence: bestScore / (bestScore + second + 3), scores: ranked.slice(0, 3) };
  }

  const subset = Object.values(HLJS_NAME);
  const auto = hljs.highlightAuto(text, subset);
  const guess = auto.language ? BY_HLJS[auto.language] : undefined;
  if (guess && auto.relevance >= 6) {
    return { lang: guess, confidence: Math.min(0.8, auto.relevance / 20), scores: ranked.slice(0, 3) };
  }
  if (bestScore >= 3) return { lang: best, confidence: bestScore / (bestScore + second + 3), scores: ranked.slice(0, 3) };
  return { lang: "text", confidence: 0, scores: ranked.slice(0, 3) };
}

export function highlight(code: string, lang: Lang): string {
  if (lang === "text") return escapeHtml(code);
  try {
    return hljs.highlight(code, { language: HLJS_NAME[lang], ignoreIllegals: true }).value;
  } catch {
    return escapeHtml(code);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ------------------------------------------------------------ line classes

type LineKind = "S" | "M" | "W" | "C" | "B" | "P";

const MD_STRUCTURE = /^\s*(#{1,6}\s|[-*+]\s+\S|\d+[.)]\s+\S|>\s?|\|.*\||!\[|<!--|---+\s*$|===+\s*$)/;
// plain text has no headings, so a leading # there is a comment
const MD_STRUCTURE_LOOSE = /^\s*([-*+]\s+\S|\d+[.)]\s+\S|>\s|\|.*\||!\[|<!--)/;

const STRONG = [
  /[{};]\s*$/,
  /^\s*[}\])]+[,;]?\s*$/,
  /^\s*(fn|func|def|impl|struct|enum|trait|package|pub(\([a-z]+\))?\s+(fn|struct|enum|use|mod|const))\s+\w/,
  /^\s*#\s*(include|define|pragma|ifdef|ifndef)\b/,
  /^\s*(import|from)\s+[\w.{*]+.*(\s+from\s+['"]|\s+import\s+|;)/,
  /^\s*use\s+\w+(::[\w{*]+)+/,
  /^\s*\$\s+\S/,
  /^\s*(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+(TABLE|INDEX|VIEW)|ALTER\s+TABLE)\b/i,
  /^\s*(sudo|apt(-get)?|brew|npm|npx|pnpm|yarn|pip3?|cargo|rustup|git|curl|wget|chmod|docker|kubectl|make)\s+[-\w./:@]+/,
  /^\s*(const|let|var)\s+[\w{[]+.*=/,
  /^\s*(class|interface|type)\s+[A-Z]\w*(<[^>]*>)?(\s+extends\s+\w+)?\s*(\{|:|=)/,
  /^\s*(async\s+)?(def|function)\s+\w+\s*\(/,
  /^\s*@\w+(\.\w+)*(\(.*\))?\s*$/,
];
const MEDIUM = [
  /^\s*[\w.:\]\[]+\([^()]*\)\s*;?\s*$/,
  /^\s*[\w.$\[\]]+\s*(:=|\+=|-=|\*=|\/=|=)\s*[^=\s].*$/,
  /(=>|->|::|\|\||&&|!=|==|<=|>=)/,
  /^\s*(if|for|while|switch|match|else|elif|try|catch|except|finally|return|break|continue|defer|go|select)\b.*[:({]\s*$/,
  /^\s*return\s+[\w"'(\[{].*$/,
  /^\s*(print|println|printf|console\.log|fmt\.\w+|puts)\(.*\)\s*;?$/,
];
const WEAK_INDENT = /^( {4,}|\t)\S/;
const COMMENT = /^\s*(\/\/|\/\*|\*\/|\*\s|#!|#\s|--\s)/;

function classify(line: string): LineKind {
  if (line.trim() === "") return "B";
  if (STRONG.some((re) => re.test(line))) return "S";
  if (MEDIUM.some((re) => re.test(line))) return "M";
  if (COMMENT.test(line) && !/^\s*[-*+]\s/.test(line)) return "C";
  if (WEAK_INDENT.test(line)) return "W";
  return "P";
}

interface Region { start: number; end: number; }

function proseish(lines: string[]): boolean {
  const words = lines.join(" ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const letters = words.filter((w) => /^[A-Za-z][a-z']*[.,;:!?]?$/.test(w)).length;
  return letters / words.length > 0.8 && lines.length < 6 && !lines.some((l) => /[{};=()]/.test(l));
}

export function findCodeRegions(lines: string[], opts: { strict: boolean; skip?: (i: number) => boolean }): Region[] {
  const kinds = lines.map((l, i) => (opts.skip?.(i) ? "P" : classify(l)));
  const isCode = (k: LineKind) => k === "S" || k === "M" || k === "W" || k === "C";
  const regions: Region[] = [];
  let i = 0;
  while (i < lines.length) {
    const k = kinds[i];
    const nextIdx = (from: number) => { let j = from; while (j < lines.length && kinds[j] === "B") j++; return j; };
    const seed = k === "S" || (k === "M" && isCode(kinds[nextIdx(i + 1)] ?? "P"));
    if (!seed) { i++; continue; }
    let end = i;
    let j = i + 1;
    while (j < lines.length) {
      if (isCode(kinds[j])) { end = j; j++; continue; }
      if (kinds[j] === "B") {
        const n = nextIdx(j);
        if (n < lines.length && isCode(kinds[n]) && n - j <= 2) { j = n; continue; }
      }
      break;
    }
    // a comment trailing the block belongs to whatever comes next
    while (end > i && kinds[end] === "C") end--;
    const slice = lines.slice(i, end + 1);
    const real = kinds.slice(i, end + 1).filter((x) => x === "S" || x === "M").length;
    const single = slice.length === 1;
    const lone = /^\s*(\$\s+\S|#\s*include\b|(SELECT|INSERT|UPDATE|DELETE|CREATE)\b.*;\s*$|(npm|pip3?|cargo|git|go|docker|brew|sudo)\s+\S)/i.test(slice[0]);
    const min = opts.strict ? 3 : 2;
    if ((slice.length >= min && real >= (opts.strict ? 2 : 1) && !proseish(slice)) || (single && lone) || (slice.length >= 2 && lone)) {
      regions.push({ start: i, end });
    }
    i = end + 1;
  }
  return regions;
}

// --------------------------------------------------------------- markdown

export interface Meta {
  title?: string;
  date?: string;
  description?: string;
  tags?: string[];
  cover?: string;
}

export interface ConvertResult {
  markdown: string;
  kind: "markdown" | "text" | "code" | "html";
  meta: Meta;
  report: string[];
}

export interface ConvertOptions {
  filename?: string;
  /** the text is a piece to insert into an existing draft */
  fragment?: boolean;
  /** a language the source already told us, such as the editor a snippet was copied from */
  hint?: string | null;
  parseHtml?: (html: string) => Document;
}

const FENCE = /^(\s*)(`{3,}|~{3,})\s*([^`\s]*)[^`]*$/;

function fenceFor(code: string): string {
  const longest = Math.max(0, ...(code.match(/`{3,}/g) ?? []).map((m) => m.length));
  return "`".repeat(Math.max(3, longest + 1));
}

export function fence(code: string, lang: Lang | ""): string {
  const f = fenceFor(code);
  return `${f}${lang}\n${code.replace(/\n+$/, "")}\n${f}`;
}

export function parseFrontmatter(text: string): { meta: Meta; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!m) return { meta: {}, body: text };
  const meta: Meta = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (key === "title") meta.title = value;
    else if (key === "date") meta.date = value;
    else if (key === "description") meta.description = value;
    else if (key === "cover") meta.cover = value;
    else if (key === "tags") meta.tags = value.replace(/^\[|\]$/g, "").split(",").map((t) => t.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  }
  return { meta, body: text.slice(m[0].length) };
}

interface Seg { fenced: boolean; lang: string; lines: string[]; fenceLine?: string; open?: string; close?: string; indent?: string }

function segments(lines: string[]): Seg[] {
  const out: Seg[] = [];
  let cur: Seg = { fenced: false, lang: "", lines: [] };
  let open: { marker: string; indent: string; info: string; raw: string } | null = null;
  for (const line of lines) {
    const m = FENCE.exec(line);
    if (!open) {
      if (m && !/`/.test(line.slice(m[1].length + m[2].length))) {
        if (cur.lines.length) out.push(cur);
        open = { marker: m[2], indent: m[1], info: m[3], raw: line };
        cur = { fenced: true, lang: m[3], lines: [], open: line, indent: m[1] };
        continue;
      }
      cur.lines.push(line);
    } else {
      if (m && m[2][0] === open.marker[0] && m[2].length >= open.marker.length && m[3] === "" && line.trim() === m[2]) {
        cur.close = line;
        out.push(cur);
        cur = { fenced: false, lang: "", lines: [] };
        open = null;
        continue;
      }
      cur.lines.push(line);
    }
  }
  if (open) { cur.close = undefined; out.push(cur); } else if (cur.lines.length) out.push(cur);
  return out;
}

/** every fenced block, with the 1-based line its opening fence sits on */
export function fencedBlocks(markdown: string): { lang: string; code: string; line: number }[] {
  const out: { lang: string; code: string; line: number }[] = [];
  let at = 1;
  for (const s of segments(markdown.split("\n"))) {
    if (s.fenced) {
      out.push({ lang: s.lang, code: s.lines.join("\n"), line: at });
      at += 1 + s.lines.length + (s.close !== undefined ? 1 : 0);
    } else at += s.lines.length;
  }
  return out;
}

export function setFenceLang(markdown: string, index: number, lang: Lang): string {
  const segs = segments(markdown.split("\n"));
  let n = -1;
  const out: string[] = [];
  for (const s of segs) {
    if (!s.fenced) { out.push(...s.lines); continue; }
    n++;
    if (n === index) {
      const opener = s.open!.replace(/^(\s*(`{3,}|~{3,}))\s*[^`\s]*/, `$1${lang === "text" ? "text" : lang}`);
      out.push(opener, ...s.lines);
    } else out.push(s.open!, ...s.lines);
    if (s.close !== undefined) out.push(s.close);
  }
  return out.join("\n");
}

function looksLikeMarkdown(text: string): boolean {
  const lines = nonEmpty(text);
  if (lines.some((l) => /^(`{3,}|~{3,})/.test(l))) return true;
  const hits = lines.filter((l) => /^(#{1,6}\s\S|>\s|[-*+]\s\S|\d+\.\s\S|!?\[[^\]]*\]\([^)]+\)|\|.+\|)/.test(l)).length;
  return hits >= 2 || /\*\*[^*\n]+\*\*|\]\(https?:/.test(text) && hits >= 1;
}

function wrapAll(code: string, lang: Lang): string {
  return fence(code.replace(/^\n+/, ""), lang);
}

function tally(langs: string[]): string {
  const counts = new Map<string, number>();
  for (const l of langs) counts.set(l, (counts.get(l) ?? 0) + 1);
  return [...counts].map(([l, n]) => (n > 1 ? `${l} x${n}` : l)).join(", ");
}

export function normalizeMarkdown(text: string, opts: { strict: boolean }): { markdown: string; report: string[] } {
  const report: string[] = [];
  const wrapped: string[] = [];
  const labelled: string[] = [];
  const renamed: string[] = [];
  let indented = 0;

  const out: string[] = [];
  for (const seg of segments(text.split("\n"))) {
    if (seg.fenced) {
      const code = seg.lines.join("\n");
      const known = normalizeLang(seg.lang);
      let lang: string = seg.lang;
      if (!seg.lang) {
        const d = detectLanguage(code);
        lang = d.lang;
        labelled.push(d.lang);
      } else if (known && known !== seg.lang) {
        renamed.push(`${seg.lang} -> ${known}`);
        lang = known;
      }
      const opener = (seg.open ?? "```").replace(/^(\s*(`{3,}|~{3,}))\s*[^`\s]*/, `$1${lang}`);
      out.push(opener, ...seg.lines);
      if (seg.close !== undefined) out.push(seg.close);
      else out.push((seg.indent ?? "") + "```");
      continue;
    }

    const lines = seg.lines;
    const skip = new Set<number>();
    const structure = opts.strict ? MD_STRUCTURE : MD_STRUCTURE_LOOSE;
    lines.forEach((l, i) => { if (structure.test(l) && !/^\s*#\s*(include|define|pragma|ifdef|ifndef)\b/.test(l)) skip.add(i); });

    // four-space indented blocks after a blank line
    const blockStarts: Region[] = [];
    for (let i = 0; i < lines.length; i++) {
      const prevBlank = i === 0 || lines[i - 1].trim() === "";
      if (prevBlank && /^( {4,}|\t)\S/.test(lines[i]) && !skip.has(i)) {
        let j = i;
        while (j + 1 < lines.length && (/^( {4,}|\t)/.test(lines[j + 1]) || (lines[j + 1].trim() === "" && j + 2 < lines.length && /^( {4,}|\t)\S/.test(lines[j + 2])))) j++;
        const before = lines.slice(0, i).reverse().find((l) => l.trim() !== "");
        const inList = before !== undefined && /^\s*([-*+]|\d+[.)])\s/.test(before);
        if (!inList) blockStarts.push({ start: i, end: j });
        i = j;
      }
    }
    const used = new Array(lines.length).fill(false);
    const replacements = new Map<number, { end: number; text: string }>();
    for (const r of blockStarts) {
      const code = lines.slice(r.start, r.end + 1).map((l) => l.replace(/^( {4}|\t)/, "")).join("\n").replace(/\n+$/, "");
      const d = detectLanguage(code);
      if (d.lang === "text" && code.split("\n").length < 2) continue;
      replacements.set(r.start, { end: r.end, text: fence(code, d.lang) });
      for (let k = r.start; k <= r.end; k++) used[k] = true;
      indented++;
    }

    const regions = findCodeRegions(lines, { strict: opts.strict, skip: (i) => skip.has(i) || used[i] });
    for (const r of regions) {
      if (used.slice(r.start, r.end + 1).some(Boolean)) continue;
      const rawCode = lines.slice(r.start, r.end + 1);
      const pad = Math.min(...rawCode.filter((l) => l.trim()).map((l) => /^\s*/.exec(l)![0].length));
      const code = rawCode.map((l) => l.slice(pad)).join("\n");
      const d = detectLanguage(code);
      if (d.lang === "text" && (rawCode.length < 4 || d.confidence === 0)) continue;
      replacements.set(r.start, { end: r.end, text: fence(code, d.lang) });
      for (let k = r.start; k <= r.end; k++) used[k] = true;
      wrapped.push(d.lang);
    }

    for (let i = 0; i < lines.length; i++) {
      const r = replacements.get(i);
      if (r) {
        if (out.length && out[out.length - 1].trim() !== "") out.push("");
        out.push(r.text);
        i = r.end;
        if (i + 1 < lines.length && lines[i + 1].trim() !== "") out.push("");
      } else out.push(lines[i]);
    }
  }

  if (wrapped.length) report.push(`found ${wrapped.length} loose code block${wrapped.length > 1 ? "s" : ""} and fenced ${wrapped.length > 1 ? "them" : "it"}: ${tally(wrapped)}`);
  if (indented) report.push(`turned ${indented} indented block${indented > 1 ? "s" : ""} into fenced code`);
  if (labelled.length) report.push(`labelled ${labelled.length} unlabelled fence${labelled.length > 1 ? "s" : ""}: ${tally(labelled)}`);
  if (renamed.length) report.push(`renamed language tags: ${[...new Set(renamed)].join(", ")}`);
  return { markdown: out.join("\n").replace(/\n{3,}/g, "\n\n"), report };
}

export function toMarkdown(input: string, opts: ConvertOptions = {}): ConvertResult {
  let text = input.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const report: string[] = [];

  const ext = opts.filename?.split(".").pop()?.toLowerCase();
  if (ext === "html" || ext === "htm") {
    const md = htmlToMarkdown(text, opts.parseHtml);
    const inner = normalizeMarkdown(md, { strict: true });
    return { markdown: inner.markdown.trim() + "\n", kind: "html", meta: {}, report: ["converted html to markdown", ...inner.report] };
  }

  const fileLang = languageForFilename(opts.filename) ?? normalizeLang(opts.hint);
  if (fileLang && fileLang !== "text" && !(ext === "md" || ext === "markdown" || ext === "txt")) {
    const lang = fileLang;
    report.push(`whole file is ${lang}, fenced it`);
    return { markdown: wrapAll(text.trimEnd(), lang) + "\n", kind: "code", meta: {}, report };
  }

  let meta: Meta = {};
  if (!opts.fragment) {
    const fm = parseFrontmatter(text);
    meta = fm.meta;
    text = fm.body;
  }

  const lines = nonEmpty(text);
  if (lines.length) {
    const kinds = lines.map(classify);
    const share = kinds.filter((k) => k === "S" || k === "M" || k === "W" || k === "C").length / lines.length;
    const md = looksLikeMarkdown(text);
    if (!md && share >= 0.8 && lines.length >= (opts.fragment ? 1 : 2) && !proseish(lines)) {
      const d = detectLanguage(text, opts.hint);
      if (d.lang !== "text" || share >= 0.95) {
        report.push(`all of it looks like ${d.lang}, fenced it`);
        return { markdown: wrapAll(text.trimEnd(), d.lang) + "\n", kind: "code", meta, report };
      }
    }
    const strict = md;
    const res = normalizeMarkdown(text.replace(/^[\t ]*•[\t ]+/gm, "- "), { strict });
    report.push(...res.report);
    if (!opts.fragment) {
      const h1 = /^#\s+(.+)$/m.exec(res.markdown);
      if (h1 && !meta.title) meta.title = h1[1].trim();
    }
    return { markdown: res.markdown.trim() + "\n", kind: md ? "markdown" : "text", meta, report };
  }
  return { markdown: "", kind: "text", meta, report };
}

// -------------------------------------------------------------------- html

const BLOCK_TAGS = new Set(["P", "DIV", "SECTION", "ARTICLE", "MAIN", "HEADER", "FOOTER", "ASIDE", "NAV", "UL", "OL", "LI", "PRE", "BLOCKQUOTE", "TABLE", "H1", "H2", "H3", "H4", "H5", "H6", "HR", "FIGURE"]);
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "BUTTON", "SVG", "TEMPLATE", "HEAD", "IFRAME", "FORM", "INPUT", "SELECT", "TEXTAREA"]);

function defaultParse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

function langFromClass(el: Element | null): string | null {
  if (!el) return null;
  const cls = `${el.getAttribute("class") ?? ""} ${el.getAttribute("data-language") ?? ""} ${el.getAttribute("data-lang") ?? ""}`;
  const m = /(?:language|lang|highlight-source|brush:)[-\s]?([\w+#.-]+)/i.exec(cls) ?? /\bhljs\s+([\w+#-]+)/.exec(cls);
  return m ? m[1] : null;
}

export function htmlToMarkdown(html: string, parse: (h: string) => Document = defaultParse): string {
  const doc = parse(html);
  const root = doc.body ?? (doc as unknown as { documentElement: Element }).documentElement;

  const text = (n: Node): string => (n.textContent ?? "");

  const codeText = (pre: Element): string => {
    const parts: string[] = [];
    const walk = (n: Node) => {
      if (n.nodeType === 3) parts.push(n.textContent ?? "");
      else if (n.nodeType === 1) {
        const el = n as Element;
        if (el.tagName.toUpperCase() === "BR") parts.push("\n");
        else if (SKIP_TAGS.has(el.tagName.toUpperCase())) return;
        else {
          el.childNodes.forEach(walk);
          if (el.tagName.toUpperCase() === "DIV" && el.nextSibling && !(parts[parts.length - 1] ?? "").endsWith("\n") && pre.querySelectorAll("div").length > 1) parts.push("\n");
        }
      }
    };
    pre.childNodes.forEach(walk);
    return parts.join("").replace(/ /g, " ").replace(/\n+$/, "").replace(/^\n+/, "");
  };

  const inline = (n: Node): string => {
    if (n.nodeType === 3) return (n.textContent ?? "").replace(/\s+/g, " ");
    if (n.nodeType !== 1) return "";
    const el = n as Element;
    const tag = el.tagName.toUpperCase();
    if (SKIP_TAGS.has(tag)) return "";
    const kids = () => Array.from(el.childNodes).map(inline).join("");
    switch (tag) {
      case "BR": return "  \n";
      case "STRONG": case "B": { const s = kids().trim(); return s ? `**${s}**` : ""; }
      case "EM": case "I": { const s = kids().trim(); return s ? `*${s}*` : ""; }
      case "DEL": case "S": case "STRIKE": { const s = kids().trim(); return s ? `~~${s}~~` : ""; }
      case "CODE": case "KBD": case "SAMP": {
        const s = text(el);
        if (!s.trim()) return "";
        const ticks = s.includes("`") ? "``" : "`";
        return `${ticks}${s}${ticks}`;
      }
      case "A": {
        const href = el.getAttribute("href") ?? "";
        const label = kids().trim();
        if (!label) return "";
        return href && !href.startsWith("javascript:") ? `[${label}](${href})` : label;
      }
      case "IMG": {
        const src = el.getAttribute("src") ?? "";
        return src ? `![${(el.getAttribute("alt") ?? "").replace(/[\[\]]/g, "")}](${src})` : "";
      }
      default: return kids();
    }
  };

  const list = (el: Element, depth: number): string => {
    const ordered = el.tagName.toUpperCase() === "OL";
    let i = Number(el.getAttribute("start") ?? 1);
    const lines: string[] = [];
    for (const li of Array.from(el.children).filter((c) => c.tagName.toUpperCase() === "LI")) {
      const marker = ordered ? `${i++}. ` : "- ";
      const pad = " ".repeat(marker.length);
      const own: string[] = [];
      const nested: string[] = [];
      for (const child of Array.from(li.childNodes)) {
        if (child.nodeType === 1 && (child as Element).tagName.toUpperCase().match(/^(UL|OL)$/)) nested.push(list(child as Element, depth + 1));
        else if (child.nodeType === 1 && (child as Element).tagName.toUpperCase() === "PRE") nested.push(blocks(child as Element).trim().split("\n").map((l) => pad + l).join("\n"));
        else if (child.nodeType === 1 && (child as Element).tagName.toUpperCase() === "P") own.push(inline(child).trim());
        else own.push(inline(child));
      }
      const head = own.join(" ").replace(/\s+/g, " ").trim();
      lines.push(marker + head);
      for (const n of nested) lines.push(n.split("\n").map((l) => pad + l).join("\n"));
    }
    return lines.join("\n");
  };

  const table = (el: Element): string => {
    const rows = Array.from(el.querySelectorAll("tr")).map((tr) =>
      Array.from(tr.children).filter((c) => c.tagName.toUpperCase() === "TH" || c.tagName.toUpperCase() === "TD").map((c) => inline(c).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim()),
    ).filter((r) => r.length);
    if (!rows.length) return "";
    const width = Math.max(...rows.map((r) => r.length));
    const pad = (r: string[]) => [...r, ...Array(width - r.length).fill("")];
    const head = pad(rows[0]);
    const body = rows.slice(1).map(pad);
    return [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...body.map((r) => `| ${r.join(" | ")} |`)].join("\n");
  };

  // chat UIs put the language name in a small header just above the block
  const headers = new Map<Element, string>();
  const consumed = new Set<Element>();
  const firstLabel = (el: Element): string => {
    let found = "";
    const walk = (n: Node) => {
      if (found) return;
      if (n.nodeType === 3) found = (n.textContent ?? "").trim();
      else if (n.nodeType === 1 && !SKIP_TAGS.has((n as Element).tagName.toUpperCase())) n.childNodes.forEach(walk);
    };
    walk(el);
    return found.toLowerCase();
  };
  root.querySelectorAll("pre").forEach((pre) => {
    for (const candidate of [pre.parentElement?.previousElementSibling, pre.previousElementSibling]) {
      if (!candidate) continue;
      const label = firstLabel(candidate);
      if (label && label.length < 24 && normalizeLang(label) && text(candidate).trim().length < 40) {
        headers.set(pre, label);
        consumed.add(candidate);
        return;
      }
    }
  });

  const codeBlock = (pre: Element): string => {
    const code = pre.querySelector("code");
    const lang = langFromClass(code) ?? langFromClass(pre) ?? langFromClass(pre.parentElement) ?? headers.get(pre) ?? null;
    const body = codeText(code ?? pre);
    const known = normalizeLang(lang);
    return `\n\n${fence(body, known ?? (lang ? (lang as Lang) : ""))}\n\n`;
  };

  const blocks = (n: Node): string => {
    if (n.nodeType === 3) return (n.textContent ?? "").replace(/\s+/g, " ");
    if (n.nodeType !== 1) return "";
    const el = n as Element;
    const tag = el.tagName.toUpperCase();
    if (SKIP_TAGS.has(tag) || consumed.has(el)) return "";
    const children = () => Array.from(el.childNodes).map(blocks).join("");
    switch (tag) {
      case "H1": case "H2": case "H3": case "H4": case "H5": case "H6": {
        const t = inline(el).replace(/\s+/g, " ").trim();
        return t ? `\n\n${"#".repeat(Number(tag[1]))} ${t}\n\n` : "";
      }
      case "P": { const t = inline(el).trim(); return t ? `\n\n${t}\n\n` : ""; }
      case "PRE": return codeBlock(el);
      case "UL": case "OL": return `\n\n${list(el, 0)}\n\n`;
      case "BLOCKQUOTE": return `\n\n${children().trim().split("\n").map((l) => (l ? `> ${l}` : ">")).join("\n")}\n\n`;
      case "HR": return "\n\n---\n\n";
      case "TABLE": return `\n\n${table(el)}\n\n`;
      case "FIGURE": return `\n\n${children().trim()}\n\n`;
      case "BR": return "  \n";
      case "BODY": case "HTML": return children();
      case "DIV": case "SECTION": case "ARTICLE": case "MAIN": case "HEADER": case "FOOTER": case "ASIDE": case "NAV": case "LI": {
        const hasBlock = Array.from(el.querySelectorAll("*")).some((d) => BLOCK_TAGS.has(d.tagName.toUpperCase()));
        if (hasBlock) return `\n\n${children()}\n\n`;
        const t = inline(el).trim();
        return t ? `\n\n${t}\n\n` : "";
      }
      default: {
        const hasBlock = Array.from(el.querySelectorAll("*")).some((d) => BLOCK_TAGS.has(d.tagName.toUpperCase()));
        return hasBlock ? children() : inline(el);
      }
    }
  };

  const md = blocks(root).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return md + "\n";
}
