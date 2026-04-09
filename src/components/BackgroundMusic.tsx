"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

export default function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.35;
      audioRef.current.loop = true;
    }

    // Attempt to play on the first user interaction anywhere in the window
    const handleFirstInteraction = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.warn("Autoplay blocked, waiting for more interaction:", err);
        });
      }
      window.removeEventListener("mousedown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("scroll", handleFirstInteraction);
    };

    window.addEventListener("mousedown", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction);
    window.addEventListener("scroll", handleFirstInteraction);

    return () => {
      window.removeEventListener("mousedown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("scroll", handleFirstInteraction);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <audio ref={audioRef} src="/bg-music.mp3" preload="auto" />
      
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.08] transition-all duration-300 shadow-2xl"
        aria-label={isPlaying ? "Pause music" : "Play music"}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>
    </div>
  );
}
