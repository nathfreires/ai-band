import * as Tone from "tone";

// C minor pentatonic. Every melodic note in the app is locked to this set.
// Scale degrees: C, Eb, F, G, Bb.
export const PENTATONIC_DEGREES = ["C", "Eb", "F", "G", "Bb"] as const;

export const ROOT_KEY = "C minor pentatonic";

// Build a run of pentatonic notes across octaves, low to high. count pads
// will map one to one onto these notes.
export function pentatonicScale(startOctave: number, count: number): string[] {
  const notes: string[] = [];
  let octave = startOctave;
  let degree = 0;
  while (notes.length < count) {
    notes.push(`${PENTATONIC_DEGREES[degree]}${octave}`);
    degree += 1;
    if (degree >= PENTATONIC_DEGREES.length) {
      degree = 0;
      octave += 1;
    }
  }
  return notes;
}

// Three note pentatonic stacks, used by the chords instrument. Each entry is a
// playable voicing built only from in scale notes.
export const PENTATONIC_CHORDS: Record<string, string[]> = {
  "Cm": ["C3", "Eb3", "G3"],
  "Eb": ["Eb3", "G3", "Bb3"],
  "Fsus": ["F3", "G3", "C4"],
  "Gm7": ["G3", "Bb3", "F4"],
  "Bb": ["Bb2", "F3", "Bb3"],
  "Cm9": ["C3", "G3", "Eb4"],
};

// The melodic instruments quantize their pitch to the scale and their timing to
// the transport. This returns the next 16th note boundary on the host clock.
export function nextSixteenth(): number {
  return Tone.Transport.nextSubdivision("16n");
}

// Snap an arbitrary transport time string forward to the grid. Used when we
// want to schedule relative to "now" on the host.
export const GRID = "16n" as const;
