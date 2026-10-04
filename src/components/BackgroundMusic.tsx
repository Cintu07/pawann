"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { createMusic, type Mode } from "@/lib/music";

export default function BackgroundMusic() {
  const [mode, setMode] = useState<Mode>("off");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const music = useRef<ReturnType<typeof createMusic> | null>(null);

  // starts with the page. if the browser will not play sound yet it runs muted, and the first touch gives it sound
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const controller = createMusic({ audio, doc: document, onMode: setMode });
    music.current = controller;
    controller.begin();
    return () => controller.destroy();
  }, []);

  const playing = mode !== "off";
  const waiting = mode === "silent";

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <audio ref={audioRef} src="/bg-music.mp3" preload="metadata" />

      <style>{`
        @keyframes bounce-bar {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1.0); }
        }
        .visualizer-bar {
          transform-origin: bottom;
          animation: bounce-bar 0.6s ease-in-out infinite alternate;
        }
      `}</style>

      {waiting && (
        <>
          {/* running, muted: a ring beats round the button and a note says what it is waiting for */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full border border-gold/60 animate-ping" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-rule bg-surface-2/80 px-3 py-1 font-mono text-[11px] text-ink-soft backdrop-blur-sm"
          >
            tap for sound
          </span>
        </>
      )}

      <button
        onClick={() => music.current?.toggle()}
        className="relative w-10 h-10 rounded-full bg-surface-2/70 border border-rule hover:bg-surface-2 backdrop-blur-sm flex items-center justify-center text-ink-faint hover:text-gold transition-all duration-300 shadow-2xl cursor-pointer"
        aria-label={waiting ? "turn the sound on" : playing ? "Pause music" : "Play music"}
      >
        {playing ? (
          <div className="flex items-end gap-[3px] h-3 w-3.5 justify-center">
            <span className="w-[2px] h-full bg-current rounded-full visualizer-bar" style={{ animationDuration: '0.45s', animationDelay: '0.1s' }} />
            <span className="w-[2px] h-full bg-current rounded-full visualizer-bar" style={{ animationDuration: '0.75s', animationDelay: '0.3s' }} />
            <span className="w-[2px] h-full bg-current rounded-full visualizer-bar" style={{ animationDuration: '0.55s', animationDelay: '0.0s' }} />
            <span className="w-[2px] h-full bg-current rounded-full visualizer-bar" style={{ animationDuration: '0.65s', animationDelay: '0.2s' }} />
          </div>
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>
    </div>
  );
}
