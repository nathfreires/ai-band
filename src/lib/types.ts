export type Instrument = "drums" | "bass" | "chords" | "lead" | "fx";

export const INSTRUMENTS: Instrument[] = [
  "drums",
  "bass",
  "chords",
  "lead",
  "fx",
];

// A single tap fired by a phone controller. Written to Firebase, consumed by
// the host. note is a sample key (drums, fx) or a pitch name (bass, chords,
// lead). t is the client timestamp in ms, used only for ordering and stale
// filtering. The host owns the real clock and quantizes everything.
export interface BandEvent {
  instrument: Instrument;
  note: string;
  t: number;
  player: string;
}

// One slot per instrument. Holds the player id that claimed it, or null.
export type Slots = Record<Instrument, string | null>;

// Per instrument player record. Holds the claimer id and a downscaled base64
// photo thumbnail stored directly in Realtime Database (no Firebase Storage).
export interface PlayerRecord {
  id: string;
  name?: string;
  photo?: string;
  t?: number;
}

export type Players = Record<Instrument, PlayerRecord | null>;

export interface RoomState {
  slots: Slots;
  events: Record<string, BandEvent>;
}

export const COLORS: Record<Instrument, string> = {
  drums: "#00a0e9",
  bass: "#ff7a18",
  chords: "#9b59ff",
  lead: "#19e6c1",
  fx: "#ff3d7f",
};
