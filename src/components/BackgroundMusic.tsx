"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.35;
      audioRef.current.loop = true;
    }
  }, []);

  const handleInitialize = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }
    // Prevent scrolling while splash is active? We don't need to, it's fixed.
    setIsInitialized(true);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isInitialized && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.5, ease: [0.25, 0.1, 0.25, 1] } }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#080808]"
            onClick={handleInitialize}
          >
            <motion.button 
              whileHover={{ scale: 1.05, letterSpacing: "0.4em" }}
              whileTap={{ scale: 0.95 }}
              className="text-[11px] md:text-[13px] uppercase tracking-[0.3em] font-mono text-neutral-400 hover:text-white transition-all duration-500 flex items-center gap-3 relative isolate"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              [ INITIALIZE ]
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Audio Controls */}
      <div className="fixed bottom-6 right-6 z-[60]">
        <audio ref={audioRef} src="/bg-music.mp3" preload="auto" />
        
        <AnimatePresence>
          {isInitialized && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 1 }}
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.08] transition-all duration-300 shadow-2xl"
              aria-label={isPlaying ? "Pause music" : "Play music"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
