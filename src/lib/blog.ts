import { posts as bundled, type BlogPost } from "@/app/(portfolio)/blog/data";
import { CAPTION_MARK } from "./blog-caption";

// the blog at cintu07.github.io is the source of truth. its build writes
// posts.json, and the sandbox publishes there, so a new post shows up here
// without touching this repo. data.ts only covers the blog being down.
export const POSTS_URL = "https://cintu07.github.io/posts.json";
export const POSTS_TAG = "blog-posts";

type Remote = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  cover: string;
  og?: string;
  minutes: number;
  markdown: string;
};

function pretty(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

function firstImage(markdown: string) {
  return /!\[[^\]]*\]\(([^)\s]+)/.exec(markdown)?.[1];
}

function fromRemote(p: Remote): BlogPost {
  return {
    title: p.title,
    slug: p.slug,
    date: pretty(p.date),
    description: p.description,
    tags: p.tags,
    imageURL: p.cover || firstImage(p.markdown),
    minutes: p.minutes,
    og: p.og,
    content: p.markdown.replace(/^(.+)\n\{: \.code-caption \}$/gm, `${CAPTION_MARK}$1`),
  };
}

export async function getPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(POSTS_URL, { next: { revalidate: 300, tags: [POSTS_TAG] } });
    if (!res.ok) throw new Error(`posts.json ${res.status}`);
    const remote = (await res.json()) as Remote[];
    if (!Array.isArray(remote) || remote.length === 0) throw new Error("posts.json is empty");
    return remote.map(fromRemote);
  } catch (err) {
    console.error("blog: falling back to bundled posts", err);
    return bundled;
  }
}

export async function getPost(slug: string) {
  return (await getPosts()).find((p) => p.slug === slug);
}
