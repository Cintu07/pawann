// Starts a song when a page opens. A browser will not play sound before the visitor has touched the page, and
// nothing a page can do changes that. What a page can do is start the song muted, which is always allowed, so it
// is already running, and give it sound on the first thing the visitor does that a browser counts as a touch.
// A visitor who pauses it is not played at again.

export type Mode = "off" | "on" | "silent"; // silent: running, muted, until the first touch

interface AudioLike {
  paused: boolean;
  muted: boolean;
  volume: number;
  loop: boolean;
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: string, fn: () => void): void;
  removeEventListener(type: string, fn: () => void): void;
}

interface DocLike {
  addEventListener(type: string, fn: () => void, options?: { passive: boolean }): void;
  removeEventListener(type: string, fn: () => void): void;
}

// the inputs a browser lets unlock sound. a scroll or a hover is not one of them, and neither is the start
// of a touch, which is why touchstart is left out: only its end counts.
export const TOUCHES = ["pointerdown", "mousedown", "touchend", "keydown", "click"];

export function createMusic({ audio, doc, onMode, volume = 0.35 }: { audio: AudioLike; doc: DocLike; onMode: (mode: Mode) => void; volume?: number }) {
  let mode: Mode = "off";
  let paused = false; // a visitor pressed pause, so nothing starts it again

  const set = (next: Mode) => {
    mode = next;
    onMode(next);
  };
  const arm = () => TOUCHES.forEach((type) => doc.addEventListener(type, touched, { passive: true }));
  const disarm = () => TOUCHES.forEach((type) => doc.removeEventListener(type, touched));

  function start() {
    audio.muted = false;
    audio.play().then(
      () => {
        set("on");
        disarm();
      },
      () => {
        // no sound until the page is touched. a muted song is allowed, so run it that way and wait for the touch
        audio.muted = true;
        audio.play().then(() => set("silent"), () => {});
      },
    );
  }

  function giveSound() {
    audio.muted = false;
    if (audio.paused) {
      start();
      return;
    }
    set("on");
    disarm();
  }

  function touched() {
    if (paused) return;
    if (mode === "silent") giveSound();
    else if (mode === "off") start();
  }

  // the browser stopped it anyway, for instance as it was unmuted: say so, and try again at the next touch
  function stopped() {
    if (paused || mode === "off") return;
    set("off");
    arm();
  }

  return {
    begin() {
      audio.volume = volume;
      audio.loop = true;
      audio.addEventListener("pause", stopped);
      start();
      arm();
    },
    /** the button: while the song waits for sound it gives it sound, otherwise it pauses or plays */
    toggle() {
      if (mode === "silent") {
        paused = false;
        giveSound();
      } else if (mode === "on") {
        paused = true;
        audio.pause();
        set("off");
      } else {
        paused = false;
        start();
      }
    },
    destroy() {
      disarm();
      audio.removeEventListener("pause", stopped);
    },
  };
}
