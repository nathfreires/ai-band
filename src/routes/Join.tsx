import { useEffect, useMemo, useRef, useState } from "react";
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
  setName,
  setPhoto,
  watchSlots,
} from "../lib/room";
import { downscaleToDataUrl } from "../lib/image";
import { firebaseReady } from "../lib/firebase";

type Step = "photo" | "play";

export function Join() {
  const { roomId = "" } = useParams();
  const playerId = useMemo(() => getPlayerId(), []);
  const [slots, setSlots] = useState<Slots>(emptySlots());
  const [mine, setMine] = useState<Instrument | null>(null);
  const [step, setStep] = useState<Step>("photo");
  const [photo, setLocalPhoto] = useState<string>("");
  const [name, setLocalName] = useState<string>(
    () => localStorage.getItem("aiband.name") ?? "",
  );
  const [busy, setBusy] = useState(false);
  const NAME_MAX = 24;
  const fileRef = useRef<HTMLInputElement>(null);
  const claimKey = `aiband.claim.${roomId}`;

  useEffect(() => {
    if (!firebaseReady) return;
    const off = watchSlots(roomId, (next) => {
      setSlots(next);
      // Restore a prior claim, or drop ours if the slot changed hands.
      const saved = localStorage.getItem(claimKey) as Instrument | null;
      setMine((current) => {
        const active = current ?? saved;
        if (active && next[active] === playerId) {
          // Returning player keeps their slot and skips straight to pads.
          if (!current) setStep("play");
          return active;
        }
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
      setStep("photo");
      setLocalPhoto("");
      if (name.trim()) setName(roomId, inst, playerId, name.trim());
    }
  };

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, NAME_MAX);
    setLocalName(value);
    localStorage.setItem("aiband.name", value);
    if (mine) setName(roomId, mine, playerId, value.trim());
  };

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mine) return;
    setBusy(true);
    try {
      const dataUrl = await downscaleToDataUrl(file, 160, 0.7);
      setLocalPhoto(dataUrl);
      setPhoto(roomId, mine, playerId, dataUrl);
    } finally {
      setBusy(false);
    }
  };

  const release = () => {
    if (mine) releaseSlot(roomId, mine, playerId);
    localStorage.removeItem(claimKey);
    setMine(null);
    setLocalPhoto("");
    setStep("photo");
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

  if (mine && step === "photo") {
    const accent = COLORS[mine];
    return (
      <div
        className="join"
        style={{ "--accent": accent, "--glow": `${accent}99` } as React.CSSProperties}
      >
        <div className="padhead">
          <span className="lead">{mine.toUpperCase()}</span>
          <button className="pill mono" onClick={release}>
            CHANGE
          </button>
        </div>

        <div className="photo-step">
          <div className={`photo-frame ${photo ? "filled" : ""}`}>
            {photo ? (
              <img src={photo} alt="player" />
            ) : (
              <span className="photo-ph mono">ADD PHOTO</span>
            )}
          </div>
          <input
            className="name-input mono"
            type="text"
            inputMode="text"
            maxLength={NAME_MAX}
            placeholder="YOUR NAME"
            value={name}
            onChange={onNameChange}
          />
          <p className="ghost mono">
            Add your name and a photo so the host can see who is playing {mine}.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            style={{ display: "none" }}
            onChange={onPickPhoto}
          />
          <div className="photo-actions">
            <button
              className="cta"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? "PROCESSING" : photo ? "RETAKE" : "TAKE PHOTO"}
            </button>
            <button className="pill mono" onClick={() => setStep("play")}>
              {photo ? "DONE" : "SKIP"}
            </button>
          </div>
        </div>

        <span className="ghost mono">
          ROOM {roomId} // {playerId} // muted controller
        </span>
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
