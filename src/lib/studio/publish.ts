// Publishes a post to the blog repo from the browser. One commit holds the
// markdown and every image, so the pages workflow builds once.

export const SITE = {
  owner: "Cintu07",
  repo: "Cintu07.github.io",
  branch: "main",
  url: "https://cintu07.github.io",
  author: { name: "Pawan Kalyan", email: "pawankalyan1892@gmail.com" },
};

export interface PublishFile {
  path: string;
  /** null removes the file, which is how a renamed post leaves its old address */
  content: string | Uint8Array | null;
}

export interface Target {
  token: string;
  owner?: string;
  repo?: string;
  branch?: string;
}

type Fetch = typeof fetch;

class GitHubError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

const bytesOf = (c: string | Uint8Array) => (typeof c === "string" ? new TextEncoder().encode(c) : c);

export const postPath = (slug: string) => `content/posts/${slug}.md`;

function client(t: Target, f: Fetch = fetch) {
  const owner = t.owner ?? SITE.owner;
  const repo = t.repo ?? SITE.repo;
  const branch = t.branch ?? SITE.branch;
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  const call = async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    const res = await f(base + path, {
      ...init,
      headers: {
        // the blog repo is public, so reading it works without a token. an empty one must not be sent as a bad one
        ...(t.token ? { Authorization: `Bearer ${t.token}` } : {}),
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!res.ok) {
      let detail = res.statusText;
      try { detail = ((await res.json()) as { message?: string }).message ?? detail; } catch { /* no body */ }
      throw new GitHubError(res.status, detail);
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  };
  return { call, owner, repo, branch };
}

export function explain(err: unknown): string {
  if (err instanceof GitHubError) {
    if (err.status === 401) return "github rejected the token. make a new one and paste it again.";
    if (err.status === 403 || err.status === 404) return `github said ${err.status}: ${err.message}. the token needs Contents read and write on ${SITE.owner}/${SITE.repo}.`;
    if (err.status === 422) return `github said 422: ${err.message}.`;
    return `github said ${err.status}: ${err.message}`;
  }
  return err instanceof Error ? err.message : String(err);
}

export async function whoami(t: Target, f: Fetch = fetch): Promise<string> {
  const res = await f("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${t.token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new GitHubError(res.status, res.statusText);
  return ((await res.json()) as { login: string }).login;
}

export async function fileExists(t: Target, path: string, f: Fetch = fetch): Promise<boolean> {
  const { call, branch } = client(t, f);
  try {
    await call(`/contents/${path}?ref=${branch}`);
    return true;
  } catch (err) {
    if (err instanceof GitHubError && err.status === 404) return false;
    throw err;
  }
}

/** a text file from the blog repo with the sha of the version read, or null when it does not exist */
export async function readFile(t: Target, path: string, f: Fetch = fetch): Promise<{ text: string; sha: string } | null> {
  const { call, branch } = client(t, f);
  try {
    const file = await call<{ content: string; sha: string }>(`/contents/${path}?ref=${branch}`);
    const binary = atob(file.content.replace(/\n/g, ""));
    return { text: new TextDecoder().decode(Uint8Array.from(binary, (ch) => ch.charCodeAt(0))), sha: file.sha };
  } catch (err) {
    if (err instanceof GitHubError && err.status === 404) return null;
    throw err;
  }
}

/** a text file from the blog repo, or null when it does not exist */
export async function readText(t: Target, path: string, f: Fetch = fetch): Promise<string | null> {
  return (await readFile(t, path, f))?.text ?? null;
}

export interface PostRef {
  slug: string;
  title: string;
  date: string;
}

/**
 * The posts on the blog, newest first. The repo's own listing is the truth, because posts.json only
 * learns of a post after the build. posts.json then lends the titles and dates, and carries the list
 * alone if the repo cannot be listed.
 */
export async function listPublished(t: Target, f: Fetch = fetch): Promise<PostRef[]> {
  const known = new Map<string, PostRef>();
  try {
    const res = await f(`${SITE.url}/posts.json`);
    if (res.ok) {
      for (const p of (await res.json()) as PostRef[]) {
        if (p && typeof p.slug === "string") known.set(p.slug, { slug: p.slug, title: p.title ?? p.slug, date: p.date ?? "" });
      }
    }
  } catch { /* the repo listing below still works */ }

  let slugs: string[] | null = null;
  try {
    const { call, branch } = client(t, f);
    const items = await call<{ name: string; type: string }[]>(`/contents/content/posts?ref=${branch}`);
    slugs = items.filter((i) => i.type === "file" && i.name.endsWith(".md")).map((i) => i.name.slice(0, -3));
  } catch { /* rate limited or offline: posts.json alone */ }

  const all = (slugs ?? [...known.keys()]).map((slug) => known.get(slug) ?? { slug, title: slug, date: "" });
  // an ISO date sorts as text; a post posts.json has not met yet is newer than anything it has
  return all.sort((a, b) => (b.date || "9999").localeCompare(a.date || "9999") || a.slug.localeCompare(b.slug));
}

export interface BookEntry {
  title: string;
  subtitle?: string;
  blurb?: string;
  year?: string;
  pages?: number;
  cover?: string;
  pdf: string;
  /** the .tgz the book was built from, offered as a second download */
  code?: string;
}

/** adds a book to the list, or replaces the one with the same pdf */
export function upsertBook(list: BookEntry[], book: BookEntry): BookEntry[] {
  const i = list.findIndex((b) => b.pdf === book.pdf);
  if (i < 0) return [book, ...list];
  // a new pdf means a new cover and page count, so nothing old is kept
  const next = [...list];
  next[i] = book;
  return next;
}

export interface Committed {
  sha: string;
  url: string;
}

/** runs `work` over the items a few at a time and keeps the results in order */
async function inPool<T, R>(items: T[], limit: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await work(items[i]);
    }
  }));
  return out;
}

export async function commitFiles(t: Target, message: string, files: PublishFile[], f: Fetch = fetch): Promise<Committed> {
  const { call, branch } = client(t, f);

  // a blob does not depend on where the branch is, so every file goes up once, a few at a time,
  // and a push race below costs a new commit and not another upload of a 30 MB bundle
  const entries = await inPool(files, 4, async (file) => {
    // a null sha in a tree entry deletes the path
    if (file.content === null) return { path: file.path, mode: "100644", type: "blob", sha: null as string | null };
    const blob = await call<{ sha: string }>("/git/blobs", {
      method: "POST",
      body: JSON.stringify({ content: toBase64(bytesOf(file.content)), encoding: "base64" }),
    });
    return { path: file.path, mode: "100644", type: "blob", sha: blob.sha as string | null };
  });

  for (let attempt = 0; ; attempt++) {
    const ref = await call<{ object: { sha: string } }>(`/git/ref/heads/${branch}`);
    const parent = ref.object.sha;
    const commit = await call<{ tree: { sha: string } }>(`/git/commits/${parent}`);

    const tree = await call<{ sha: string }>("/git/trees", {
      method: "POST",
      body: JSON.stringify({ base_tree: commit.tree.sha, tree: entries }),
    });
    const now = new Date().toISOString();
    const made = await call<{ sha: string; html_url: string }>("/git/commits", {
      method: "POST",
      body: JSON.stringify({
        message,
        tree: tree.sha,
        parents: [parent],
        author: { ...SITE.author, date: now },
        committer: { ...SITE.author, date: now },
      }),
    });
    try {
      await call(`/git/refs/heads/${branch}`, { method: "PATCH", body: JSON.stringify({ sha: made.sha }) });
      return { sha: made.sha, url: made.html_url };
    } catch (err) {
      // someone pushed in between: start again from the new head, once
      if (err instanceof GitHubError && err.status === 422 && attempt === 0) continue;
      throw err;
    }
  }
}

export type Deploy = "success" | "failure" | "unknown";

/** follows the pages workflow for a commit until it finishes */
export async function waitForDeploy(
  t: Target,
  sha: string,
  onStatus: (text: string) => void = () => {},
  f: Fetch = fetch,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<Deploy> {
  const { call } = client(t, f);
  for (let i = 0; i < 60; i++) {
    try {
      const runs = await call<{ workflow_runs: { status: string; conclusion: string | null }[] }>(`/actions/runs?head_sha=${sha}&per_page=5`);
      const run = runs.workflow_runs[0];
      if (run) {
        if (run.status === "completed") return run.conclusion === "success" ? "success" : "failure";
        onStatus(`building (${run.status.replace("_", " ")})`);
      } else onStatus("waiting for the build to start");
    } catch {
      return "unknown";
    }
    await sleep(4000);
  }
  return "unknown";
}
