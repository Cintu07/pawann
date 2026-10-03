"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// sha-256 of "pawan-sandbox:" + the pin. the gate keeps strangers out of the
// editor; publishing still needs the github token, which is the real lock.
const PIN_HASH = "6dc36822abbaffed541300267bd39ab3ab96e39d19e8cbd33382ed24942cbb84";
const KEY = "pawan_sandbox_open";

async function hash(pin: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`pawan-sandbox:${pin}`));
  return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function remembered(): boolean {
  try {
    return localStorage.getItem(KEY) === PIN_HASH;
  } catch {
    return false;
  }
}

export default function PinGate({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // the server cannot see localStorage, so the first client render decides
  useEffect(() => {
    if (open === null) queueMicrotask(() => setOpen(remembered()));
  }, [open]);

  useEffect(() => {
    if (open === false) input.current?.focus();
  }, [open]);

  const check = async (value: string) => {
    setPin(value);
    setWrong(false);
    if (value.length < 4) return;
    if ((await hash(value)) === PIN_HASH) {
      try { localStorage.setItem(KEY, PIN_HASH); } catch { /* fine, ask again next time */ }
      setOpen(true);
    } else {
      setWrong(true);
      setTimeout(() => setPin(""), 450);
    }
  };

  if (open === null) return <div className="min-h-screen bg-bg" />;
  if (open) return <>{children}</>;

  return (
    <div className="min-h-screen bg-bg text-ink flex items-center justify-center px-6">
      <form className="w-full max-w-[18rem] text-center" onSubmit={(e) => e.preventDefault()}>
        <h1 className="text-[22px] font-semibold tracking-tight mb-1">sandbox</h1>
        <p className="font-mono text-[12px] text-ink-faint mb-6">enter the pin</p>
        <input
          ref={input}
          value={pin}
          onChange={(e) => check(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          autoComplete="off"
          aria-label="pin"
          className={`w-full text-center tracking-[0.8em] pl-[0.8em] font-mono text-[26px] bg-surface border rounded-lg py-3 focus:outline-none transition-colors ${wrong ? "border-red-700 animate-[shake_0.35s]" : "border-rule-strong focus:border-gold"}`}
        />
        <p className={`font-mono text-[12px] mt-3 h-4 ${wrong ? "text-red-700" : "text-transparent"}`}>wrong pin</p>
      </form>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>
    </div>
  );
}
