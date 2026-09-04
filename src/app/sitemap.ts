import type { MetadataRoute } from "next";
import { posts } from "./(portfolio)/blog/data";

export const BASE_URL = "https://pawann.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/open-source`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/experience`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/projects`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    // the date strings in data.ts are human written, so guard the parse
    lastModified: Number.isNaN(Date.parse(p.date)) ? now : new Date(p.date),
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  return [...routes, ...postRoutes];
}
