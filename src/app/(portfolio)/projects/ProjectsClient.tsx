"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import SceneArt, { CornerDragon } from "@/components/SceneArt";
import type { Repo } from "@/lib/github";

const easing: Easing = [0.25, 0.1, 0.25, 1];
const fade: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easing } },
};

export default function ProjectsClient({ repos }: { repos: Repo[] }) {
  return (
    <motion.main initial="hidden" animate="visible" variants={fade} className="w-full relative">
      <CornerDragon page="projects" />

      <h1 className="relative z-10 text-[26px] sm:text-[30px] font-semibold text-ink tracking-tight leading-none mb-3">
        <ScrambleText text="projects" />
      </h1>

      <p className="relative z-10 text-[15px] text-ink-soft leading-relaxed max-w-[64ch] mb-7">
        mine, so nobody reviewed them. pulled live from github, sorted by stars. the work
        other people had to accept is on{" "}
        <a
          href="/open-source"
          className="text-gold underline decoration-gold/30 underline-offset-4 hover:decoration-gold"
        >
          open source
        </a>
        .
      </p>

      <ul>
        {repos.map((p) => (
          <li key={p.name} className="border-t border-rule">
            <a href={p.url} target="_blank" rel="noreferrer" className="group block py-3.5">
              <div className="sm:flex sm:items-baseline sm:justify-between sm:gap-4 mb-1">
                <h2 className="text-[15px] text-ink font-medium group-hover:text-gold transition-colors">
                  {p.name}
                  {p.state && (
                    <span className="font-mono text-[9.5px] uppercase tracking-wider text-ink-faint border border-rule rounded px-1 py-[1px] ml-2 align-middle">
                      {p.state}
                    </span>
                  )}
                </h2>
                <span className="font-mono text-[11px] text-ink-faint shrink-0 flex items-baseline gap-2.5 mt-1 sm:mt-0">
                  <span>{p.stack.join(" · ")}</span>
                  {p.stars > 0 && <span className="tabular-nums">{p.stars}★</span>}
                </span>
              </div>
              <p className="text-[13.5px] text-ink-soft leading-relaxed max-w-[68ch]">
                {p.description}
              </p>
            </a>
          </li>
        ))}
      </ul>

      <SceneArt className="mt-16" />
    </motion.main>
  );
}
