import { getPosts } from "@/lib/blog";
import Home from "./HomeClient";

// each page names its own canonical; one set in the root layout would be inherited by every page
export const metadata = { alternates: { canonical: "/" } };

export default async function Page() {
  return <Home posts={await getPosts()} />;
}
