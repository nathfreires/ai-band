import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { PadGrid } from "../components/PadGrid";
import { INSTRUMENT_GLYPH } from "../lib/instruments";
import { INSTRUMENTS, COLORS } from "../lib/types";
import type { Instrument, Slots } from "../lib/types";
import {
  claimSlot,
  emptySlots,
  getPlayerId,
  releaseSlot,
  sendEvent,
  watchSlots,
} from "../lib/room";
import { firebaseReady } from "../lib/firebase";

export function Join() {
  const { roomId = "" } = useParams();
  const playerId = useMemo(() => getPlayerId(), []);
  const [slots, setSlots] = useState<Slots>(emptySlots());
  const [mine, setMine] = useState<Instrument | null>(null);
  const claimKey = `aiband.claim.${roomId}`;

  useEffect(() => {
    if (!firebaseReady) return;
    const off = watchSlots(roomId, (next) => {
      setSlots(next);
      // Restore a prior claim, or drop ours if the slot changed hands.
      const saved = localStorage.getItem(claimKey) as Instrument | null;
      setMine((current) => {
        const active = current ?? saved;
        if (active && next[active] === playerId) return active;
        if (active && next[active] !== playerId) {
          localStorage.removeItem(claimKey);
          return null;
        }
        return current;
      });
    });
    return off;
  }, [roomId, playerId, claimKey]);

  const claim = async (inst: Instrument) => {
    if (!firebaseReady) return;
    const ok = await claimSlot(roomId, inst, playerId);
    if (ok) {
      localStorage.setItem(claimKey, inst);
      setMine(inst);
    }
  };

  const release = () => {
    if (mine) releaseSlot(roomId, mine, playerId);
    localStorage.removeItem(claimKey);
    setMine(null);
  };

  const tap = (note: string) => {
    if (mine) sendEvent(roomId, mine, note, playerId);
  };

  if (!firebaseReady) {
    return (
      <div className="center-msg">
        <span className="brand">AI BAND</span>
        <p className="ghost">
          Realtime sync is off. Add Firebase env vars to connect this controller.
        </p>
        <div className="code">cp .env.example .env</div>
      </div>
    );
  }

  if (mine) {
    const accent = COLORS[mine];
    return (
      <div className="join">
        <div
          className="padhead"
          style={{ "--accent": accent } as React.CSSProperties}
        >
          <span className="lead">{mine.toUpperCase()}</span>
          <button className="pill mono" onClick={release}>
            CHANGE
          </button>
        </div>
        <div
          className="padwrap"
          style={{ "--accent": accent, "--glow": `${accent}99` } as React.CSSProperties}
        >
          <PadGrid instrument={mine} onTap={tap} />
        </div>
        <span className="ghost mono">
          ROOM {roomId} // {playerId} // muted controller
        </span>
      </div>
    );
  }

  return (
    <div className="join">
      <h1>PICK YOUR INSTRUMENT // ROOM {roomId}</h1>
      <div className="picker">
        {INSTRUMENTS.map((inst) => {
          const owner = slots[inst];
          const takenByOther = owner && owner !== playerId;
          return (
            <button
              key={inst}
              className={`inst-btn ${takenByOther ? "taken" : ""}`}
              disabled={Boolean(takenByOther)}
              style={{ "--accent": COLORS[inst] } as React.CSSProperties}
              onClick={() => claim(inst)}
            >
              <span className="gl mono">{INSTRUMENT_GLYPH[inst]}</span>
              <span className="nm">{inst}</span>
              <span className="st">{takenByOther ? "LOCKED" : "AVAILABLE"}</span>
            </button>
          );
        })}
      </div>
      <span className="ghost mono">
        Tap to claim. Locked instruments belong to another player.
      </span>
    </div>
  );
}
