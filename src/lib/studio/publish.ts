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
  content: string | Uint8Array;
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

function client(t: Target, f: Fetch = fetch) {
  const owner = t.owner ?? SITE.owner;
  const repo = t.repo ?? SITE.repo;
  const branch = t.branch ?? SITE.branch;
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  const call = async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    const res = await f(base + path, {
      ...init,
      headers: {
        Authorization: `Bearer ${t.token}`,
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

export interface Committed {
  sha: string;
  url: string;
}

export async function commitFiles(t: Target, message: string, files: PublishFile[], f: Fetch = fetch): Promise<Committed> {
  const { call, branch } = client(t, f);
  for (let attempt = 0; ; attempt++) {
    const ref = await call<{ object: { sha: string } }>(`/git/ref/heads/${branch}`);
    const parent = ref.object.sha;
    const commit = await call<{ tree: { sha: string } }>(`/git/commits/${parent}`);

    const entries = [];
    for (const file of files) {
      const blob = await call<{ sha: string }>("/git/blobs", {
        method: "POST",
        body: JSON.stringify({ content: toBase64(bytesOf(file.content)), encoding: "base64" }),
      });
      entries.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
    }
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
