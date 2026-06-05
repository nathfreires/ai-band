import * as Tone from "tone";
import type { AudioEngine } from "./engine";
import type { Slots } from "../lib/types";

// Demo mode. Spawns three fake players (drums, bass, chords) that auto play
// locked to the transport grid, so /host?demo=1 works on one screen with no
// phones. Everything still flows through the real host engine and clock.
//
// The groove is baile funk / tamborzao: a driving syncopated surdo kick, clap
// and snare accents, and a rolling tambor percussion line. The bass is deep and
// simple, locked one to one with the kick.
export const DEMO_SLOTS: Slots = {
  drums: "demo-DRM",
  bass: "demo-BAS",
  chords: "demo-CHD",
  lead: null,
  fx: null,
};

// One bar on a 16 step (16th note) grid. 1 = hit.
const KICK = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0];
const CLAP = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
const SNARE = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0];

// Rolling tamborzao line, alternating membrane pitches for the classic ostinato.
const TAM: (string | null)[] = [
  "tam1", null, "tam2", "tam3",
  null, "tam2", "tam1", null,
  "tam1", null, "tam2", "tam3",
  null, "tam2", "tam1", "tam3",
];

// Deep root per bar, all inside C minor pentatonic. The bass only sounds on
// kick steps so it stays glued to the kick.
const BASS_ROOTS = ["C2", "C2", "Eb2", "Bb1"];

const CHORD_CYCLE = ["Cm", "Eb", "Bb", "Gm7"];

export function startDemo(engine: AudioEngine): () => void {
  const ids: number[] = [];
  const t = Tone.getTransport();

  let step = 0;
  ids.push(
    t.scheduleRepeat((time) => {
      const s = step % 16;
      const bar = Math.floor(step / 16);

      if (KICK[s]) {
        engine.trigger("drums", "kick", time);
        // Bass locked to the kick, deep root for the current bar.
        engine.trigger("bass", BASS_ROOTS[bar % BASS_ROOTS.length], time);
      }
      if (CLAP[s]) engine.trigger("drums", "clap", time);
      if (SNARE[s]) engine.trigger("drums", "snare", time);
      const tam = TAM[s];
      if (tam) engine.trigger("drums", tam, time);

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
    for (const id of ids) t.clear(id);
  };
}
