import test from "node:test";
import assert from "node:assert/strict";
import { createMusic, TOUCHES } from "../src/lib/music.ts";

/**
 * policy "allowed"    sound may start by itself
 *        "muted-only" sound is refused until a touch and a muted song is allowed, which is what a browser does on a first visit
 *        "none"       even a muted song is refused
 * unmuteBlocked: the browser pauses the song when it is unmuted without being allowed to
 */
function setup({ policy = "allowed", unmuteBlocked = false } = {}) {
  const audioListeners = {};
  let muted = false;
  const audio = {
    paused: true, volume: 1, loop: false, playCalls: 0,
    play() {
      this.playCalls++;
      if (policy === "none" || (policy === "muted-only" && !muted)) return Promise.reject(new Error("NotAllowedError"));
      this.paused = false;
      return Promise.resolve();
    },
    pause() { this.paused = true; (audioListeners.pause || []).forEach((f) => f()); },
    addEventListener(type, fn) { (audioListeners[type] ||= []).push(fn); },
    removeEventListener(type, fn) { audioListeners[type] = (audioListeners[type] || []).filter((f) => f !== fn); },
  };
  Object.defineProperty(audio, "muted", {
    get: () => muted,
    set(v) {
      muted = v;
      if (!v && unmuteBlocked && !audio.paused) audio.pause();
    },
  });
  const docListeners = {};
  const doc = {
    addEventListener(type, fn) { (docListeners[type] ||= []).push(fn); },
    removeEventListener(type, fn) { docListeners[type] = (docListeners[type] || []).filter((f) => f !== fn); },
  };
  const modes = [];
  const music = createMusic({ audio, doc, onMode: (m) => modes.push(m) });
  const armed = () => TOUCHES.some((t) => (docListeners[t] || []).length > 0);
  const touch = (type = "pointerdown") => (docListeners[type] || []).slice().forEach((f) => f());
  const settle = () => new Promise((r) => setTimeout(r, 0));
  return { audio, music, modes, armed, touch, settle, docListeners };
}

test("when the browser allows sound, the song starts by itself with sound and waits for nothing", async () => {
  const s = setup({ policy: "allowed" });
  s.music.begin();
  await s.settle();
  assert.equal(s.audio.paused, false);
  assert.equal(s.audio.muted, false);
  assert.equal(s.audio.volume, 0.35);
  assert.equal(s.audio.loop, true);
  assert.deepEqual(s.modes, ["on"]);
  assert.equal(s.armed(), false);
});

test("when it does not, the song still starts at once, muted, and waits for a touch", async () => {
  const s = setup({ policy: "muted-only" });
  s.music.begin();
  await s.settle();
  assert.equal(s.audio.paused, false, "it is running without anyone touching anything");
  assert.equal(s.audio.muted, true);
  assert.deepEqual(s.modes, ["silent"]);
  assert.equal(s.armed(), true);
});

test("the first touch gives it sound without restarting it", async () => {
  for (const type of ["pointerdown", "mousedown", "touchend", "keydown", "click"]) {
    const s = setup({ policy: "muted-only" });
    s.music.begin();
    await s.settle();
    const before = s.audio.playCalls;
    s.touch(type);
    assert.equal(s.audio.muted, false, type);
    assert.equal(s.audio.paused, false, type);
    assert.equal(s.audio.playCalls, before, `${type}: no second start was needed`);
    assert.deepEqual(s.modes, ["silent", "on"], type);
    assert.equal(s.armed(), false, type);
  }
});

test("only inputs a browser counts as a touch are listened for, so the start of a touch and scrolling are not", () => {
  assert.ok(!TOUCHES.includes("touchstart"));
  assert.ok(!TOUCHES.includes("scroll") && !TOUCHES.includes("wheel") && !TOUCHES.includes("mousemove"));
  assert.ok(TOUCHES.includes("touchend") && TOUCHES.includes("pointerdown") && TOUCHES.includes("keydown"));
});

test("the button, while the song waits for sound, gives it sound and does not pause it", async () => {
  const s = setup({ policy: "muted-only" });
  s.music.begin();
  await s.settle();
  s.music.toggle();
  assert.equal(s.audio.muted, false);
  assert.equal(s.audio.paused, false);
  assert.deepEqual(s.modes, ["silent", "on"]);
});

test("a pause stays a pause: later touches do not start it, and the button starts it with sound", async () => {
  const s = setup({ policy: "allowed" });
  s.music.begin();
  await s.settle();
  s.music.toggle();
  assert.equal(s.audio.paused, true);
  assert.deepEqual(s.modes, ["on", "off"]);
  s.armed() && s.touch("pointerdown");
  assert.equal(s.audio.paused, true, "a touch leaves a paused song alone");
  s.music.toggle();
  await s.settle();
  assert.equal(s.audio.paused, false);
  assert.equal(s.audio.muted, false);
  assert.deepEqual(s.modes, ["on", "off", "on"]);
});

test("if even a muted song is refused, it waits and starts at the first touch", async () => {
  const s = setup({ policy: "none" });
  s.music.begin();
  await s.settle();
  assert.equal(s.audio.paused, true);
  assert.deepEqual(s.modes, []);
  assert.equal(s.armed(), true);
});

test("if the browser pauses it as it is unmuted, it says so and tries again at the next touch", async () => {
  const s = setup({ policy: "muted-only", unmuteBlocked: true });
  s.music.begin();
  await s.settle();
  s.touch("pointerdown");
  assert.equal(s.audio.paused, true, "the browser stopped it");
  assert.equal(s.modes.at(-1), "off", "and the page does not pretend it is playing");
  assert.equal(s.armed(), true, "so the next touch gets another go");
});

test("a pause the visitor asked for is not mistaken for the browser stopping it", async () => {
  const s = setup({ policy: "allowed" });
  s.music.begin();
  await s.settle();
  s.music.toggle();
  assert.equal(s.armed(), false, "nothing is left waiting to start it again");
});

test("destroy takes every listener away", async () => {
  const s = setup({ policy: "muted-only" });
  s.music.begin();
  await s.settle();
  s.music.destroy();
  assert.equal(s.armed(), false);
});
