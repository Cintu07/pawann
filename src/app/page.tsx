"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import { SiSpotify } from "react-icons/si";
import useSWR from "swr";
import ScrambleText from "@/components/ScrambleText";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SpotifyWidget() {
  const { data } = useSWR('/api/now-playing', fetcher, { refreshInterval: 10000 });

  if (!data) return null;

  // Fallback to a placeholder if nothing is playing, or show what is actually playing
  const isPlaying = data.isPlaying;
  const title = data.title || "Not Playing Anything";
  const artist = data.artist || "Spotify";
  const songUrl = data.songUrl || "#";
  const imageURL = data.albumImageUrl;

  return (
    <div className="group relative rounded-xl bg-gradient-to-r from-zinc-500 to-stone-500 p-[1px] shadow-2xl hover:scale-[102%] transition-all duration-300 w-full max-w-[620px] mt-10">
      <div className="flex justify-between items-center h-full bg-[#111] p-4 rounded-[11px] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="flex flex-col justify-between h-full gap-3 relative z-10">
          <p className={`flex items-center gap-2 m-0 text-xs font-mono tracking-wide ${isPlaying ? 'text-[#1DB954]' : 'text-neutral-500'}`}>
            <SiSpotify className="w-4 h-4" />
            {isPlaying ? "NOW PLAYING" : "LAST PLAYED"}
          </p>
          
          <div className="flex flex-col gap-0.5">
            <a
              className="text-neutral-200 hover:text-white font-medium truncate max-w-[220px] transition-colors"
              href={songUrl}
              target="_blank"
              rel="noreferrer"
            >
              {title}
            </a>
            <p className="text-neutral-500 text-sm m-0 truncate max-w-[220px]">
              {artist}
            </p>
          </div>
        </div>

        <div className="h-16 w-16 relative z-10 shrink-0">
          {imageURL ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className="rounded-md object-cover shadow-lg w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500"
              src={imageURL}
              alt={title}
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 rounded-md flex items-center justify-center shadow-lg">
              <SiSpotify className="w-6 h-6 text-zinc-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VisitorCount() {
  const { data } = useSWR('/api/visit', fetcher, { 
    revalidateOnFocus: true, 
    revalidateOnReconnect: true,
    refreshInterval: 0 
  });

  return (
    <div className="mt-8 text-[13px] font-mono text-zinc-500 tracking-wide flex items-center gap-2">
      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse opacity-60" />
      you're the {data?.visits ? data.visits.toLocaleString() : "..."}th visitor
    </div>
  );
}

export default function Home() {
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
      className="max-w-[700px] mx-auto w-full"
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-8 mb-12 text-center sm:text-left">
        <div className="relative isolate">
          <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] pointer-events-none opacity-60" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="none" stroke="#52525b" strokeWidth="0.5" strokeDasharray="8 12" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="20s" repeatCount="indefinite" />
            </circle>
            <circle cx="50" cy="50" r="44" fill="none" stroke="#a1a1aa" strokeWidth="0.5" strokeDasharray="60 140" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="12s" repeatCount="indefinite" />
            </circle>
          </svg>
          
          <img
            src="https://avatars.githubusercontent.com/u/178455858?v=4"
            alt="Pawan"
            className="w-[80px] h-[80px] sm:w-[90px] sm:h-[90px] rounded-full grayscale hover:grayscale-0 transition-all duration-700 object-cover relative z-10 shadow-2xl ring-1 ring-white/10"
          />
        </div>

        <div className="flex flex-col justify-center gap-1.5 sm:gap-2.5">
          <h1 className="text-[32px] sm:text-[40px] font-semibold bg-clip-text text-transparent bg-gradient-to-br from-white to-neutral-400 tracking-tight leading-none">
            <ScrambleText text="Pawan" scrambleDelay={1200} />
          </h1>
          <div className="text-[13px] sm:text-sm font-mono text-neutral-400 tracking-wide mt-1">
            founding engineer
          </div>
        </div>
      </div>

      <div className="space-y-6 text-[#999] leading-relaxed text-[17px] max-w-[620px]">
        <p>
          Hey, I am a founding engineer focused on building robust backend infrastructure and highly intuitive interfaces. Right now, I am spending my time engineering next-generation voice agents.
        </p>
        <p>
          I love keeping things simple, writing code that actually makes sense, and building systems that don't break. I spend most of my time working heavily with <span className="font-mono text-[14px]">Go</span>, <span className="font-mono text-[14px]">Rust</span>, <span className="font-mono text-[14px]">TypeScript</span>, and <span className="font-mono text-[14px]">C++</span>.
        </p>
      </div>

      <SpotifyWidget />
      <VisitorCount />
    </motion.main>
  );
}
