"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ResumeModal from "./ResumeModal";

const links = [
  { path: "/", label: "home", k: "h" },
  { path: "/open-source", label: "open source", k: "o" },
  { path: "/experience", label: "work", k: "e" },
  { path: "/projects", label: "projects", k: "p" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // the bar only grows a border once you have actually left the top,
  // so it does not sit there as a line over the hero.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      ) {
        return;
      }

      const hit = links.find((l) => l.k === e.key.toLowerCase());
      if (hit) {
        router.push(hit.path);
        return;
      }
      if (e.key.toLowerCase() === "r") setIsResumeOpen((prev) => !prev);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <>
      {/* the refraction field the bar's backdrop-filter samples. turbulence
          makes the noise, the displacement map pushes each backdrop pixel
          sideways by it, so content sliding under the bar bends instead of
          just going soft. zero size, never painted directly. */}
      <svg
        aria-hidden="true"
        focusable="false"
        style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
      >
        <filter id="lg" x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          {/* low frequency, one octave. big smooth blobs read as liquid.
              high frequency noise reads as frosted plastic. */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.0028 0.0055"
            numOctaves={1}
            seed={92}
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="4.5" result="soft" />

          {/* dispersion. real glass bends red, green and blue by different
              amounts, which is why a thick edge fringes with colour. one
              displacement pass cannot do that, so the backdrop goes through
              three at different scales and each keeps only its own channel.
              this is the thing that separates glass from a blur. */}
          <feDisplacementMap
            in="SourceGraphic" in2="soft" scale="230"
            xChannelSelector="R" yChannelSelector="G" result="dispR"
          />
          <feColorMatrix
            in="dispR" type="matrix" result="chanR"
            values="1 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
          />
          <feDisplacementMap
            in="SourceGraphic" in2="soft" scale="185"
            xChannelSelector="R" yChannelSelector="G" result="dispG"
          />
          <feColorMatrix
            in="dispG" type="matrix" result="chanG"
            values="0 0 0 0 0
                    0 1 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
          />
          <feDisplacementMap
            in="SourceGraphic" in2="soft" scale="140"
            xChannelSelector="R" yChannelSelector="G" result="dispB"
          />
          <feColorMatrix
            in="dispB" type="matrix" result="chanB"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 1 0 0
                    0 0 0 1 0"
          />

          {/* screen puts the three channels back together as one image */}
          <feBlend in="chanR" in2="chanG" mode="screen" result="rg" />
          <feBlend in="rg" in2="chanB" mode="screen" />
        </filter>
      </svg>

      {/* sticky at every size. a single glass object rather than loose words
          floating over whatever is scrolling behind them. */}
      <nav
        className={`glass sticky top-2 sm:top-4 z-50 mb-6 sm:mb-12 rounded-2xl border
          transition-[border-color] duration-300
          ${scrolled ? "border-rule-strong" : "border-rule"}`}
      >
        <ul
          className="flex items-center gap-x-0.5 overflow-x-auto no-scrollbar
            px-2 py-2 font-mono text-[13px] sm:text-[14px] tracking-tight"
        >
          {links.map((link) => {
            const isActive = pathname === link.path;
            return (
              <li key={link.path} className="shrink-0">
                <Link
                  href={link.path}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative flex items-baseline gap-1.5 rounded-md px-2 sm:px-2.5 py-1.5
                    transition-colors duration-200
                    ${isActive ? "text-gold" : "text-ink-faint hover:text-ink hover:bg-surface-2/70"}`}
                >
                  <span
                    className={`hidden sm:inline font-normal transition-opacity duration-200
                      ${isActive ? "opacity-70" : "opacity-35 group-hover:opacity-70"}`}
                  >
                    [{link.k}]
                  </span>
                  <span className={isActive ? "font-medium" : ""}>{link.label}</span>
                  <span
                    className={`absolute left-2 right-2 -bottom-[1px] h-[2px] rounded-full bg-gold
                      transition-transform duration-300 origin-left
                      ${isActive ? "scale-x-100" : "scale-x-0"}`}
                  />
                </Link>
              </li>
            );
          })}

          <li className="shrink-0 ml-auto pl-1.5">
            <button
              onClick={() => setIsResumeOpen(true)}
              className="group flex items-baseline gap-1.5 rounded-lg px-2.5 py-1.5
                border border-rule bg-bg/60 text-ink-faint
                hover:text-gold hover:border-gold/40
                transition-colors duration-200 cursor-pointer whitespace-nowrap"
            >
              <span className="hidden sm:inline opacity-35 group-hover:opacity-70 transition-opacity">
                [r]
              </span>
              <span>resume</span>
            </button>
          </li>
        </ul>
      </nav>

      <ResumeModal isOpen={isResumeOpen} onClose={() => setIsResumeOpen(false)} />
    </>
  );
}
