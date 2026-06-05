import {
  ref,
  onValue,
  onChildAdded,
  push,
  runTransaction,
  serverTimestamp,
  query,
  limitToLast,
  type Unsubscribe,
} from "firebase/database";
import { db } from "./firebase";
import type { BandEvent, Instrument, Slots } from "./types";
import { INSTRUMENTS } from "./types";

export function emptySlots(): Slots {
  return {
    drums: null,
    bass: null,
    chords: null,
    lead: null,
    fx: null,
  };
}

// A stable per device id so a player keeps their claimed slot across reloads.
export function getPlayerId(): string {
  const KEY = "aiband.player";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `p_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function makeRoomId(): string {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

const slotsRef = (roomId: string) => ref(db!, `rooms/${roomId}/slots`);
const eventsRef = (roomId: string) => ref(db!, `rooms/${roomId}/events`);

// Watch all slot claims for a room.
export function watchSlots(
  roomId: string,
  cb: (slots: Slots) => void,
): Unsubscribe {
  if (!db) return () => {};
  return onValue(slotsRef(roomId), (snap) => {
    const value = (snap.val() ?? {}) as Partial<Slots>;
    const merged = emptySlots();
    for (const inst of INSTRUMENTS) merged[inst] = value[inst] ?? null;
    cb(merged);
  });
}

// Host side. Fires for every new tap. We only deliver fresh events so a late
// joining host does not replay the whole history at once.
export function watchEvents(
  roomId: string,
  cb: (event: BandEvent) => void,
): Unsubscribe {
  if (!db) return () => {};
  const q = query(eventsRef(roomId), limitToLast(1));
  const start = Date.now();
  return onChildAdded(q, (snap) => {
    const ev = snap.val() as BandEvent | null;
    if (!ev) return;
    if (typeof ev.t === "number" && ev.t < start - 2000) return;
    cb(ev);
  });
}

// Atomically claim an instrument. Returns true if this player now owns it.
// Reclaiming a slot you already hold is allowed.
export async function claimSlot(
  roomId: string,
  instrument: Instrument,
  playerId: string,
): Promise<boolean> {
  if (!db) return false;
  const target = ref(db, `rooms/${roomId}/slots/${instrument}`);
  const result = await runTransaction(target, (current) => {
    if (current === null || current === playerId) return playerId;
    return undefined; // abort, already owned by someone else
  });
  return result.committed && result.snapshot.val() === playerId;
}

export function releaseSlot(
  roomId: string,
  instrument: Instrument,
  playerId: string,
): void {
  if (!db) return;
  const target = ref(db, `rooms/${roomId}/slots/${instrument}`);
  void runTransaction(target, (current) =>
    current === playerId ? null : current,
  );
}

// Phone side. Write a tap. The host owns the clock and quantizes it.
export function sendEvent(
  roomId: string,
  instrument: Instrument,
  note: string,
  playerId: string,
): void {
  if (!db) return;
  const ev = {
    instrument,
    note,
    player: playerId,
    t: Date.now(),
    serverT: serverTimestamp(),
  };
  void push(eventsRef(roomId), ev);
}
