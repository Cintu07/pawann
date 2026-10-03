import type { MetadataRoute } from "next";

export const BASE_URL = "https://pawann.vercel.app";

// /blog redirects to cintu07.github.io for now (next.config.ts), which has
// its own sitemap, so the posts are not listed here.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/open-source`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/experience`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/projects`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
