import { getContributions } from "@/lib/github";
import OpenSourceClient from "./OpenSourceClient";

// server component. fetches at build and revalidates hourly, so a merge shows
// up here without me editing anything.
export const revalidate = 3600;

export const metadata = {
  title: "open source · pawan",
  description:
    "pull requests and issues across repos outside my own. apache/arrow-rs, tinygrad, helix-db, slatedb, nvidia dynamo.",
};

export default async function OpenSourcePage() {
  const data = await getContributions();

  if (!data.live) {
    return (
      <main className="w-full">
        <h1 className="text-[26px] font-semibold text-ink tracking-tight mb-3">open source</h1>
        <p className="text-[15px] text-ink-soft max-w-[60ch]">
          github is not answering right now, most likely the unauthenticated rate limit.
          everything lives at{" "}
          <a
            href="https://github.com/Cintu07"
            target="_blank"
            rel="noreferrer"
            className="text-gold underline decoration-gold/30 underline-offset-4"
          >
            github.com/Cintu07
          </a>{" "}
          in the meantime.
        </p>
      </main>
    );
  }

  return <OpenSourceClient data={data} />;
}
