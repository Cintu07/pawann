import type { NextConfig } from "next";

const BLOG = "https://cintu07.github.io";

const nextConfig: NextConfig = {
  // the writing lives on the blog for now. temporary, so the /blog pages
  // here can come back by deleting these two entries.
  async redirects() {
    return [
      { source: "/blog", destination: `${BLOG}/`, permanent: false },
      { source: "/blog/:slug", destination: `${BLOG}/posts/:slug/`, permanent: false },
    ];
  },
};

export default nextConfig;
