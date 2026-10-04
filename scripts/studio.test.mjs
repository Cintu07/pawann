import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import {
  detectLanguage, toMarkdown, htmlToMarkdown, normalizeLang, fencedBlocks, setFenceLang, parseFrontmatter,
} from "../src/lib/studio/convert.ts";

const parse = (html) => parseHTML(`<!doctype html><html><body>${html}</body></html>`).document;

const SAMPLES = {
  rust: [
    `fn main() {\n    let mut v = Vec::new();\n    v.push(1);\n    println!("{:?}", v);\n}`,
    `impl Server {\n    pub fn new(addr: &str) -> Result<Self, Error> {\n        Ok(Self { addr: addr.to_string() })\n    }\n}`,
    `#[derive(Debug, Clone)]\nstruct Point {\n    x: f32,\n    y: f32,\n}`,
    `use std::collections::HashMap;\n\nlet m: HashMap<String, u32> = HashMap::new();`,
  ],
  go: [
    `package main\n\nimport "fmt"\n\nfunc main() {\n\tx := 5\n\tfmt.Println(x)\n}`,
    `func (s *Server) Handle(ctx context.Context) error {\n\tif err != nil {\n\t\treturn err\n\t}\n\treturn nil\n}`,
    `type Store struct {\n\tmu sync.Mutex\n\tm  map[string]int\n}`,
    `for i, v := range items {\n\tgo func() { ch <- v }()\n}`,
  ],
  typescript: [
    `interface User {\n  id: number;\n  name: string;\n}\n\nexport function greet(u: User): string {\n  return \`hi \${u.name}\`;\n}`,
    `type Result<T> = { ok: true; value: T } | { ok: false; error: Error };\nconst x = foo as unknown as string;`,
    `export async function load(id: string): Promise<Post | null> {\n  const res = await fetch(\`/api/\${id}\`);\n  return res.ok ? ((await res.json()) as Post) : null;\n}`,
  ],
  javascript: [
    `const add = (a, b) => a + b;\nconsole.log(add(1, 2));`,
    `function debounce(fn, ms) {\n  let t;\n  return (...args) => {\n    clearTimeout(t);\n    t = setTimeout(() => fn(...args), ms);\n  };\n}\nmodule.exports = debounce;`,
  ],
  python: [
    `def fib(n):\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(fib(10))`,
    `class Store:\n    def __init__(self):\n        self.items = {}\n\n    def add(self, k, v):\n        self.items[k] = v`,
    `import numpy as np\n\nx = np.zeros((3, 3))\nfor i in range(3):\n    x[i, i] = 1`,
  ],
  c: [
    `#include <stdio.h>\n\nint main(void) {\n    printf("hello\\n");\n    return 0;\n}`,
    `typedef struct node {\n    int val;\n    struct node *next;\n} node_t;\n\nnode_t *n = malloc(sizeof(node_t));`,
  ],
  cpp: [
    `#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> v{1, 2, 3};\n    std::cout << v.size() << std::endl;\n}`,
    `template <typename T>\nclass Box {\npublic:\n    explicit Box(T v) : v_(std::move(v)) {}\nprivate:\n    T v_;\n};`,
  ],
  java: [
    `public class Main {\n    public static void main(String[] args) {\n        System.out.println("hi");\n    }\n}`,
  ],
  sql: [
    `SELECT u.id, count(*) AS n\nFROM users u\nJOIN orders o ON o.user_id = u.id\nWHERE o.created_at > now() - interval '7 days'\nGROUP BY u.id\nORDER BY n DESC;`,
    `CREATE TABLE posts (\n  id BIGINT PRIMARY KEY,\n  title TEXT NOT NULL\n);`,
  ],
  bash: [
    `$ cargo build --release\n$ ./target/release/heresy ./repo`,
    `sudo apt update && sudo apt install -y build-essential\ncd ~/src\nmake -j8`,
    `#!/bin/bash\nset -e\nfor f in *.go; do\n  echo "$f"\ndone`,
  ],
  json: [`{"name": "x", "version": "1.0.0", "deps": ["a", "b"]}`, `[\n  {"id": 1},\n  {"id": 2}\n]`],
  yaml: [`name: pages\non:\n  push:\n    branches: [main]\njobs:\n  build:\n    runs-on: ubuntu-latest`, `- name: a\n  value: 1\n- name: b\n  value: 2`],
  toml: [`[package]\nname = "heresy"\nversion = "0.1.0"\n\n[dependencies]\nserde = "1"`],
  html: [`<!doctype html>\n<html>\n<body>\n<div class="a"><p>hi</p></div>\n</body>\n</html>`, `<div class="card">\n  <h2>title</h2>\n  <p>text</p>\n</div>`],
  css: [`.card {\n  color: red;\n  margin: 0 auto;\n}\n\n@media (max-width: 600px) {\n  .card { padding: 4px; }\n}`, `:root {\n  --bg: #fff;\n}`],
  dockerfile: [`FROM node:20\nWORKDIR /app\nCOPY . .\nRUN npm ci\nCMD ["node", "server.js"]`],
  diff: [`diff --git a/a.go b/a.go\n--- a/a.go\n+++ b/a.go\n@@ -1,3 +1,3 @@\n-old\n+new`],
};

for (const [lang, list] of Object.entries(SAMPLES)) {
  list.forEach((code, i) => {
    test(`detects ${lang} #${i + 1}`, () => {
      const d = detectLanguage(code);
      assert.equal(d.lang, lang, `got ${d.lang} (${JSON.stringify(d.scores)})`);
    });
  });
}

test("hint wins over content", () => assert.equal(detectLanguage("x = 1", "py").lang, "python"));
test("aliases", () => {
  assert.equal(normalizeLang("golang"), "go");
  assert.equal(normalizeLang("RS"), "rust");
  assert.equal(normalizeLang("c++"), "cpp");
  assert.equal(normalizeLang("zsh"), "bash");
  assert.equal(normalizeLang("klingon"), null);
});

test("plain text with a rust block in the middle", () => {
  const r = toMarkdown(`here is how i add two numbers.\n\nfn add(a: i32, b: i32) -> i32 {\n    a + b\n}\n\nthat is all there is to it.`);
  assert.match(r.markdown, /```rust\nfn add\(a: i32, b: i32\) -> i32 \{\n {4}a \+ b\n\}\n```/);
  assert.match(r.markdown, /^here is how i add two numbers\./);
  assert.match(r.markdown, /that is all there is to it\.\n$/);
});

test("plain text with two different blocks", () => {
  const r = toMarkdown(`first install it:\n\n$ cargo install heresy\n\nthen run it:\n\npackage main\n\nfunc main() {\n\tfmt.Println("hi")\n}\n\ndone.`);
  assert.match(r.markdown, /```bash\n\$ cargo install heresy\n```/);
  assert.match(r.markdown, /```go\npackage main/);
});

test("markdown: unlabeled fence gets a language, aliases are renamed", () => {
  const r = toMarkdown("# t\n\n```\nfunc main() {\n\tx := 1\n\t_ = x\n}\n```\n\n```golang\nfmt.Println(1)\n```\n\n```RS\nlet x = 1;\n```\n");
  assert.deepEqual(fencedBlocks(r.markdown).map((b) => b.lang), ["go", "go", "rust"]);
});

test("markdown: indented block becomes a fence", () => {
  const r = toMarkdown("# title\n\nrun this:\n\n    fn main() {\n        println!(\"hi\");\n    }\n\nthen stop.\n");
  assert.deepEqual(fencedBlocks(r.markdown).map((b) => b.lang), ["rust"]);
  assert.match(r.markdown, /```rust\nfn main\(\) \{\n {4}println!/);
});

test("a source file is fenced whole and keeps its language", () => {
  const r = toMarkdown("package main\n\nfunc main() {}\n", { filename: "main.go" });
  assert.equal(r.kind, "code");
  assert.match(r.markdown, /^```go\npackage main/);
});

test("pasting code with no markdown around it fences it", () => {
  const r = toMarkdown("def f(x):\n    if x:\n        return 1\n    return 2\n", { fragment: true });
  assert.equal(r.kind, "code");
  assert.match(r.markdown, /^```python/);
});

test("editor hint is trusted for a pasted snippet", () => {
  const r = toMarkdown("let x = 5;\nlet y = x * 2;", { fragment: true, hint: "rust" });
  assert.match(r.markdown, /^```rust/);
});

test("prose is left alone", () => {
  const prose = "I wrote this tool (on a plane, mostly), and it found one bug: a lock that never got released.\n\nIt took a while; the first versions flagged everything.\n\n- first, the idea\n- second, the code (all of it)\n\n> a quote, with a colon: here\n";
  const r = toMarkdown(prose);
  assert.equal(r.markdown.includes("```"), false, r.markdown);
});

test("markdown headings and lists survive", () => {
  const md = "# Title\n\n## Section\n\n1. one\n2. two\n\n* a\n* b\n\n| a | b |\n|---|---|\n| 1 | 2 |\n";
  const r = toMarkdown(md);
  assert.equal(r.markdown.includes("```"), false, r.markdown);
  assert.equal(r.meta.title, "Title");
});

test("frontmatter is read and removed", () => {
  const fm = parseFrontmatter("---\ntitle: hello: world\ndate: 2026-10-03\ntags: go, rust\n---\nbody");
  assert.equal(fm.meta.title, "hello: world");
  assert.deepEqual(fm.meta.tags, ["go", "rust"]);
  assert.equal(fm.body, "body");
});

test("changing a fence language rewrites the markdown", () => {
  const md = "a\n\n```text\nx\n```\n\nb\n\n```go\ny\n```\n";
  assert.deepEqual(fencedBlocks(setFenceLang(md, 1, "rust")).map((b) => b.lang), ["text", "rust"]);
});

test("html from a web page becomes markdown", () => {
  const md = htmlToMarkdown(
    `<h1>Title</h1><p>hello <strong>bold</strong> and <a href="https://x.dev">a link</a> with <code>code</code></p>
     <pre><code class="language-rust">fn a() {}\nfn b() {}</code></pre>
     <ul><li>one</li><li>two<ul><li>nested</li></ul></li></ul>
     <table><tr><th>a</th><th>b</th></tr><tr><td>1</td><td>2</td></tr></table>
     <img src="https://x.dev/i.png" alt="pic">`,
    parse,
  );
  assert.match(md, /^# Title/);
  assert.match(md, /hello \*\*bold\*\* and \[a link\]\(https:\/\/x\.dev\) with `code`/);
  assert.match(md, /```rust\nfn a\(\) \{\}\nfn b\(\) \{\}\n```/);
  assert.match(md, /- one\n- two\n {2}- nested/);
  assert.match(md, /\| a \| b \|\n\| --- \| --- \|\n\| 1 \| 2 \|/);
  assert.match(md, /!\[pic\]\(https:\/\/x\.dev\/i\.png\)/);
});

test("a chat-style code block takes its language from the header", () => {
  const md = htmlToMarkdown(`<div><div><span>python</span><button>Copy code</button></div><div><pre><code>print(1)</code></pre></div></div>`, parse);
  assert.match(md, /```python\nprint\(1\)\n```/);
});

test("html file import", () => {
  const r = toMarkdown("<html><body><h2>Hi</h2><p>x</p></body></html>", { filename: "a.html", parseHtml: parse });
  assert.equal(r.kind, "html");
  assert.match(r.markdown, /^## Hi/);
});

test("fence grows when the code contains backticks", () => {
  const r = toMarkdown("```\n```inner```\n```\n");
  assert.ok(r.markdown.length > 0);
});

// ---------------------------------------------------------------- post.ts

import { slugify, slugFromTitle, describe, buildPostFile, extractSvgs, referencedImages, suggestTags, stripLeadingTitle } from "../src/lib/studio/post.ts";
import { looksLikeHtmlDocument } from "../src/lib/studio/convert.ts";
import { commitFiles, waitForDeploy, fileExists } from "../src/lib/studio/publish.ts";

test("slugify", () => {
  assert.equal(slugify("Building a Membership System That Says \"I Don't Know\""), "building-a-membership-system-that-says-i-don-t-know");
  assert.equal(slugify("  ciot: a cpu engine!! "), "ciot-a-cpu-engine");
  assert.equal(slugify("Café déjà vu"), "cafe-deja-vu");
});

test("describe picks the first real paragraph and trims it", () => {
  const md = "# T\n\n> quote\n\n![x](/a.png)\n\n```go\nx\n```\n\nI built a thing that **finds bugs** by [reading code](https://x.dev). It took a weekend and a lot of coffee, and the first versions were wrong about almost everything they flagged.";
  const d = describe(md);
  assert.ok(d.startsWith("I built a thing that finds bugs by reading code."), d);
  assert.ok(d.length <= 160);
});

test("post file has frontmatter the site builder can read, and no duplicate title", () => {
  const file = buildPostFile({ title: "A: B", slug: "a-b", date: "2026-10-03", description: "one\ntwo", tags: ["go", "rust"], cover: "/assets/img/c.png", body: "# A: B\n\nbody\n" });
  assert.equal(file, "---\ntitle: A: B\ndate: 2026-10-03\ndescription: one two\ntags: go, rust\ncover: /assets/img/c.png\n---\nbody\n");
  assert.equal(stripLeadingTitle("# Other\n\nx", "A"), "# Other\n\nx");
});

test("raw svg and inline-svg fences become image files", () => {
  const md = "before\n\n<svg viewBox=\"0 0 1 1\"><rect/></svg>\n\n```inline-svg\n<svg><g/></svg>\n```\n\n```html\n<svg>keep me</svg>\n```\n";
  const r = extractSvgs(md, "my-post");
  assert.deepEqual(r.files.map((f) => f.name), ["my-post-diagram-1.svg", "my-post-diagram-2.svg"]);
  assert.match(r.markdown, /!\[diagram\]\(\/assets\/img\/my-post-diagram-1\.svg\)/);
  assert.match(r.markdown, /<svg>keep me<\/svg>/);
  assert.deepEqual(referencedImages(r.markdown), ["my-post-diagram-1.svg", "my-post-diagram-2.svg"]);
});

test("tags come from the languages in the code", () => {
  assert.deepEqual(suggestTags("```rust\na\n```\n\n```rust\nb\n```\n\n```go\nc\n```\n\n```bash\nd\n```"), ["rust", "go"]);
});

// -------------------------------------------------------------- publish.ts

function fakeGitHub({ conflictOnce = false } = {}) {
  const calls = [];
  let refCalls = 0;
  const f = async (url, init = {}) => {
    const path = url.replace("https://api.github.com/repos/Cintu07/Cintu07.github.io", "");
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method: init.method ?? "GET", path, body, auth: init.headers?.Authorization });
    const ok = (data, status = 200) => new Response(JSON.stringify(data), { status });
    if (path === "/git/ref/heads/main") return ok({ object: { sha: `head${++refCalls}` } });
    if (path.startsWith("/git/commits/head")) return ok({ tree: { sha: "tree0" } });
    if (path === "/git/blobs") return ok({ sha: `blob${calls.length}` });
    if (path === "/git/trees") return ok({ sha: "tree1" });
    if (path === "/git/commits") return ok({ sha: "newcommit", html_url: "https://github.com/x/commit/newcommit" });
    if (path === "/git/refs/heads/main") {
      if (conflictOnce && refCalls === 1) return ok({ message: "Update is not a fast forward" }, 422);
      return ok({});
    }
    if (path.startsWith("/contents/")) return ok({ message: "Not Found" }, 404);
    return ok({ message: "unexpected " + path }, 500);
  };
  return { f, calls };
}

test("publishing makes one commit with every file", async () => {
  const { f, calls } = fakeGitHub();
  const out = await commitFiles({ token: "tok" }, "post: hello", [
    { path: "content/posts/hello.md", content: "---\ntitle: héllo\n---\nbody" },
    { path: "assets/img/a.png", content: new Uint8Array([137, 80, 78, 71, 255, 0]) },
  ], f);
  assert.equal(out.sha, "newcommit");
  const blobs = calls.filter((c) => c.path === "/git/blobs");
  assert.equal(blobs.length, 2);
  assert.equal(Buffer.from(blobs[0].body.content, "base64").toString("utf8"), "---\ntitle: héllo\n---\nbody");
  assert.deepEqual([...Buffer.from(blobs[1].body.content, "base64")], [137, 80, 78, 71, 255, 0]);
  const tree = calls.find((c) => c.path === "/git/trees").body;
  assert.equal(tree.base_tree, "tree0");
  assert.deepEqual(tree.tree.map((e) => e.path), ["content/posts/hello.md", "assets/img/a.png"]);
  const commit = calls.find((c) => c.path === "/git/commits" && c.method === "POST").body;
  assert.equal(commit.message, "post: hello");
  assert.equal(commit.author.email, "pawankalyan1892@gmail.com");
  assert.deepEqual(commit.parents, ["head1"]);
  assert.ok(calls.every((c) => c.auth === "Bearer tok"));
});

test("a push race is retried once from the new head", async () => {
  const { f, calls } = fakeGitHub({ conflictOnce: true });
  const out = await commitFiles({ token: "t" }, "m", [{ path: "a.md", content: "x" }], f);
  assert.equal(out.sha, "newcommit");
  assert.deepEqual(calls.filter((c) => c.path === "/git/commits" && c.method === "POST").map((c) => c.body.parents[0]), ["head1", "head2"]);
});

test("fileExists reads 404 as no", async () => {
  const { f } = fakeGitHub();
  assert.equal(await fileExists({ token: "t" }, "content/posts/x.md", f), false);
});

test("deploy status is followed until the run completes", async () => {
  const states = [[], [{ status: "in_progress", conclusion: null }], [{ status: "completed", conclusion: "success" }]];
  const f = async () => new Response(JSON.stringify({ workflow_runs: states.shift() }), { status: 200 });
  const seen = [];
  const out = await waitForDeploy({ token: "t" }, "abc", (s) => seen.push(s), f, async () => {});
  assert.equal(out, "success");
  assert.deepEqual(seen, ["waiting for the build to start", "building (in progress)"]);
});

test("a token without actions access just means unknown", async () => {
  const f = async () => new Response("{}", { status: 403 });
  assert.equal(await waitForDeploy({ token: "t" }, "abc", () => {}, f, async () => {}), "unknown");
});

test("fenced blocks know which line they start on", () => {
  const md = "intro\n\n```go\nx\ny\n```\n\ntext\n\n~~~rust\nz\n~~~\n";
  assert.deepEqual(fencedBlocks(md).map((b) => [b.lang, b.line]), [["go", 3], ["rust", 10]]);
});

import { readText, upsertBook } from "../src/lib/studio/publish.ts";

test("a book with the same pdf replaces the old entry, a new one goes first", () => {
  const list = [{ title: "a", pdf: "/assets/books/a.pdf", pages: 9, cover: "/x.jpg" }];
  assert.deepEqual(upsertBook(list, { title: "a2", pdf: "/assets/books/a.pdf" }), [{ title: "a2", pdf: "/assets/books/a.pdf" }]);
  assert.deepEqual(upsertBook(list, { title: "b", pdf: "/assets/books/b.pdf" }).map((b) => b.title), ["b", "a"]);
});

test("readText decodes the file and treats 404 as missing", async () => {
  const body = Buffer.from('[{"title":"héllo"}]', "utf8").toString("base64");
  const ok = async () => new Response(JSON.stringify({ content: body.slice(0, 10) + "\n" + body.slice(10) }), { status: 200 });
  assert.equal(await readText({ token: "t" }, "content/books.json", ok), '[{"title":"héllo"}]');
  const missing = async () => new Response('{"message":"Not Found"}', { status: 404 });
  assert.equal(await readText({ token: "t" }, "content/books.json", missing), null);
});

// ---------------------------------------------------------------- a whole web page becomes a post

const fullPage = (body, head = "") => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>gradient
descent is one line of code. here is everything that line hides.</title>${head}</head><body>${body}</body></html>`;
const parseFull = (html) => parseHTML(html).document;
const parseAny = (html) => parseHTML(html).document;

const PAGE = fullPage(`<article class="post"><h1 id="x">gradient
descent is one line of code. here is everything that line hides.</h1>
<p>almost every neural network you have used was trained by some version of <code>w = w - lr * slope</code>. this post builds that line from nothing.</p>
<h2 id="a">the problem: a number you can't solve for</h2>
<p>the <strong>slope</strong> of <code>f</code> is snake_case and 2 * 3 * 4 and a [bracket] and 1 &lt; 2.</p>
<div class="listing-cap">
slope.py
</div>
<div class="sourceCode" id="cb1"><pre class="sourceCode python"><code class="sourceCode python"><span id="cb1-1"><a href="#cb1-1" aria-hidden="true" tabindex="-1"></a><span class="kw">def</span> f(w):</span>
<span id="cb1-2"><a href="#cb1-2" aria-hidden="true" tabindex="-1"></a>    <span class="cf">return</span> (w <span class="op">-</span> <span class="dv">3</span>) <span class="op">**</span> <span class="dv">2</span></span></code></pre></div>
<div class="listing-cap">
output of slope.py, pasted unchanged
</div>
<pre><code>   h      error
1e-01    1.0e-01</code></pre>
<div class="figure">
<svg viewBox="0 0 680 100" xmlns="http://www.w3.org/2000/svg"><g><path d="M0 0L10 10"/></g></svg>
</div>
<table><colgroup><col style="width: 50%" /><col style="width: 50%" /></colgroup>
<thead><tr class="header"><th>lr</th><th>what <code>1 - 2 * lr</code></th></tr></thead>
<tbody><tr class="odd"><td>0.01</td><td>creeps</td></tr></tbody></table>
<p>second figure follows.</p>
<div class="figure"><svg viewBox="0 0 10 10"><rect width="5" height="5"/></svg></div>
</article>`);

test("a whole page becomes a finished post: title, standfirst, captions, languages, table", () => {
  const r = toMarkdown(PAGE, { filename: "gd.html", parseHtml: parseFull });
  assert.equal(r.document, true);
  assert.equal(r.meta.title, "gradient descent is one line of code. here is everything that line hides.");
  // the title lives in the fields, not twice in the body, and the first paragraph leads as a standfirst
  assert.ok(!/^# /m.test(r.markdown));
  assert.match(r.markdown, /^> almost every neural network you have used was trained by some version of `w = w - lr \* slope`\./);
  assert.match(r.markdown, /\n## the problem: a number you can't solve for\n/);
  // prose that looks like markdown is escaped, code is not
  assert.ok(r.markdown.includes("snake\\_case and 2 \\* 3 \\* 4 and a \\[bracket\\] and 1 &lt; 2"), r.markdown);
  // a listing's label stays a caption, and pandoc's language class is read
  assert.match(r.markdown, /\nslope\.py\n\{: \.code-caption \}\n\n```python\ndef f\(w\):\n    return \(w - 3\) \*\* 2\n```/);
  // output with no language is text, not a guess
  assert.match(r.markdown, /\noutput of slope\.py, pasted unchanged\n\{: \.code-caption \}\n\n```text\n {3}h {6}error\n1e-01 {4}1\.0e-01\n```/);
  assert.match(r.markdown, /\| lr \| what `1 - 2 \* lr` \|\n\| --- \| --- \|\n\| 0\.01 \| creeps \|/);
  assert.ok(!/<svg|<table|<div|class=/.test(r.markdown));
});

test("diagrams in a page are saved as svg files and linked", () => {
  const r = toMarkdown(PAGE, { filename: "gd.html", parseHtml: parseFull });
  assert.deepEqual(r.figures.map((f) => f.name), ["gradient-descent-is-one-fig-1.svg", "gradient-descent-is-one-fig-2.svg"]);
  assert.match(r.figures[0].content, /^<svg [^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(r.figures[0].content, /viewBox="0 0 680 100"/);
  assert.match(r.figures[1].content, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.deepEqual(referencedImages(r.markdown), ["gradient-descent-is-one-fig-1.svg", "gradient-descent-is-one-fig-2.svg"]);
});

test("a page's own description, date and tags are used", () => {
  const html = fullPage("<article><h1>t</h1><p>body</p></article>", '<meta name="description" content="a short summary"><meta property="article:published_time" content="2026-09-01T10:00:00Z"><meta name="keywords" content="ml, optimization ,python">');
  const r = toMarkdown(html, { filename: "p.html", parseHtml: parseFull });
  assert.equal(r.meta.description, "a short summary");
  assert.equal(r.meta.date, "2026-09-01");
  assert.deepEqual(r.meta.tags, ["ml", "optimization", "python"]);
});

test("an html file with no title is still just converted into the draft", () => {
  const r = toMarkdown("<html><body><h2>Hi</h2><p>x</p></body></html>", { filename: "a.html", parseHtml: parseAny });
  assert.equal(r.document, undefined);
  assert.match(r.markdown, /^## Hi/);
});

test("source pasted as text is recognised as a whole page", () => {
  assert.equal(looksLikeHtmlDocument(PAGE), true);
  assert.equal(looksLikeHtmlDocument("<!DOCTYPE html>\n<html>"), true);
  assert.equal(looksLikeHtmlDocument("<p>just a snippet</p>"), false);
  assert.equal(looksLikeHtmlDocument("fn main() {}"), false);
  assert.equal(looksLikeHtmlDocument("some <html> talk in prose"), false);
});

test("a multi megabyte page converts quickly", () => {
  const fontBlob = "A".repeat(2_000_000);
  const svgs = Array.from({ length: 7 }, (_, i) => `<div class="figure"><svg viewBox="0 0 680 300">${'<path d="M0 0L1 1"/>'.repeat(4000)}</svg></div><p>between ${i}</p>`).join("");
  const html = fullPage(`<article class="post"><h1>big</h1><p>${"word ".repeat(30)}</p>${svgs}</article>`, `<style>@font-face{src:url(data:font/woff2;base64,${fontBlob})}</style>`);
  const t = Date.now();
  const r = toMarkdown(html, { filename: "big.html", parseHtml: parseFull });
  assert.equal(r.figures.length, 7);
  assert.ok(r.markdown.length < 2000, String(r.markdown.length));
  assert.ok(Date.now() - t < 5000, `took ${Date.now() - t}ms`);
});

test("a long title gets a short url", () => {
  assert.equal(slugFromTitle("gradient descent is one line of code. here is everything that line hides."), "gradient-descent-is-one-line-of-code");
  assert.equal(slugFromTitle("ciot: a cpu inference engine for ternary networks"), "ciot-a-cpu-inference-engine-for-ternary-networks");
  assert.equal(slugFromTitle("Building a Membership System That Says \"I Don't Know\""), "building-a-membership-system-that-says-i-don-t-know");
  assert.equal(slugFromTitle("Why? Because."), "why-because");
});

test("a post that opens with a standfirst is described by it", () => {
  const d = describe("> almost every neural network you have used was trained by some version of `w = w - lr * slope`. this post builds that line from nothing.\n\n## the problem\n\nyou have a function that takes some numbers you are allowed to change.");
  assert.equal(d, "almost every neural network you have used was trained by some version of w = w - lr * slope. this post builds that line from nothing.");
});

// ---------------------------------------------------------------- tgz bundles, pdf titles and preview sections

import zlib from "node:zlib";
import { listTar, readTgz, entryBytes, summarize, pdfTitle } from "../src/lib/studio/archive.ts";
import { splitSections } from "../src/lib/studio/sections.ts";

function tarHeader(name, size, type = "0") {
  const h = Buffer.alloc(512);
  h.write(name, 0, 100, "utf8");
  h.write("0000644\0", 100);
  h.write("0000000\0", 108);
  h.write("0000000\0", 116);
  h.write(size.toString(8).padStart(11, "0") + "\0", 124);
  h.write("00000000000\0", 136);
  h.write("        ", 148);
  h.write(type, 156);
  h.write("ustar\x0000", 257);
  let sum = 0;
  for (const b of h) sum += b;
  h.write(sum.toString(8).padStart(6, "0") + "\0 ", 148);
  return h;
}
const padTo512 = (b) => Buffer.concat([b, Buffer.alloc((512 - (b.length % 512)) % 512)]);

/** entries: [name, content, { pax: "a very long path" }?] */
function tarOf(entries) {
  const parts = [];
  for (const [name, data, opts = {}] of entries) {
    const body = Buffer.from(data);
    if (opts.pax) {
      const rec = `path=${opts.pax}\n`;
      let n = rec.length + 2;
      while (String(n).length + 1 + rec.length !== n) n = String(n).length + 1 + rec.length;
      const px = Buffer.from(`${n} ${rec}`);
      parts.push(tarHeader("PaxHeader/x", px.length, "x"), padTo512(px));
    }
    parts.push(tarHeader(name, body.length, opts.type ?? "0"), padTo512(body));
  }
  parts.push(Buffer.alloc(1024));
  return Buffer.concat(parts);
}

test("a tar is listed file by file, with directories skipped", () => {
  const tar = tarOf([["module1/", "", { type: "5" }], ["module1/a.md", "hello"], ["module1/b.png", "x".repeat(700)]]);
  const files = listTar(new Uint8Array(tar));
  assert.deepEqual(files.map((f) => [f.name, f.size]), [["module1/a.md", 5], ["module1/b.png", 700]]);
  assert.equal(Buffer.from(tar.subarray(files[0].start, files[0].start + 5)).toString(), "hello");
});

test("a path too long for the header comes from the pax record", () => {
  const long = `module1/${"deep/".repeat(40)}chapter.md`;
  const files = listTar(new Uint8Array(tarOf([["short", "body", { pax: long }], ["after.txt", "z"]])));
  assert.deepEqual(files.map((f) => f.name), [long, "after.txt"]);
});

test("a .tgz is gunzipped from a blob and its files can be read back", async () => {
  const tar = tarOf([["a/one.txt", "first"], ["a/two.pdf", "%PDF-1.7 fake"], ["a/big.pdf", "%PDF-1.7 " + "x".repeat(900)]]);
  const bundle = await readTgz(new Blob([zlib.gzipSync(tar)]));
  assert.equal(bundle.files.length, 3);
  assert.equal(new TextDecoder().decode(entryBytes(bundle, bundle.files[0])), "first");
  const info = summarize(bundle.files);
  assert.equal(info.count, 3);
  assert.equal(info.pdf.name, "a/big.pdf", "the biggest pdf is the book");
  assert.equal(info.unpacked, 5 + 13 + 909);
});

test("something that is not a gzip is rejected, not half read", async () => {
  await assert.rejects(readTgz(new Blob(["this is plain text, not a tgz"])));
});

test("a pdf's title is read from its document info, however it is written", async () => {
  const pdf = (info) => new TextEncoder().encode(`%PDF-1.7\n1 0 obj\n<< ${info} /Producer (x) >>\nendobj\ntrailer\n<< /Info 1 0 R >>\n%%EOF\n`);
  assert.equal(await pdfTitle(pdf("/Title (the first compiler)")), "the first compiler");
  assert.equal(await pdfTitle(pdf("/Title <FEFF00680069002000E9>")), "hi é");
  assert.equal(await pdfTitle(pdf("/Title (a \\(b\\) \\\\ c\\101)")), "a (b) \\ cA");
  assert.equal(await pdfTitle(pdf("/Title ()")), null);
  assert.equal(await pdfTitle(pdf("/Author (nobody)")), null);
  assert.equal(await pdfTitle(new TextEncoder().encode("%PDF-1.7\n/Title (a bookmark)\n")), null, "no /Info, so no guess");
});

test("a title packed in a compressed object stream is found, and a bookmark's is not mistaken for it", async () => {
  const objs = ["<< /Title (A bookmark) /Parent 3 0 R >>", "<< /Title (Real Title) /Producer (x) >>"];
  const head = `7 0 9 ${objs[0].length} `;
  const packed = zlib.deflateSync(Buffer.from(head + objs.join("")));
  const file = Buffer.concat([
    Buffer.from(`%PDF-1.7\n5 0 obj\n<< /Type /ObjStm /N 2 /First ${head.length} /Filter /FlateDecode /Length ${packed.length} >>\nstream\n`),
    packed,
    Buffer.from("\nendstream\nendobj\n6 0 obj\n<< /Type /XRef /Info 9 0 R /Root 1 0 R >>\nstartxref\n0\n%%EOF\n"),
  ]);
  assert.equal(await pdfTitle(new Uint8Array(file)), "Real Title");
});

const DOC = "intro\n\n# One\n\ntext\n\n```py\n# not a heading\nx = 1\n```\n\n## Two\n\n```\ncode\n```\n\nmore\n";

test("sections are cut at headings, never inside a fence, and put back together exactly", () => {
  const s = splitSections(DOC);
  assert.equal(s.map((x) => x.text).join("\n"), DOC);
  assert.equal(s.length, 3);
  assert.ok(s[1].text.includes("# not a heading"), "a comment in code is not a heading");
  assert.deepEqual(s.map((x) => x.fenceBase), [0, 0, 1]);
});

test("a long section is cut between plain paragraphs only, and a list is never split", () => {
  const para = (n) => `paragraph ${n} ` + "word ".repeat(40);
  const prose = Array.from({ length: 8 }, (_, i) => para(i)).join("\n\n");
  const s = splitSections(prose, 600);
  assert.ok(s.length > 2);
  assert.equal(s.map((x) => x.text).join("\n"), prose);
  assert.ok(s.every((x) => /^paragraph \d/.test(x.text)), "every cut lands on a paragraph start");

  const list = "word ".repeat(200) + "\n\n- one\n\n- two\n\n- three\n\n1. a\n\n2. b\n\nafter " + "word ".repeat(10);
  const t = splitSections(list, 100);
  assert.equal(t.map((x) => x.text).join("\n"), list);
  assert.ok(t.every((x) => !/^(- |\d\. )/.test(x.text)), "no section starts inside a list");
  assert.ok(t.some((x) => x.text.includes("- one") && x.text.includes("- three") && x.text.includes("2. b")), "the list stays together");
});

test("a post with link definitions or footnotes stays in one piece", () => {
  const md = "# A\n\ntext [x][1]\n\n# B\n\nmore\n\n[1]: https://example.com\n";
  assert.equal(splitSections(md).length, 1);
  assert.equal(splitSections("# A\n\nx[^1]\n\n# B\n\n[^1]: note\n").length, 1);
});

test("fence counts add up across sections, even with tildes and longer fences", () => {
  const md = "# A\n\n~~~\n# in tildes\n~~~\n\n# B\n\n````md\n```\n# nested\n```\n````\n\n# C\n\n```\nlast\n```\n";
  const s = splitSections(md);
  assert.equal(s.length, 3);
  assert.deepEqual(s.map((x) => x.fenceBase), [0, 1, 2]);
  assert.equal(s.reduce((n, x) => n + fencedBlocks(x.text).length, 0), fencedBlocks(md).length);
});

// ---------------------------------------------------------------- uploads: parallel, in order, once

test("files go up a few at a time, the tree keeps their order, and a push race does not upload them again", async () => {
  let inFlight = 0;
  let peak = 0;
  let uploads = 0;
  let refCalls = 0;
  const posted = [];
  const f = async (url, init = {}) => {
    const path = url.replace("https://api.github.com/repos/Cintu07/Cintu07.github.io", "");
    const ok = (data, status = 200) => new Response(JSON.stringify(data), { status });
    if (path === "/git/blobs") {
      uploads++;
      inFlight++;
      peak = Math.max(peak, inFlight);
      // later files answer first, so a tree built in the order answers arrive in would be shuffled
      const wait = 40 - uploads * 5;
      await new Promise((r) => setTimeout(r, Math.max(wait, 1)));
      inFlight--;
      return ok({ sha: "blob-of-" + Buffer.from(JSON.parse(init.body).content, "base64").toString("utf8") });
    }
    if (path === "/git/ref/heads/main") return ok({ object: { sha: `head${++refCalls}` } });
    if (path.startsWith("/git/commits/head")) return ok({ tree: { sha: "tree0" } });
    if (path === "/git/trees") { posted.push(JSON.parse(init.body)); return ok({ sha: "tree1" }); }
    if (path === "/git/commits") return ok({ sha: "newcommit", html_url: "u" });
    if (path === "/git/refs/heads/main") return refCalls === 1 ? ok({ message: "not a fast forward" }, 422) : ok({});
    return ok({ message: "unexpected " + path }, 500);
  };
  const files = ["a", "b", "c", "d", "e", "f", "g"].map((n) => ({ path: `assets/${n}.txt`, content: n }));
  const out = await commitFiles({ token: "t" }, "m", files, f);
  assert.equal(out.sha, "newcommit");
  assert.ok(peak > 1, "more than one upload at a time");
  assert.ok(peak <= 4, `no more than four at a time, saw ${peak}`);
  assert.equal(uploads, 7, "seven files, seven uploads, even though the first push lost the race");
  assert.equal(refCalls, 2, "and the race was retried from the new head");
  assert.deepEqual(posted[0].tree.map((e) => [e.path, e.sha]), files.map((x) => [x.path, "blob-of-" + x.content]));
});
