"use client";

// decorative only. nothing here is announced to a screen reader and nothing
// can swallow a click.
//
// every position and size comes from src/data/artPositions.ts. open any page
// with ?tune=1 to drag these around and copy the new numbers back into it.

import { Draggable, useArt } from "./ArtTuner";

/** the dragon. phones only, and not on the home page.
 *  absolutely positioned on purpose: in the flow it was a 130px tall block
 *  shoving every page title down past the fold. */
export function CornerDragon({ page }: { page: "work" | "open-source" | "projects" }) {
  // keyed per page. each page's heading is a different width, so the spot that
  // clears the title on one collides with it on another. one shared "dragon"
  // key meant tuning open-source moved the work page too.
  const key = `dragon-${page}`;
  const { pos } = useArt(key);
  return (
    <Draggable
      artKey={key}
      className="sm:hidden select-none absolute top-0 right-0 z-0"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/art/dragon.webp"
        alt=""
        aria-hidden="true"
        style={{ width: pos.w }}
        className="h-auto"
      />
    </Draggable>
  );
}

/** closes a page out, sitting on the footer rule. */
export default function SceneArt({ className = "" }: { className?: string }) {
  const { pos } = useArt("sprites");
  return (
    <div className={`flex justify-center select-none ${className}`}>
      <Draggable artKey="sprites" className="relative">
        {/* the characters stand in the bottom strip of a 400x300 frame, so the
            box is clipped to a band and the image is pinned to its bottom edge.
            items-end is the part that matters. a centred crop cut their heads
            off, which is what the earlier version was doing. */}
        <div
          style={{ width: pos.w, height: pos.h }}
          className="max-w-full overflow-hidden flex items-end"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/art/duel.gif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="w-full h-auto mix-blend-multiply"
          />
        </div>
      </Draggable>
    </div>
  );
}
