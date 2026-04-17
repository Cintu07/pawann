"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

export default function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteracted = useRef(false);
  const userManuallyPaused = useRef(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.35;
      audioRef.current.loop = true;
    }

    const playAudio = () => {
      if (audioRef.current && !userManuallyPaused.current) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.warn("Autoplay still blocked:", err);
        });
      }
    };

    const handleInteraction = () => {
      if (!hasInteracted.current) {
        hasInteracted.current = true;
        playAudio();
      }
    };

    // Attach listeners with passive: true so they don't block scrolling, and only once
    const eventOptions = { once: true, passive: true };
    window.addEventListener("mousedown", handleInteraction, eventOptions);
    window.addEventListener("touchstart", handleInteraction, eventOptions);
    window.addEventListener("scroll", handleInteraction, eventOptions);
    window.addEventListener("keydown", handleInteraction, eventOptions);

    return () => {
      window.removeEventListener("mousedown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    hasInteracted.current = true; // Manual click counts as interaction

    if (isPlaying) {
      audioRef.current.pause();
      userManuallyPaused.current = true;
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        userManuallyPaused.current = false;
        setIsPlaying(true);
      }).catch(console.error);
    }
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
