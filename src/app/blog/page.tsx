"use client";

import { motion, type Variants, type Easing } from "framer-motion";

export default function Blog() {
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
        <h1 className="text-[20px] font-semibold text-white tracking-wide">blog</h1>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 backdrop-blur-sm">
        <p className="text-[#888] text-[16px] leading-relaxed">
          No posts yet. I will write about systems and engineering soon.
        </p>
      </div>
    </motion.main>
  );
}
