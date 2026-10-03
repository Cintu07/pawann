import { getPosts } from "@/lib/blog";
import BlogList from "./BlogList";

export default async function Blog() {
  return <BlogList posts={await getPosts()} />;
}
