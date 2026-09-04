"use client";

import Link from "next/link";
import { motion, type Variants, type Easing } from "framer-motion";
import { SiSpotify } from "react-icons/si";
import useSWR from "swr";
import ScrambleText from "@/components/ScrambleText";
import SceneArt from "@/components/SceneArt";
import { Draggable, useArt } from "@/components/ArtTuner";
import { posts } from "./blog/data";
import { featured } from "@/data/projects";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SectionHead({ label, href, cta }: { label: string; href: string; cta: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 pb-2 border-b border-rule">
      <h2 className="font-mono text-[12.5px] text-ink-faint tracking-wide">{label}</h2>
      <Link
        href={href}
        className="font-mono text-[12px] text-ink-faint hover:text-gold transition-colors shrink-0"
      >
        {cta} →
      </Link>
    </div>
  );
}

function SpotifyWidget() {
  const { data } = useSWR("/api/now-playing", fetcher, { refreshInterval: 10000 });
  if (!data) return null;

  return (
    <a
      href={data.songUrl || "#"}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-2 mt-10 font-mono text-[12px] text-ink-faint hover:text-gold transition-colors max-w-full"
    >
      <SiSpotify className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">
        {data.isPlaying ? "now playing" : "last played"} · {data.title || "nothing"}
      </span>
    </a>
  );
}

function VisitorCount() {
  const { data } = useSWR("/api/visit", fetcher, { revalidateOnFocus: true });
  const visits = data?.visits;
  if (typeof visits !== "number" || visits < 1) return null;
  return (
    <p className="mt-2 font-mono text-[12px] text-ink-faint">
      visitor {visits.toLocaleString()}
    </p>
  );
}

export default function Home() {
  const { pos: pagoda } = useArt("pagoda");
  const easing: Easing = [0.25, 0.1, 0.25, 1];
  const fade: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easing } },
  };

  return (
    <motion.main initial="hidden" animate="visible" variants={fade} className="w-full relative">
      <div className="relative">
        {/* ---------------- bio ---------------- */}
        {/* the pagoda is anchored to this block, not to the page, so it ends
            exactly where the bio ends. no guessed pixel height: inset-y-0 ties
            its bottom edge to the projects rule below. */}
        <div className="relative">
          <Draggable
            artKey="pagoda"
            className="select-none absolute top-0 -bottom-6 right-0 overflow-hidden hidden lg:block"
            style={{ width: pagoda.w }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/art/pagoda.webp"
              alt=""
              aria-hidden="true"
              className="absolute bottom-0 right-0 w-full h-auto opacity-[0.16] mix-blend-multiply"
            />
          </Draggable>

        <header className="flex items-center gap-4 sm:gap-5 mb-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://avatars.githubusercontent.com/u/178455858?v=4"
            alt="Pawan"
            className="w-[68px] h-[68px] sm:w-[78px] sm:h-[78px] rounded-full object-cover ring-1 ring-rule-strong shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-[30px] sm:text-[38px] font-semibold text-ink tracking-tight leading-none mb-1.5">
              <ScrambleText text="pawan" scrambleDelay={1200} />
            </h1>
            <p className="font-mono text-[12px] sm:text-[12.5px] text-ink-faint tracking-wide">
              Cintu07 · rust/c++ · databases &amp; inference
            </p>
          </div>
        </header>

        <div className="space-y-3 text-ink-soft leading-relaxed text-[15.5px] sm:text-[16px] max-w-[62ch]">
          <p>self taught, just out of uni. rust and c++, databases and inference.</p>
          <p>
            27 prs merged into repos i don&apos;t own.{" "}
            <span className="font-mono text-[14px] text-gold">arrow-rs</span>,{" "}
            <span className="font-mono text-[14px] text-gold">tinygrad</span>,{" "}
            <span className="font-mono text-[14px] text-gold">helix-db</span>,{" "}
            <span className="font-mono text-[14px] text-gold">slatedb</span>, nvidia&apos;s{" "}
            <span className="font-mono text-[14px] text-gold">dynamo</span>. i find the
            guard that exists on one code path and is missing on its twin.
          </p>
          <p>
            built <span className="text-ink font-medium">ciot</span>,{" "}
            <span className="text-ink font-medium">strata</span> and{" "}
            <span className="text-ink font-medium">aegis</span>. my laptop is aarch64, so i
            catch what x86-only ci can&apos;t ^^
          </p>
        </div>
        </div>

        {/* ---------------- projects ---------------- */}
        <section className="mt-10">
          <SectionHead label="projects" href="/projects" cta="see all" />
          <ul>
            {featured.map((p) => (
              <li key={p.name} className="border-b border-rule">
                <a href={p.url} target="_blank" rel="noreferrer" className="group block py-3.5">
                  <div className="sm:flex sm:items-baseline sm:justify-between sm:gap-4 mb-1">
                    <h3 className="text-[15px] text-ink font-medium group-hover:text-gold transition-colors">
                      {p.name}
                      <span className="font-mono text-[13px] text-ink-faint font-normal">
                        {" "}
                        // {p.short ?? p.description}
                      </span>
                    </h3>
                    <span className="font-mono text-[11px] text-ink-faint shrink-0 hidden sm:block">
                      {p.stack.join(" · ")}
                    </span>
                  </div>
                  <p className="text-[13.5px] text-ink-soft leading-relaxed max-w-[68ch]">
                    {p.description}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------- writing ---------------- */}
        <section className="mt-11">
          <SectionHead label="writing" href="/blog" cta="see all" />
          <ul>
            {posts.map((p) => (
              <li key={p.slug} className="border-b border-rule">
                <Link
                  href={`/blog/${p.slug}`}
                  className="group block sm:flex sm:items-baseline sm:justify-between sm:gap-4 py-3.5"
                >
                  <span className="block text-[14.5px] text-ink group-hover:text-gold transition-colors leading-snug">
                    {p.title}
                  </span>
                  <span className="block font-mono text-[11px] text-ink-faint shrink-0 mt-1 sm:mt-0">
                    {p.date}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <SpotifyWidget />
        <VisitorCount />

        {/* closes the page out, right above the footer */}
        <SceneArt className="mt-16" />
      </div>
    </motion.main>
  );
}
