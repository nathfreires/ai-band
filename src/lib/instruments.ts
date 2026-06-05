import type { Instrument } from "./types";
import { pentatonicScale, PENTATONIC_CHORDS } from "./music";

// A pad is one trigger on a controller. label is what the phone shows. note is
// what gets written to Firebase and resolved by the host engine. For drums and
// fx note is a sample key. For bass, chords, lead note is a pitch or chord name
// already locked to C minor pentatonic.
export interface Pad {
  label: string;
  note: string;
}

// Baile funk / tamborzao kit. Deep surdo kick, clap and snare, three tambor
// hits for the rolling percussion, a rim click and a high perc.
export const DRUM_KEYS = [
  "kick",
  "clap",
  "snare",
  "rim",
  "tam1",
  "tam2",
  "tam3",
  "perc",
] as const;

export const FX_KEYS = ["riser", "impact", "sweep", "downlifter"] as const;

export const PAD_LAYOUTS: Record<Instrument, Pad[]> = {
  drums: DRUM_KEYS.map((k) => ({ label: k.toUpperCase(), note: k })),
  bass: pentatonicScale(2, 8).map((n) => ({ label: n, note: n })),
  chords: Object.keys(PENTATONIC_CHORDS).map((name) => ({
    label: name,
    note: name,
  })),
  lead: pentatonicScale(4, 8).map((n) => ({ label: n, note: n })),
  fx: FX_KEYS.map((k) => ({ label: k.toUpperCase(), note: k })),
};

export const INSTRUMENT_GLYPH: Record<Instrument, string> = {
  drums: "[ DRM ]",
  bass: "[ BAS ]",
  chords: "[ CHD ]",
  lead: "[ LED ]",
  fx: "[ FX  ]",
};
