import * as Tone from "tone";
import type { AudioEngine } from "./engine";

// The classic baile funk tamborzao groove on a one bar 16th grid: kick and
// tamborzao carry the driving roll ("tu tu-tu ... tu"), the clap lands on the
// accents ("ta"). Looped, locked to Tone.Transport.
export const KICK_STEPS = [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0];
const CLAP_STEPS = [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0];
const TAM_STEPS = [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1];

// Rotating tambor pitches give the roll its woody, shifting timbre.
const TAM_PITCH = ["tam1", "tam2", "tam3"];

// Start the auto tamborzao drum loop. The live drum player can tap pads over
// it. Returns a stop function that clears the schedule.
export function startTamborzao(engine: AudioEngine): () => void {
  const t = Tone.getTransport();
  let step = 0;
  let tamIndex = 0;

  const id = t.scheduleRepeat((time) => {
    const s = step % 16;
    if (KICK_STEPS[s]) engine.trigger("drums", "kick", time);
    if (CLAP_STEPS[s]) engine.trigger("drums", "clap", time);
    if (TAM_STEPS[s]) {
      engine.trigger("drums", TAM_PITCH[tamIndex % TAM_PITCH.length], time);
      tamIndex += 1;
    }
    step += 1;
  }, "16n", 0);

  return () => t.clear(id);
}
