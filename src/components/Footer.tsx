"use client";

import { useState, useEffect } from "react";
import { useArt } from "./ArtTuner";

const links = [
  { label: "github", href: "https://github.com/Cintu07" },
  { label: "x", href: "https://twitter.com/pawankalyandev" },
  { label: "linkedin", href: "https://www.linkedin.com/in/pavankalyan-kolagani/" },
  { label: "email", href: "mailto:pawankalyan1892@gmail.com" },
];

export default function Footer() {
  const { pos: sky } = useArt("skyline");
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

      {/* the skyline, back where it was. it bleeds to the window edges on every
          size now, phones included. overflow-hidden matters: the image is
          taller than this box at full width and without clipping it climbs up
          over the links. */}
      <div
        aria-hidden="true"
        className="relative left-1/2 -translate-x-1/2 w-screen
                   mt-12 -mb-10 sm:-mb-20 select-none pointer-events-none
                   overflow-hidden"
        style={{ height: sky.h }}
      >
        {/* object-cover at a fixed band height, anchored just above centre.
            sized by width alone it was 750px tall at desktop, so the band only
            ever showed the bottom strip of trees and none of the skyline. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/art/footer-skyline.webp"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-[center_38%] mix-blend-multiply"
        />
      </div>
    </footer>
  );
}
