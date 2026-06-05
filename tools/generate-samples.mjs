// Generates short placeholder WAV samples so the app and demo mode are audible
// out of the box. These are intentionally simple. Replace the files in
// public/samples with your own one shots and one note instrument samples.
//
//   node tools/generate-samples.mjs
//
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "samples");

function ensure(p) {
  mkdirSync(dirname(p), { recursive: true });
}

// Float32 [-1,1] -> 16 bit PCM mono WAV buffer.
function toWav(samples) {
  const len = samples.length;
  const buf = Buffer.alloc(44 + len * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + len * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(len * 2, 40);
  for (let i = 0; i < len; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }
  return buf;
}

const noise = () => Math.random() * 2 - 1;
const env = (i, n, a = 0.005, r = 0.5) => {
  const t = i / n;
  const atk = Math.min(1, t / a);
  const rel = Math.pow(1 - t, 1 / r);
  return atk * rel;
};

function render(seconds, fn) {
  const n = Math.floor(seconds * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / SR, i, n);
  return out;
}

function write(rel, samples) {
  const p = join(root, rel);
  ensure(p);
  writeFileSync(p, toWav(samples));
  console.log("wrote", rel);
}

const TAU = Math.PI * 2;

// Drums
write(
  "drums/kick.wav",
  render(0.4, (t, i, n) => {
    const f = 120 * Math.exp(-t * 24) + 45;
    return Math.sin(TAU * f * t) * env(i, n, 0.001, 0.25) * 0.9;
  }),
);
write(
  "drums/snare.wav",
  render(0.22, (t, i, n) => {
    const tone = Math.sin(TAU * 185 * t) * 0.4;
    return (noise() * 0.8 + tone) * env(i, n, 0.001, 0.3);
  }),
);
write(
  "drums/hat.wav",
  render(0.06, (t, i, n) => noise() * env(i, n, 0.001, 0.15) * 0.6),
);
write(
  "drums/openhat.wav",
  render(0.3, (t, i, n) => noise() * env(i, n, 0.001, 0.4) * 0.5),
);
write(
  "drums/clap.wav",
  render(0.18, (t, i, n) => {
    const burst = Math.floor(t * 90) % 2 === 0 ? 1 : 0.4;
    return noise() * env(i, n, 0.001, 0.35) * 0.7 * burst;
  }),
);
write(
  "drums/rim.wav",
  render(0.05, (t, i, n) => {
    return (Math.sin(TAU * 1700 * t) * 0.6 + noise() * 0.4) * env(i, n, 0.0005, 0.12);
  }),
);
write(
  "drums/tom.wav",
  render(0.3, (t, i, n) => {
    const f = 180 * Math.exp(-t * 10) + 90;
    return Math.sin(TAU * f * t) * env(i, n, 0.001, 0.35) * 0.8;
  }),
);
write(
  "drums/ride.wav",
  render(0.5, (t, i, n) => {
    const tone = Math.sin(TAU * 5200 * t) * 0.3 + Math.sin(TAU * 7100 * t) * 0.2;
    return (noise() * 0.4 + tone) * env(i, n, 0.001, 0.6) * 0.4;
  }),
);

// Melodic one note samples. Tone.Sampler repitches these across the scale.
function tone(freq, seconds, partials) {
  return render(seconds, (t, i, n) => {
    let s = 0;
    for (const [mult, amp] of partials) s += Math.sin(TAU * freq * mult * t) * amp;
    return s * env(i, n, 0.01, 0.7) * 0.7;
  });
}

// bass at C2 (65.41 Hz)
write("bass/C2.wav", tone(65.41, 0.9, [[1, 0.7], [2, 0.25], [3, 0.1]]));
// chords at C3 (130.81 Hz), softer attack and longer tail
write(
  "chords/C3.wav",
  render(1.4, (t, i, n) => {
    const f = 130.81;
    const s =
      Math.sin(TAU * f * t) * 0.5 +
      Math.sin(TAU * f * 2 * t) * 0.2 +
      Math.sin(TAU * f * 3 * t) * 0.12;
    return s * env(i, n, 0.04, 0.8) * 0.6;
  }),
);
// lead at C4 (261.63 Hz)
write("lead/C4.wav", tone(261.63, 0.7, [[1, 0.6], [2, 0.3], [3, 0.15], [4, 0.07]]));

// FX
write(
  "fx/riser.wav",
  render(1.6, (t, i, n) => {
    const f = 200 + t * 1200;
    const swell = t / 1.6;
    return (noise() * 0.4 + Math.sin(TAU * f * t) * 0.4) * swell * env(i, n, 0.2, 0.9);
  }),
);
write(
  "fx/impact.wav",
  render(1.0, (t, i, n) => {
    const f = 80 * Math.exp(-t * 6) + 40;
    return (Math.sin(TAU * f * t) * 0.8 + noise() * 0.3 * Math.exp(-t * 8)) * env(i, n, 0.001, 0.4);
  }),
);
write(
  "fx/sweep.wav",
  render(1.0, (t, i, n) => {
    const lfo = Math.sin(TAU * 0.5 * t) * 0.5 + 0.5;
    return noise() * lfo * env(i, n, 0.1, 0.6) * 0.5;
  }),
);
write(
  "fx/downlifter.wav",
  render(1.2, (t, i, n) => {
    const f = 1400 * Math.exp(-t * 2.5) + 60;
    return Math.sin(TAU * f * t) * env(i, n, 0.005, 0.7) * 0.6;
  }),
);

console.log("done");
