// The eight pad baile funk drum kit, shared by the phone controller (PadGrid)
// and the host keyboard mapping. Every voice is synthesized in Tone.js. note()
// returns the engine note for a tap; TAMBORZAO rotates through the tambor
// pitches for a rolling timbre.
export interface DrumPadDef {
  id: string;
  label: string;
  sub: string;
  key: string;
  note: () => string;
}

const TAMS = ["tam1", "tam2", "tam3"];

export const DRUM_PADS: DrumPadDef[] = [
  { id: "kick", label: "KICK", sub: "surdo", key: "a", note: () => "kick" },
  { id: "clap", label: "CLAP", sub: "clap", key: "s", note: () => "clap" },
  {
    id: "tam",
    label: "TAMBORZÃO",
    sub: "tu",
    key: "d",
    note: () => TAMS[Math.floor(Math.random() * TAMS.length)],
  },
  { id: "snare", label: "SNARE", sub: "rim", key: "f", note: () => "snare" },
  { id: "hat", label: "HAT", sub: "hat", key: "g", note: () => "hat" },
  { id: "shaker", label: "SHAKER", sub: "ganzá", key: "h", note: () => "shaker" },
  { id: "whistle", label: "WHISTLE", sub: "apito", key: "j", note: () => "whistle" },
  { id: "vocal", label: "VOCAL", sub: "ha", key: "k", note: () => "vocal" },
];
