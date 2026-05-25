"use client";

import { useState, useRef, useEffect } from "react";
import { Play } from "lucide-react";

export default function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
          removeListeners();
        }).catch(err => {
          console.warn("Autoplay blocked, waiting for valid user interaction:", err);
        });
      }
    };

    const handleInteraction = () => {
      playAudio();
    };

    const addListeners = () => {
      document.addEventListener("click", handleInteraction, { passive: true });
      document.addEventListener("mousedown", handleInteraction, { passive: true });
      document.addEventListener("touchstart", handleInteraction, { passive: true });
      document.addEventListener("touchend", handleInteraction, { passive: true });
      document.addEventListener("keydown", handleInteraction, { passive: true });
      document.addEventListener("pointerdown", handleInteraction, { passive: true });
    };

    const removeListeners = () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("mousedown", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("touchend", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("pointerdown", handleInteraction);
    };

    // Attempt to play immediately on mount
    playAudio();

    // Add listeners in case it was blocked
    addListeners();

    return () => {
      removeListeners();
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
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
      
      <style>{`
        @keyframes bounce-bar {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1.0); }
        }
        .visualizer-bar {
          transform-origin: bottom;
          animation: bounce-bar 0.6s ease-in-out infinite alternate;
        }
      `}</style>

      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.08] backdrop-blur-sm flex items-center justify-center text-neutral-500 hover:text-white transition-all duration-300 shadow-2xl cursor-pointer"
        aria-label={isPlaying ? "Pause music" : "Play music"}
      >
        {isPlaying ? (
          <div className="flex items-end gap-[3px] h-3 w-3.5 justify-center">
            <span className="w-[2px] h-full bg-current rounded-full visualizer-bar" style={{ animationDuration: '0.45s', animationDelay: '0.1s' }} />
            <span className="w-[2px] h-full bg-current rounded-full visualizer-bar" style={{ animationDuration: '0.75s', animationDelay: '0.3s' }} />
            <span className="w-[2px] h-full bg-current rounded-full visualizer-bar" style={{ animationDuration: '0.55s', animationDelay: '0.0s' }} />
            <span className="w-[2px] h-full bg-current rounded-full visualizer-bar" style={{ animationDuration: '0.65s', animationDelay: '0.2s' }} />
          </div>
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>
    </div>
  );
}
