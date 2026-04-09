"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
      audioRef.current.loop = true;
    }
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Playback failed:", err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed bottom-8 left-8 z-50 flex items-center gap-3">
      <audio ref={audioRef} src="/bg-music.mp3" preload="auto" />
      
      <motion.button
        onClick={togglePlay}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.05] backdrop-blur-md text-[#888] hover:text-white transition-all hover:bg-white/[0.08] group"
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
            <AnimatePresence mode="wait">
            {isPlaying ? (
                <motion.div
                key="pause"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                >
                <Pause className="w-3.5 h-3.5" />
                </motion.div>
            ) : (
                <motion.div
                key="play"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                >
                <Play className="w-3.5 h-3.5 fill-current" />
                </motion.div>
            )}
            </AnimatePresence>
        </div>
        
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]">
          {isPlaying ? "On Loop" : "Sound Experience"}
        </span>

        {isPlaying && (
            <div className="flex items-end gap-[2px] h-3 ml-1">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ height: ["20%", "100%", "40%", "80%", "20%"] }}
                        transition={{ 
                            duration: 1.2, 
                            repeat: Infinity, 
                            ease: "easeInOut",
                            delay: i * 0.2
                        }}
                        className="w-[2px] bg-white/40 rounded-full"
                    />
                ))}
            </div>
        )}
      </motion.button>

      {isPlaying && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={toggleMute}
            className="p-2 rounded-full bg-white/[0.03] border border-white/[0.05] backdrop-blur-md text-[#888] hover:text-white transition-all"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </motion.button>
      )}
    </div>
  );
}
