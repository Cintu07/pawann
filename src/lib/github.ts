// live github data. everything on the open source and projects pages is
// fetched from the api at build and revalidated hourly, so a merge shows up
// on the site without me touching the repo.
//
// unauthenticated search is 10 req/min per ip. with revalidate at an hour
// that is nowhere near it. set GITHUB_TOKEN in the env and it lifts to 30.

import { notes, projectCopy } from "@/data/notes";

const USER = "Cintu07";
const REVALIDATE = 3600;

function headers(): HeadersInit {
  const h: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) (h as Record<string, string>).Authorization = `Bearer ${token}`;
  return h;
}

async function gh<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: headers(), next: { revalidate: REVALIDATE } });
    if (!res.ok) {
      console.warn(`github ${res.status} on ${url}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.warn("github fetch failed", e);
    return null;
  }
}

export type Kind = "pr" | "issue";
export type State = "merged" | "open" | "closed";

export type Contribution = {
  repo: string;
  num: number;
  title: string;
  url: string;
  kind: Kind;
  state: State;
  date: string;
  /** my own note about what the bug actually was, if i wrote one */
  note?: string;
};

export type RepoGroup = {
  repo: string;
  stars: number;
  items: Contribution[];
};

type SearchItem = {
  number: number;
  title: string;
  html_url: string;
  state: string;
  created_at: string;
  repository_url: string;
  pull_request?: { merged_at: string | null };
};

export type Contributions = {
  groups: RepoGroup[];
  counts: { merged: number; open: number; closed: number; prs: number; issues: number; repos: number };
  live: boolean;
};

export async function getContributions(): Promise<Contributions> {
  const data = await gh<{ items: SearchItem[] }>(
    `https://api.github.com/search/issues?q=author:${USER}&per_page=100&sort=created&order=desc`
  );

  if (!data?.items?.length) {
    return { groups: [], counts: { merged: 0, open: 0, closed: 0, prs: 0, issues: 0, repos: 0 }, live: false };
  }

  const items: Contribution[] = data.items
    .map((i) => {
      const repo = i.repository_url.replace("https://api.github.com/repos/", "");
      const kind: Kind = i.pull_request ? "pr" : "issue";
      const merged = Boolean(i.pull_request?.merged_at);
      const state: State =
        i.state === "open" ? "open" : merged || kind === "issue" ? "merged" : "closed";
      return {
        repo,
        num: i.number,
        title: i.title,
        url: i.html_url,
        kind,
        state,
        date: i.created_at.slice(0, 10),
        note: notes[`${repo}#${i.number}`],
      };
    })
    // my own repos are not contributions
    .filter((i) => !i.repo.startsWith(`${USER}/`));

  // stars per repo, so the strongest names sort to the top
  const repoNames = [...new Set(items.map((i) => i.repo))];
  const starEntries = await Promise.all(
    repoNames.map(async (r) => {
      const meta = await gh<{ stargazers_count: number }>(`https://api.github.com/repos/${r}`);
      return [r, meta?.stargazers_count ?? 0] as const;
    })
  );
  const stars = Object.fromEntries(starEntries);

  const groups: RepoGroup[] = repoNames
    .map((repo) => ({
      repo,
      stars: stars[repo] ?? 0,
      items: items
        .filter((i) => i.repo === repo)
        .sort((a, b) => {
          // merged first, then open, then closed. newest inside each band.
          const rank = { merged: 0, open: 1, closed: 2 };
          if (rank[a.state] !== rank[b.state]) return rank[a.state] - rank[b.state];
          return b.date.localeCompare(a.date);
        }),
    }))
    .sort((a, b) => b.stars - a.stars);

  return {
    groups,
    counts: {
      merged: items.filter((i) => i.state === "merged" && i.kind === "pr").length,
      open: items.filter((i) => i.state === "open").length,
      closed: items.filter((i) => i.state === "closed").length,
      prs: items.filter((i) => i.kind === "pr").length,
      issues: items.filter((i) => i.kind === "issue").length,
      repos: groups.length,
    },
    live: true,
  };
}

export type Repo = {
  name: string;
  description: string;
  url: string;
  stars: number;
  language: string | null;
  pushedAt: string;
  stack: string[];
  state?: "wip";
};

type ApiRepo = {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
  topics?: string[];
};

// repos that are coursework, throwaways or config. they exist, they are just
// not what i want someone judging the work by.
const HIDE = new Set([
  "Cintu07", "pawann", "docs", "test", "dsa-nc", "playto-pay", "pawandsa",
  "pawanaptitude", "paresume", "motorhead", "shylinote", "nakamoto",
  "CODEXINTERN-Python-Development", "gobblecube-crossing-submission",
  "cyber-fraud-detection", "siteofiglegais", "cortexx", "commitcraft-landing",
  "crisislink", "t3code", "bifrost", "atlas", "front-end", "jester",
  "cozmo", "dsa-nc", "ciot-old", "vabhaa", "playto-pay",
]);

export async function getRepos(): Promise<{ repos: Repo[]; live: boolean }> {
  const owned = await gh<ApiRepo[]>(
    `https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`
  );
  const org = await gh<ApiRepo[]>(`https://api.github.com/orgs/phimemory/repos?per_page=100`);

  const all = [...(owned ?? []), ...(org ?? [])];
  if (!all.length) return { repos: [], live: false };

  const repos: Repo[] = all
    .filter((r) => !r.fork && !r.archived && !HIDE.has(r.name))
    .map((r) => {
      const copy = projectCopy[r.name];
      return {
        name: r.name,
        description: copy?.description ?? r.description ?? "",
        url: r.html_url,
        stars: r.stargazers_count,
        language: r.language,
        pushedAt: r.pushed_at.slice(0, 10),
        stack: copy?.stack ?? [r.language?.toLowerCase() ?? "code"],
        state: copy?.state,
      };
    })
    .filter((r) => r.description.length > 0)
    .sort((a, b) => b.stars - a.stars || b.pushedAt.localeCompare(a.pushedAt));

  return { repos, live: true };
}
