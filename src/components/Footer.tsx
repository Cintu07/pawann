"use client";

import { useState } from "react";

export default function Footer() {
  const [copied, setCopied] = useState(false);

  const copyDiscord = () => {
    navigator.clipboard.writeText("1258285819488374857");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="mt-32 pt-12 border-t border-white/[0.03]">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[17px] font-medium text-white tracking-wide">Find me here ~</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-4">
        <div>
          <h3 className="text-[15px] text-zinc-400 mb-1.5 font-medium">GitHub</h3>
          <a href="https://github.com/Cintu07" target="_blank" rel="noreferrer" className="text-[14px] text-zinc-300 hover:text-white transition-colors underline decoration-dotted underline-offset-4 decoration-zinc-600">@Cintu07</a>
        </div>
        
        <div>
          <h3 className="text-[15px] text-zinc-400 mb-1.5 font-medium">X (formerly Twitter)</h3>
          <a href="https://twitter.com/pawankalyandev" target="_blank" rel="noreferrer" className="text-[14px] text-zinc-300 hover:text-white transition-colors underline decoration-dotted underline-offset-4 decoration-zinc-600">@pawankalyandev</a>
        </div>

        <div>
          <h3 className="text-[15px] text-zinc-400 mb-1.5 font-medium">LinkedIn</h3>
          <a href="https://www.linkedin.com/in/pavankalyan-kolagani/" target="_blank" rel="noreferrer" className="text-[14px] text-zinc-300 hover:text-white transition-colors underline decoration-dotted underline-offset-4 decoration-zinc-600">@pawan</a>
        </div>

        <div>
          <h3 className="text-[15px] text-zinc-400 mb-1.5 font-medium">Email</h3>
          <a href="mailto:kolagani.pavankalyan2003@gmail.com" className="text-[14px] text-zinc-300 hover:text-white transition-colors underline decoration-dotted underline-offset-4 decoration-zinc-600 break-all">@pawan</a>
        </div>

        <div>
          <h3 className="text-[15px] text-zinc-400 mb-1.5 font-medium flex items-center gap-2">
            Discord
            {copied && <span className="text-[10px] text-green-500 font-mono font-normal tracking-tight animate-fade-up">Copied ID!</span>}
          </h3>
          <button onClick={copyDiscord} className="text-[14px] text-zinc-300 hover:text-white transition-colors underline decoration-dotted underline-offset-4 decoration-zinc-600 cursor-pointer text-left">
            @pawan
          </button>
        </div>

        <div>
          <h3 className="text-[15px] text-zinc-400 mb-1.5 font-medium">CV</h3>
          <a href="/pavankalyan.pdf" target="_blank" rel="noreferrer" className="text-[14px] text-zinc-300 hover:text-white transition-colors underline decoration-dotted underline-offset-4 decoration-zinc-600">@pawan</a>
        </div>
      </div>
    </footer>
  );
}
