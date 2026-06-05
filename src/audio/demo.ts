import * as Tone from "tone";
import type { AudioEngine } from "./engine";
import type { Slots } from "../lib/types";
import { startTamborzao, KICK_STEPS } from "./patterns";

// Demo mode. Spawns three fake players (drums, bass, chords) that auto play
// locked to the transport grid, so /host?demo=1 works on one screen with no
// phones. Everything still flows through the real host engine and clock.
//
// Drums run the shared baile funk tamborzao loop. The bass is deep and simple,
// locked one to one with the kick.
export const DEMO_SLOTS: Slots = {
  drums: "demo-DRM",
  bass: "demo-BAS",
  chords: "demo-CHD",
  lead: null,
  fx: null,
};

// Deep root per bar, all inside C minor pentatonic.
const BASS_ROOTS = ["C2", "C2", "Eb2", "Bb1"];
const CHORD_CYCLE = ["Cm", "Eb", "Bb", "Gm7"];

export function startDemo(engine: AudioEngine): () => void {
  const ids: number[] = [];
  const t = Tone.getTransport();

  const stopDrums = startTamborzao(engine);

  // Bass sounds only on kick steps so it stays glued to the kick.
  let step = 0;
  ids.push(
    t.scheduleRepeat((time) => {
      const s = step % 16;
      const bar = Math.floor(step / 16);
      if (KICK_STEPS[s]) {
        engine.trigger("bass", BASS_ROOTS[bar % BASS_ROOTS.length], time);
      }
      step += 1;
    }, "16n", 0),
  );

  // Chord stabs on the half note.
  let chordStep = 0;
  ids.push(
    t.scheduleRepeat((time) => {
      engine.trigger("chords", CHORD_CYCLE[chordStep % CHORD_CYCLE.length], time);
      chordStep += 1;
    }, "2n", 0),
  );

  // A riser every four bars to keep it moving.
  ids.push(t.scheduleRepeat((time) => engine.trigger("fx", "riser", time), "4m", "3m"));

  return () => {
    stopDrums();
    for (const id of ids) t.clear(id);
  };
}
