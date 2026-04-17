"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

export default function ScrambleText({ 
  text, 
  className = "", 
  scrambleDelay = 0 
}: { 
  text: string; 
  className?: string;
  scrambleDelay?: number;
}) {
  const [displayText, setDisplayText] = useState(text);
  const containerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });
  
  useEffect(() => {
    if (!isInView) return;

    let iteration = 0;
    let interval: ReturnType<typeof setInterval>;

    const startScrambling = () => {
      clearInterval(interval);
      interval = setInterval(() => {
        setDisplayText((prev) =>
          prev
            .split("")
            .map((letter, index) => {
              if (index < iteration) {
                return text[index];
              }
              return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
            })
            .join("")
        );

        if (iteration >= text.length) {
          clearInterval(interval);
        }

        iteration += 1 / 3;
      }, 30);
    };

    if (scrambleDelay > 0) {
      setTimeout(startScrambling, scrambleDelay);
    } else {
      startScrambling();
    }

    return () => clearInterval(interval);
  }, [text, isInView, scrambleDelay]);

  return (
    <motion.span 
      ref={containerRef} 
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {displayText}
    </motion.span>
  );
}
