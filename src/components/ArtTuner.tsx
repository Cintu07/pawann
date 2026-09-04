"use client";

// drag-to-place mode for the decorative art.
//
// add ?tune=1 to any url. every piece of art becomes draggable, the scroll
// wheel resizes it, and a panel in the corner shows live numbers plus a
// "copy values" button that produces the exact object to paste into
// src/data/artPositions.ts.
//
// without the query param this file renders nothing and adds no listeners,
// so it costs a visitor a few bytes of js and nothing else.

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { ART, DEFAULT_POS, type ArtKey, type ArtPos } from "@/data/artPositions";

const STORAGE_KEY = "art-tune-v1";

type Overrides = Partial<Record<ArtKey, Partial<Record<"mobile" | "desktop", ArtPos>>>>;

type Ctx = {
  tuning: boolean;
  get: (k: ArtKey) => ArtPos;
  set: (k: ArtKey, p: ArtPos) => void;
  register: (k: ArtKey) => void;
  bp: "mobile" | "desktop";
};

const TunerCtx = createContext<Ctx>({
  tuning: false,
  get: (k) => ART[k]?.desktop ?? DEFAULT_POS,
  set: () => {},
  register: () => {},
  bp: "desktop",
});

export function useArt(key: ArtKey) {
  const { tuning, get, set, register, bp } = useContext(TunerCtx);
  useEffect(() => register(key), [key, register]);
  return { tuning, pos: get(key), set: (p: ArtPos) => set(key, p), bp };
}

export function ArtTunerProvider({ children }: { children: React.ReactNode }) {
  const [tuning, setTuning] = useState(false);
  const [bp, setBp] = useState<"mobile" | "desktop">("desktop");
  const [overrides, setOverrides] = useState<Overrides>({});
  const [present, setPresent] = useState<ArtKey[]>([]);

  const register = useCallback((k: ArtKey) => {
    setPresent((prev) => (prev.includes(k) ? prev : [...prev, k]));
  }, []);

  useEffect(() => {
    setTuning(new URLSearchParams(window.location.search).get("tune") === "1");

    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => setBp(mq.matches ? "desktop" : "mobile");
    sync();
    mq.addEventListener("change", sync);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOverrides(JSON.parse(raw));
    } catch {
      // private window, or the shape changed. defaults are fine.
    }
    return () => mq.removeEventListener("change", sync);
  }, []);

  const get = useCallback(
    (k: ArtKey): ArtPos => overrides[k]?.[bp] ?? ART[k]?.[bp] ?? DEFAULT_POS,
    [overrides, bp]
  );

  const set = useCallback(
    (k: ArtKey, p: ArtPos) => {
      setOverrides((prev) => {
        const next = { ...prev, [k]: { ...prev[k], [bp]: p } };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [bp]
  );

  return (
    <TunerCtx.Provider value={{ tuning, get, set, register, bp }}>
      {children}
      {tuning && <TunerPanel overrides={overrides} bp={bp} present={present} onReset={() => {
        setOverrides({});
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
      }} />}
    </TunerCtx.Provider>
  );
}

function TunerPanel({
  overrides,
  bp,
  present,
  onReset,
}: {
  overrides: Overrides;
  bp: "mobile" | "desktop";
  present: ArtKey[];
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  // merge the shipped defaults with whatever has been dragged, so the output
  // is always a complete object ready to paste over artPositions.ts
  const merged = present.reduce((acc, k) => {
    acc[k] = {
      mobile: overrides[k]?.mobile ?? ART[k]?.mobile ?? DEFAULT_POS,
      desktop: overrides[k]?.desktop ?? ART[k]?.desktop ?? DEFAULT_POS,
    };
    return acc;
  }, {} as Record<ArtKey, { mobile: ArtPos; desktop: ArtPos }>);

  // only this page's keys, so pasting cannot wipe another page's numbers
  const output = present
    .map((k) => `  "${k}": ${JSON.stringify(merged[k])},`)
    .join("\n");

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed bottom-3 right-3 z-[999] w-[290px] rounded-lg border border-black/20 bg-white/95 shadow-xl p-3 font-mono text-[11px] text-black">
      <div className="flex items-center justify-between mb-2">
        <strong className="text-[12px]">art tuner</strong>
        <span className="opacity-60">{bp}</span>
      </div>

      <p className="opacity-70 leading-relaxed mb-2">
        drag any art to move it. scroll on it to resize. values save as you go.
      </p>

      <div className="max-h-[160px] overflow-auto border border-black/10 rounded p-1.5 mb-2 bg-black/[0.03]">
        {present.map((k) => {
          const p = merged[k][bp];
          const touched = Boolean(overrides[k]?.[bp]);
          return (
            <div key={k} className={touched ? "text-green-700" : "opacity-60"}>
              {k}: x{p.x} y{p.y} w{p.w}
              {p.h !== undefined ? ` h${p.h}` : ""}
            </div>
          );
        })}
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={copy}
          className="flex-1 rounded border border-black/25 px-2 py-1.5 hover:bg-black/5 cursor-pointer"
        >
          {copied ? "copied ✓" : "copy values"}
        </button>
        <button
          onClick={onReset}
          className="rounded border border-black/25 px-2 py-1.5 hover:bg-black/5 cursor-pointer"
        >
          reset
        </button>
      </div>

      <p className="opacity-55 mt-2 leading-snug">
        paste the copied lines into ART in src/data/artPositions.ts, replacing only these keys
      </p>
    </div>
  );
}

/** wraps a piece of art and makes it draggable while ?tune=1 is on. */
export function Draggable({
  artKey,
  children,
  className = "",
  style,
}: {
  artKey: ArtKey;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { tuning, pos, set } = useArt(artKey);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    if (!tuning) return;
    const el = ref.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      drag.current = { x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y };
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!drag.current) return;
      set({
        ...pos,
        x: Math.round(drag.current.ox + (e.clientX - drag.current.x)),
        y: Math.round(drag.current.oy + (e.clientY - drag.current.y)),
      });
    };
    const onUp = () => {
      drag.current = null;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // shift resizes the band height, plain wheel resizes the width
      if (e.shiftKey && pos.h !== undefined) {
        set({ ...pos, h: Math.max(20, pos.h - Math.sign(e.deltaY) * 6) });
      } else {
        set({ ...pos, w: Math.max(24, pos.w - Math.sign(e.deltaY) * 8) });
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [tuning, pos, set]);

  return (
    <div
      ref={ref}
      className={`${className} ${tuning ? "outline outline-2 outline-dashed outline-red-500/70 cursor-move" : ""}`}
      style={{
        ...style,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        pointerEvents: tuning ? "auto" : "none",
        // headings carry relative z-10 and were swallowing the drag on the
        // projects page. while tuning the art wins, in production it does not.
        zIndex: tuning ? 998 : undefined,
        touchAction: tuning ? "none" : undefined,
      }}
    >
      {tuning && (
        <span className="absolute -top-5 left-0 z-[999] bg-red-600 text-white text-[10px] font-mono px-1 rounded whitespace-nowrap">
          {artKey} x{pos.x} y{pos.y} w{pos.w}
          {pos.h !== undefined ? ` h${pos.h}` : ""}
        </span>
      )}
      {children}
    </div>
  );
}
