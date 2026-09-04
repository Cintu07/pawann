"use client";

import { useState, useMemo } from "react";
import { motion, type Variants, type Easing } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import SceneArt, { CornerDragon } from "@/components/SceneArt";
import type { Contributions, Kind, State } from "@/lib/github";

const easing: Easing = [0.25, 0.1, 0.25, 1];
const fade: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easing } },
};

const GLYPH: Record<State, string> = { merged: "✓", open: "○", closed: "✗" };
const GLYPH_COLOR: Record<State, string> = {
  merged: "var(--merged)",
  open: "var(--open)",
  closed: "var(--removed)",
};

type KindFilter = "all" | Kind;
type StateFilter = "all" | State;

function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { v: T; label: string; n?: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`font-mono text-[12.5px] transition-colors cursor-pointer ${
            value === o.v ? "text-ink font-semibold" : "text-ink-faint hover:text-gold"
          }`}
        >
          {o.label}
          {o.n !== undefined && <span className="opacity-55"> {o.n}</span>}
        </button>
      ))}
    </div>
  );
}

export default function OpenSourceClient({ data }: { data: Contributions }) {
  const [kind, setKind] = useState<KindFilter>("all");
  const [state, setState] = useState<StateFilter>("all");

  const groups = useMemo(() => {
    return data.groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) => (kind === "all" || i.kind === kind) && (state === "all" || i.state === state)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [data.groups, kind, state]);

  const shown = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <motion.main initial="hidden" animate="visible" variants={fade} className="w-full relative">
      <CornerDragon page="open-source" />

      <h1 className="relative z-10 text-[26px] sm:text-[30px] font-semibold text-ink tracking-tight leading-none mb-3">
        <ScrambleText text="open source" />
      </h1>

      <p className="relative z-10 text-[15px] text-ink-soft leading-relaxed max-w-[64ch] mb-1.5">
        pull requests and issues across repos outside my own, pulled live from github.
      </p>
      <p className="font-mono text-[12px] text-ink-faint mb-6">
        <span style={{ color: GLYPH_COLOR.merged }}>✓</span> merged/resolved{" · "}
        <span style={{ color: GLYPH_COLOR.open }}>○</span> open{" · "}
        <span style={{ color: GLYPH_COLOR.closed }}>✗</span> closed
      </p>

      <div className="space-y-1.5 mb-8">
        <Tabs
          value={kind}
          onChange={setKind}
          options={[
            { v: "all", label: "all" },
            { v: "pr", label: "pull requests", n: data.counts.prs },
            { v: "issue", label: "issues", n: data.counts.issues },
          ]}
        />
        <Tabs
          value={state}
          onChange={setState}
          options={[
            { v: "all", label: "all" },
            { v: "merged", label: "merged", n: data.counts.merged },
            { v: "open", label: "open", n: data.counts.open },
            { v: "closed", label: "closed", n: data.counts.closed },
          ]}
        />
      </div>

      {shown === 0 && (
        <p className="text-[14px] text-ink-faint font-mono py-8">nothing matches that.</p>
      )}

      <div className="space-y-9">
        {groups.map((g) => (
          <section key={g.repo}>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <a
                href={`https://github.com/${g.repo}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[12.5px] text-ink-faint hover:text-gold transition-colors"
              >
                {g.repo}
              </a>
              {g.stars > 0 && (
                <span className="font-mono text-[11px] text-ink-faint tabular-nums shrink-0">
                  {g.stars.toLocaleString()}★
                </span>
              )}
            </div>

            <ul>
              {g.items.map((i) => (
                <li key={`${i.repo}#${i.num}`} className="border-t border-rule">
                  <a href={i.url} target="_blank" rel="noreferrer" className="group block py-3">
                    {/* on a phone the title owns the full width and the meta
                        drops beneath it. side by side squeezed it to four words
                        a line. */}
                    <div className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="font-mono text-[12px] leading-6 shrink-0 w-3"
                        style={{ color: GLYPH_COLOR[i.state] }}
                      >
                        {GLYPH[i.state]}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="sm:flex sm:items-baseline sm:gap-3">
                          <h3 className="text-[14.5px] leading-6 text-ink group-hover:text-gold transition-colors flex-1">
                            {i.title}
                          </h3>
                          <span className="hidden sm:flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[9.5px] uppercase tracking-wider text-ink-faint border border-rule rounded px-1 py-[1px]">
                              {i.kind === "pr" ? "pr" : "issue"}
                            </span>
                            <span className="font-mono text-[11.5px] text-ink-faint tabular-nums">
                              {i.num}
                            </span>
                          </span>
                        </div>

                        {i.note && (
                          <p className="text-[13.5px] leading-relaxed text-ink-soft mt-1.5 max-w-[66ch]">
                            {i.note}
                          </p>
                        )}

                        <div className="flex sm:hidden items-center gap-2 mt-1.5 font-mono text-[10.5px] text-ink-faint">
                          <span className="uppercase tracking-wider border border-rule rounded px-1 py-[1px]">
                            {i.kind === "pr" ? "pr" : "issue"}
                          </span>
                          <span className="tabular-nums">#{i.num}</span>
                          <span aria-hidden="true">·</span>
                          <span>{i.date}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <SceneArt className="mt-16" />
    </motion.main>
  );
}
