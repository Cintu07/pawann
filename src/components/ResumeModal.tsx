"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RESUMES } from "@/data/resumes";

export default function ResumeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState(RESUMES[0]);

  // escape closes, and the page behind stops scrolling while it is open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="resume"
        className="fixed inset-0 z-[100] flex items-center justify-center px-3 sm:px-6"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink/45 backdrop-blur-sm cursor-pointer"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 16 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-3xl max-h-[88vh] bg-surface border border-rule-strong rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-rule">
            <div>
              <h2 className="text-[17px] font-medium text-ink tracking-tight">resume</h2>
              <p className="text-[13px] text-ink-soft mt-0.5">
                same record, different things leading. pick whichever role you are hiring for.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-ink-faint hover:text-gold transition-colors shrink-0 mt-1"
              aria-label="close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="px-5 sm:px-6 py-4 border-b border-rule">
            <ul className="grid gap-px bg-rule border border-rule rounded-lg overflow-hidden">
              {RESUMES.map((r) => {
                const active = r.file === picked.file;
                return (
                  <li key={r.file}>
                    <button
                      onClick={() => setPicked(r)}
                      aria-pressed={active}
                      className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                        active ? "bg-surface-2" : "bg-surface hover:bg-surface-2/60"
                      }`}
                    >
                      <span className="flex items-baseline gap-2.5">
                        <span
                          aria-hidden="true"
                          className={`font-mono text-[11px] ${active ? "text-gold" : "text-ink-faint"}`}
                        >
                          {active ? "●" : "○"}
                        </span>
                        <span className="min-w-0">
                          <span
                            className={`block text-[14.5px] font-medium ${
                              active ? "text-gold" : "text-ink"
                            }`}
                          >
                            {r.label}
                          </span>
                          <span className="block text-[12.5px] text-ink-soft leading-snug mt-0.5">
                            {r.blurb}
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="px-5 sm:px-6 py-4 flex flex-wrap items-center gap-3">
            <a
              href={picked.file}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[13px] px-3.5 py-2 rounded-lg border border-gold/40 text-gold hover:bg-surface-2 transition-colors"
            >
              open pdf
            </a>
            <a
              href={picked.file}
              download
              className="font-mono text-[13px] px-3.5 py-2 rounded-lg border border-rule text-ink-faint hover:text-ink hover:border-rule-strong transition-colors"
            >
              download
            </a>
            <a
              href="mailto:pawankalyan1892@gmail.com"
              className="font-mono text-[13px] text-ink-faint hover:text-gold transition-colors ml-auto"
            >
              or just email me →
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
