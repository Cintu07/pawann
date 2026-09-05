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
    period: "nov 2025 - aug 2026",
    lede: "voice agents that pick up the phone for restaurants and clinics.",
    points: [
      "callers kept getting cut off mid sentence, because one turn detection profile was serving both the greeting and the conversation. i split it in two: 0.5 threshold with 450ms of trailing silence once the call is running, a stricter 0.8 with 700ms during the greeting. line noise on pickup stopped counting as speech.",
      "the agent sounded like it was calling from an empty room, which people hear as a robot. built an ambience mixer that blends a restaurant bed into the outbound stream at 20ms mu-law frames with crossfade, level clamped so it never sits on top of the speech.",
      "cut latency on live calls by dropping to smaller speech models, then put it back when word accuracy went with it. the revert is in the log.",
      "started the medical receptionist product from its first commit, and built the clinic one end to end, down to a telnyx sip trunk into elevenlabs with inbound and outbound calls working.",
    ],
    stack: ["node", "typescript", "twilio", "telnyx", "openai realtime", "elevenlabs"],
  },
  {
    company: "onepurplepen",
    href: "https://onepurplepen.com",
    role: "co-founder, building onedb.net",
    period: "jun 2026 - sep 2026",
    lede: "a directory of ui patterns, dev tools and launch pages. two of us.",
    points: [
      "built the directory engine: per item slug pages, an mcp directory, per directory titles and descriptions, icon upload. a new collection could go live without anyone shipping a deploy for it.",
      "search crawlers could read the listings and agents could not. wrote the machine readable surface, llms.txt plus json-ld on every item, so a crawler resolves a listing to structured fields instead of scraping the rendered page.",
    ],
    stack: ["typescript", "next.js", "postgres"],
  },
  {
    company: "dhanam collections",
    href: "https://dhanamcollections.com",
    role: "cto",
    period: "jul 2026 - now",
    lede: "a handloom shop that sells online and takes live card payments. i am the only engineer on it.",
    points: [
      "hosting was climbing on 12.4 million serverless invocations a month, for a shop with 45 products. it was link prefetch: every product tile entering the viewport was server rendering a page nobody opened. dropped prefetch on the dynamic routes and the bill fell 72%, $87 a month to $25.",
      "the image pipeline hit 132% of its quota, so i pre-generated six widths per photo to object storage and moved encoding into the browser, which also got the native image binary out of the serverless bundle.",
      "5 lakh in sales across 200+ orders so far. 32,376 visitors and 299,734 page views in the first week at 12% bounce, function errors under 0.1% and no timeouts through the order spikes.",
    ],
    stack: ["next.js", "postgres", "drizzle", "cloudflare r2", "razorpay"],
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
