import * as Tone from "tone";
import type { AudioEngine } from "./engine";
import type { Slots } from "../lib/types";
import { startTamborzao, KICK_STEPS } from "./patterns";

// Demo mode. Spawns fake players (drums, bass) that auto play locked to the
// transport grid, so /host?demo=1 works on one screen with no phones.
// Everything still flows through the real host engine and clock.
//
// Drums run the shared baile funk tamborzao loop. The bass is a deep static
// sub locked one to one with the kick. No melody plays automatically.
export const DEMO_SLOTS: Slots = {
  drums: "demo-DRM",
  bass: "demo-BAS",
  chords: null,
  lead: null,
  fx: null,
};

// Single deep root, in C minor pentatonic, locked to the kick.
const BASS_ROOT = "C2";

export function startDemo(engine: AudioEngine): () => void {
  const ids: number[] = [];
  const t = Tone.getTransport();

  const stopDrums = startTamborzao(engine);

  // Bass sounds only on kick steps so it stays glued to the kick.
  let step = 0;
  ids.push(
    t.scheduleRepeat((time) => {
      const s = step % 16;
      if (KICK_STEPS[s]) engine.trigger("bass", BASS_ROOT, time);
      step += 1;
    }, "16n", 0),
  );

  return () => {
    stopDrums();
    for (const id of ids) t.clear(id);
  };
}
