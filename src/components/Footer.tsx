"use client";

import { useState, useEffect } from "react";

const links = [
  { label: "github", href: "https://github.com/Cintu07" },
  { label: "x", href: "https://twitter.com/pawankalyandev" },
  { label: "linkedin", href: "https://www.linkedin.com/in/pavankalyan-kolagani/" },
  { label: "email", href: "mailto:pawankalyan1892@gmail.com" },
];

export default function Footer() {
  const [copied, setCopied] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const copyDiscord = () => {
    navigator.clipboard.writeText("1258285819488374857");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="mt-0">
      {/* one line of links. no grid, no labels column, no paragraph. */}
      <div className="flex items-baseline justify-between gap-x-5 gap-y-2 flex-wrap border-t border-rule pt-5">
        <nav className="flex items-baseline gap-x-4 gap-y-1 flex-wrap font-mono text-[13px]">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="text-ink-faint hover:text-gold transition-colors"
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={copyDiscord}
            className="text-ink-faint hover:text-gold transition-colors cursor-pointer"
          >
            {copied ? "copied" : "discord"}
          </button>
        </nav>

        {time && (
          <span className="font-mono text-[12px] text-ink-faint tabular-nums shrink-0">
            {time} ist
          </span>
        )}
      </div>

      {/* the skyline. it lives inside the content column at its own 1600x625
          proportions, so it scales with the text when the page is zoomed and
          the whole drawing shows at every width.

          it used to be a full-bleed w-screen band cropped to a fixed 150px with
          object-cover. two things went wrong with that. at laptop widths the
          image wants ~560px of height, so the band showed about a quarter of it.
          and w-screen tracks the window, not the column, so zooming out shrank
          the text but left the skyline spanning the whole window.

          the negative bottom margin cancels the layout's bottom padding
          (py-4 / sm:py-14) exactly, so it sits flush on the page edge without
          running past it. width and height are set so the lazy load reserves
          the right space and nothing jumps when it arrives.

          the sky is white, so multiply already dissolves the top edge into the
          page. the trees run to the left and right edges though, and without
          the side fade they get sliced off in a hard vertical line at the
          column edge. 6% each side clears both pagodas. */}
      <div aria-hidden="true" className="mt-12 -mb-4 sm:-mb-14 select-none pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/art/footer-skyline.webp"
          alt=""
          width={1600}
          height={625}
          loading="lazy"
          decoding="async"
          className="block w-full h-auto mix-blend-multiply"
          style={{
            maskImage: "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
          }}
        />
      </div>
    </footer>
  );
}
