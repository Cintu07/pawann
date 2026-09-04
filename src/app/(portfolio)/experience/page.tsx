"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import SceneArt, { CornerDragon } from "@/components/SceneArt";

// rule for this file: if i cannot open a commit, a pr, or an analytics
// dashboard for a line, the line does not go in.

type Job = {
  company: string;
  href?: string;
  role: string;
  period: string;
  lede: string;
  points: string[];
  stack: string[];
};

const experience: Job[] = [
  {
    company: "cortex technology",
    href: "https://cor-tex.solutions/",
    role: "founding engineer",
    period: "nov 2025 - jun 2026",
    lede:
      "voice agents that answer the phone for restaurants and clinics.",
    points: [
      "tuned the vad: threshold, prefix padding, silence duration. gave the greeting its own stricter profile so line noise on pickup could not cut the agent off.",
      "mixed an ambient restaurant bed into the outbound stream at 20ms mu-law frames, with crossfade.",
      "swapped to faster models when the voice lagged, reverted when accuracy dropped. the revert is in the log.",
      "18 commits in the production backend, with merge rights. prs #1, #2 and #4 are merged by me.",
      "started the receptionist product from its first commit. built the clinic one end to end, down to a telnyx sip trunk into elevenlabs.",
    ],
    stack: ["node", "typescript", "twilio", "telnyx", "openai realtime", "elevenlabs"],
  },
  {
    company: "onepurplepen",
    href: "https://onepurplepen.com",
    role: "co-founder",
    period: "jun 2026 - now",
    lede: "43 of onedb's 105 commits are mine. two of us built it.",
    points: [
      "directory product, per item slug pages, an mcp directory.",
      "wrote the llms.txt and json-ld surface so agents can read the listings, not just google.",
    ],
    stack: ["typescript", "next.js", "seo"],
  },
  {
    company: "dxlander",
    href: "https://github.com/dxlander/dxlander",
    role: "outside contributor",
    period: "oct 2025 - feb 2026",
    lede: "zero config deployment platform. 7 of 8 pull requests merged.",
    points: [
      "gitlab and bitbucket import. +1196/-486 across 29 files, 13 rounds of review.",
      "rebuilt the setup wizard as a stepper flow, +945/-466.",
      "added postgres next to the existing sqlite, and the e2e suite the repo had none of.",
    ],
    stack: ["typescript", "next.js", "postgres", "playwright"],
  },
  {
    company: "codexintern",
    role: "python intern",
    period: "aug 2025 - oct 2025",
    lede: "first paid thing i did.",
    points: [],
    stack: ["python", "numpy"],
  },
];

export default function Experience() {
  const easing: Easing = [0.25, 0.1, 0.25, 1];
  const fade: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easing } },
  };

  return (
    <motion.main initial="hidden" animate="visible" variants={fade} className="relative">
      <CornerDragon page="work" />

      <div className="relative z-10 flex items-center gap-3 mb-4">
        <div className="rule-gold" />
        <h1 className="text-[20px] font-semibold text-ink tracking-tight leading-none">
          <ScrambleText text="work" />
        </h1>
      </div>

      <p className="text-[15.5px] leading-relaxed text-ink-soft max-w-[60ch] mb-8">
        everything here has a commit or a dashboard behind it.
      </p>

      <div className="space-y-4">
        {experience.map((e) => (
          <article key={e.company} className="card card-hover p-5 sm:p-6">
            <header className="mb-3">
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                <h2 className="text-[18px] font-medium tracking-tight">
                  {e.href ? (
                    <a
                      href={e.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gold underline decoration-gold/25 underline-offset-4 hover:decoration-gold"
                    >
                      {e.company}
                    </a>
                  ) : (
                    <span className="text-gold">{e.company}</span>
                  )}
                </h2>
                <span className="text-[11.5px] text-ink-faint font-mono tracking-wide shrink-0">
                  {e.period}
                </span>
              </div>
              <p className="text-[13.5px] text-ink-faint font-mono">{e.role}</p>
            </header>

            <p className="text-[15.5px] text-ink-soft leading-relaxed mb-4 max-w-[62ch]">
              {e.lede}
            </p>

            {e.points.length > 0 && (
              <ul className="space-y-2.5 mb-5 max-w-[62ch]">
                {e.points.map((p, i) => (
                  <li
                    key={i}
                    className="text-[14.5px] text-ink-soft leading-relaxed flex gap-3"
                  >
                    <span className="text-gold/50 shrink-0 mt-[3px] font-mono text-[10.5px] tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-1.5 flex-wrap">
              {e.stack.map((s) => (
                <span
                  key={s}
                  className="text-[10px] uppercase tracking-wider text-ink-faint font-mono px-2 py-[3px] rounded bg-surface-2/80 border border-rule"
                >
                  {s}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      {/* this page runs short, so there was a dead band between the last card
          and the footer. */}
      <SceneArt className="mt-16" />
    </motion.main>
  );
}
