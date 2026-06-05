import * as Tone from "tone";
import type { AudioEngine } from "./engine";
import type { Slots } from "../lib/types";

// Demo mode. Spawns three fake players (drums, bass, chords) that auto play
// locked to the transport grid, so /host?demo=1 works on one screen with no
// phones. Everything still flows through the real host engine and clock.
export const DEMO_SLOTS: Slots = {
  drums: "demo-DRM",
  bass: "demo-BAS",
  chords: "demo-CHD",
  lead: null,
  fx: null,
};

const BASS_RIFF = ["C2", "C2", "Eb2", "G2", "C2", "Bb2", "F2", "G2"];
const CHORD_CYCLE = ["Cm", "Eb", "Bb", "Gm7"];

export function startDemo(engine: AudioEngine): () => void {
  const ids: number[] = [];
  const t = Tone.getTransport();

  // Kick on every beat.
  ids.push(t.scheduleRepeat((time) => engine.trigger("drums", "kick", time), "4n", 0));
  // Snare on the backbeat.
  ids.push(t.scheduleRepeat((time) => engine.trigger("drums", "snare", time), "2n", "4n"));
  // Closed hats on eighths, with an open hat lift before the bar.
  let hatStep = 0;
  ids.push(
    t.scheduleRepeat((time) => {
      const note = hatStep % 8 === 7 ? "openhat" : "hat";
      engine.trigger("drums", note, time);
      hatStep += 1;
    }, "8n", 0),
  );

  // Bass riff on eighths.
  let bassStep = 0;
  ids.push(
    t.scheduleRepeat((time) => {
      engine.trigger("bass", BASS_RIFF[bassStep % BASS_RIFF.length], time);
      bassStep += 1;
    }, "8n", 0),
  );

  // Chord stabs every half note.
  let chordStep = 0;
  ids.push(
    t.scheduleRepeat((time) => {
      engine.trigger("chords", CHORD_CYCLE[chordStep % CHORD_CYCLE.length], time);
      chordStep += 1;
    }, "2n", 0),
  );

  // A riser every two bars to keep it moving.
  ids.push(t.scheduleRepeat((time) => engine.trigger("fx", "riser", time), "2m", "1m"));

  return () => {
    for (const id of ids) t.clear(id);
  };
}
