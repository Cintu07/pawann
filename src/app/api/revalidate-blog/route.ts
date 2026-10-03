import { revalidateTag } from "next/cache";
import { POSTS_TAG } from "@/lib/blog";

// the sandbox calls this after a post goes live on cintu07.github.io, so
// pawann.dev refetches posts.json on the next visit instead of waiting out
// the five minute cache. it only drops a cache, so it needs no auth.
export async function POST() {
  revalidateTag(POSTS_TAG, { expire: 0 });
  return Response.json({ revalidated: true });
}
