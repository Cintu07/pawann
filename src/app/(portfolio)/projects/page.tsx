import { getRepos } from "@/lib/github";
import ProjectsClient from "./ProjectsClient";

// fetched at build, revalidated hourly. push a new repo and it appears here.
export const revalidate = 3600;

export const metadata = {
  title: "projects · pawan",
  description: "things i built. ternary cpu inference, moe offload, a postgres wire proxy.",
};

export default async function ProjectsPage() {
  const { repos, live } = await getRepos();

  if (!live) {
    return (
      <main className="w-full">
        <h1 className="text-[26px] font-semibold text-ink tracking-tight mb-3">projects</h1>
        <p className="text-[15px] text-ink-soft max-w-[60ch]">
          github is not answering right now, most likely the unauthenticated rate limit.
          everything is at{" "}
          <a
            href="https://github.com/Cintu07?tab=repositories"
            target="_blank"
            rel="noreferrer"
            className="text-gold underline decoration-gold/30 underline-offset-4"
          >
            github.com/Cintu07
          </a>
          .
        </p>
      </main>
    );
  }

  return <ProjectsClient repos={repos} />;
}
