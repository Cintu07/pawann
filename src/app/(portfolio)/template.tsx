"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ease: [0.25, 0.1, 0.25, 1], duration: 0.6 }}
      className="w-full flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
}
