"use client";

import { motion, type Variants, type Easing } from "framer-motion";

const experience = [
  {
    company: "Cortex",
    role: "Founding Engineer",
    period: "Dec 2025 - Present",
    description: "Architecting low-latency voice agent infrastructure using ElevenLabs ConvAI and Twilio. Engineered real-time WebSocket pipelines for seamless telephony streaming and custom audio DSP libraries for sub-20ms frame mixing. Developed a multi-tenant dashboard for real-time call monitoring and order management.",
    stack: ["go", "typescript", "webrtc", "twilio", "dsp"]
  },
  {
    company: "Freelance",
    role: "Full Stack Engineer",
    period: "Jan 2025 - Present",
    description: "Architecting and developing production-grade web applications for local businesses under NDA. Designing complex product lifecycles, high-conversion Next.js landing pages, and robust backend integrations.",
    stack: ["next.js", "react", "typescript", "backend", "system-design"]
  },
  {
    company: "DXLander",
    role: "Core Maintainer",
    period: "Oct 2025 - Dec 2025",
    description: "Core contributor to the AI-Powered Zero-Configuration Deployment Platform. Engineered deployment state machines, optimized edge-deployment configuration heuristics, and scaled the platform's core Next.js architecture.",
    stack: ["typescript", "next.js", "docker", "ai"]
  },
  {
    company: "CodexIntern",
    role: "Python Developer Intern",
    period: "Aug 2025 - Oct 2025",
    description: "Built automated data processing pipelines and explored machine learning methodologies. Solved complex matrix optimization challenges and expanded analytical tooling internally.",
    stack: ["python", "machine-learning", "data-analysis", "numpy"]
  }
];

export default function Experience() {
  const customEasing: Easing = [0.25, 0.1, 0.25, 1];
  const fade: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: customEasing } 
    }
  };

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={fade}
    >
      <div className="flex items-center gap-3 mb-10">
        <div className="h-[2px] w-6 bg-gradient-to-r from-neutral-300 to-transparent rounded" />
        <h1 className="text-[20px] font-semibold text-white tracking-wide leading-none">experience</h1>
      </div>
      
      <div className="space-y-10 border-l border-white/[0.08] pl-6 ml-2">
        {experience.map((e) => (
          <div key={e.company} className="relative group">
            <div className="absolute w-2 h-2 rounded-full bg-neutral-400/50 group-hover:bg-neutral-300/90 group-hover:shadow-[0_0_8px_rgba(255,255,255,0.5)] -left-[29px] top-2 transition-all duration-300" />
            
            <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-3">
              <h2 className="text-[19px] text-[#e5e5e5] font-medium tracking-tight">
                {e.company} <span className="text-[#555] font-normal mx-2">/</span> <span className="text-[#aaa]">{e.role}</span>
              </h2>
              <span className="text-[13px] text-[#555] font-mono mt-1 md:mt-0 uppercase tracking-widest">{e.period}</span>
            </div>
            
            <p className="text-[16px] text-zinc-400 leading-relaxed mb-5 max-w-[640px] tracking-tight">
              {e.description}
            </p>
            
            <div className="flex gap-2.5 flex-wrap">
              {e.stack.map(s => (
                <span key={s} className="text-[11px] uppercase tracking-wider text-zinc-500 font-mono px-2 py-1 rounded bg-black/40 border border-white/[0.05]">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.main>
  );
}
