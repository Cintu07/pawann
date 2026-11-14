import type { NextConfig } from "next";

const BLOG = "https://cintu07.github.io";

const nextConfig: NextConfig = {
  // the writing lives on the blog for now. temporary, so the /blog pages
  // here can come back by deleting these two entries.
  async redirects() {
    return [
      // pawann.dev is the address. the vercel one serves the same pages, and two copies of a page split
      // its ranking, so every request there is sent to the same path on pawann.dev.
      {
        source: "/:path*",
        has: [{ type: "host", value: "pawann.vercel.app" }],
        destination: "https://pawann.dev/:path*",
        permanent: true,
      },
      { source: "/blog", destination: `${BLOG}/`, permanent: false },
      { source: "/blog/:slug", destination: `${BLOG}/posts/:slug/`, permanent: false },
    ];
  },
};

export default nextConfig;
