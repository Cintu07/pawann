import { getPosts } from "@/lib/blog";
import Home from "./HomeClient";

export default async function Page() {
  return <Home posts={await getPosts()} />;
}
