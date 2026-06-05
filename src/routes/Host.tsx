import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as Tone from "tone";
import { getEngine } from "../audio/engine";
import { startDemo, DEMO_SLOTS } from "../audio/demo";
import { Waveform } from "../components/Waveform";
import { QrPanel } from "../components/QrPanel";
import { INSTRUMENTS, COLORS } from "../lib/types";
import type { Instrument, Players, Slots } from "../lib/types";
import { ROOT_KEY } from "../lib/music";
import {
  emptyPlayers,
  emptySlots,
  makeRoomId,
  watchEvents,
  watchPlayers,
  watchSlots,
} from "../lib/room";
import { firebaseReady } from "../lib/firebase";

const DEFAULT_BPM = 124;
const KEY_LABEL = "Cm";

export function Host() {
  const [params] = useSearchParams();
  const demo = params.get("demo") === "1";
  const [roomId] = useState(() => params.get("room") || makeRoomId());

  const [started, setStarted] = useState(false);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [slots, setSlots] = useState<Slots>(emptySlots());
  const [players, setPlayers] = useState<Players>(emptyPlayers());
  const [beat, setBeat] = useState(-1);
  const [showQr, setShowQr] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const beatCounter = useRef(0);
  const cleanupRef = useRef<() => void>(() => {});

  const joinUrl = `${window.location.origin}/join/${roomId}`;
  const anyoneJoined = INSTRUMENTS.some((inst) => slots[inst]);

  const pulseSection = useCallback((inst: Instrument) => {
    const el = sectionRefs.current[inst];
    if (!el) return;
    el.classList.remove("pulse");
    // Force reflow so the animation can retrigger on rapid hits.
    void el.offsetWidth;
    el.classList.add("pulse");
    window.setTimeout(() => el.classList.remove("pulse"), 260);
  }, []);

  const begin = useCallback(async () => {
    const engine = getEngine();
    await engine.start();

    const transport = Tone.getTransport();
    transport.bpm.value = bpm;
    engine.onTrigger = (inst) => pulseSection(inst);

    transport.scheduleRepeat((time) => {
      const step = beatCounter.current % 16;
      beatCounter.current += 1;
      Tone.Draw.schedule(() => setBeat(step), time);
    }, "16n", 0);

    transport.start();

    const cleanups: Array<() => void> = [];
    if (demo) {
      setSlots(DEMO_SLOTS);
      cleanups.push(startDemo(engine));
    } else if (firebaseReady) {
      // Every phone tap is quantized to the host clock before it sounds.
      const offEvents = watchEvents(roomId, (ev) => {
        const time = Tone.getTransport().nextSubdivision("16n");
        engine.trigger(ev.instrument, ev.note, time);
      });
      const offSlots = watchSlots(roomId, setSlots);
      const offPlayers = watchPlayers(roomId, setPlayers);
      cleanups.push(offEvents, offSlots, offPlayers);
    }

    setStarted(true);
    cleanupRef.current = () => cleanups.forEach((c) => c());
  }, [bpm, demo, pulseSection, roomId]);

  useEffect(() => {
    return () => {
      cleanupRef.current();
      const transport = Tone.getTransport();
      transport.stop();
      transport.cancel();
    };
  }, []);

  const nudgeBpm = (delta: number) => {
    setBpm((prev) => {
      const next = Math.max(60, Math.min(200, prev + delta));
      if (started) Tone.getTransport().bpm.rampTo(next, 0.1);
      return next;
    });
  };

  return (
    <div className="screen">
      <header className="hostbar">
        <div className="hostbar-left">
          <span className="brand">AI BAND // HOST</span>
          <div className="readout-inline">
            <div>
              <span className="lbl">BPM</span>
              <span className="big mono">{bpm.toFixed(1)}</span>
            </div>
            <div>
              <span className="lbl">KEY</span>
              <span className="big key mono">{KEY_LABEL}</span>
            </div>
            <div className="bpm-nudge">
              <button className="pill mono" onClick={() => nudgeBpm(-1)}>
                -
              </button>
              <button className="pill mono" onClick={() => nudgeBpm(1)}>
                +
              </button>
            </div>
          </div>
        </div>

        <div className="hostbar-mid">
          <div className="beat-row">
            {Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className={`beat ${i % 4 === 0 ? "bar" : ""} ${
                  i === beat ? "on" : ""
                }`}
              />
            ))}
          </div>
          <div className="wavestrip">
            <Waveform getWaveform={() => getEngine().getWaveform()} />
          </div>
        </div>

        <div className="hostbar-right">
          {demo ? <span className="pill demo-tag mono">DEMO</span> : null}
          <span className="pill mono">
            {firebaseReady ? "RTDB LIVE" : "RTDB OFF"}
          </span>
          {!demo ? (
            <button
              className="qr-mini"
              onClick={() => setShowQr(true)}
              title="Show join QR"
            >
              <QrPanel url={joinUrl} roomId={roomId} compact />
            </button>
          ) : null}
        </div>
      </header>

      <div className="stage">
        {INSTRUMENTS.map((inst) => {
          const owner = slots[inst];
          const photo = players[inst]?.photo;
          const name = players[inst]?.name?.trim();
          const label = owner ? name || owner : "OPEN";
          const accent = COLORS[inst];
          return (
            <div
              key={inst}
              ref={(el) => {
                sectionRefs.current[inst] = el;
              }}
              className={`inst-section ${owner ? "claimed" : "open"}`}
              style={
                {
                  "--accent": accent,
                  "--glow": `${accent}cc`,
                } as React.CSSProperties
              }
            >
              <div className="sec-avatar">
                {photo ? (
                  <img src={photo} alt={`${inst} player`} />
                ) : (
                  <div className="sec-ph" />
                )}
              </div>
              <div className="sec-label">
                <span className="sec-name">{inst.toUpperCase()}</span>
                <span
                  className={`sec-owner ${owner ? "" : "vacant"}`}
                  title={label}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {showQr && !demo ? (
        <div className="overlay" onClick={() => setShowQr(false)}>
          <div style={{ width: 320 }} onClick={(e) => e.stopPropagation()}>
            <QrPanel url={joinUrl} roomId={roomId} />
          </div>
        </div>
      ) : null}

      {started && !demo && firebaseReady && !anyoneJoined ? (
        <div className="overlay overlay-soft">
          <div style={{ width: 340, textAlign: "center" }}>
            <QrPanel url={joinUrl} roomId={roomId} />
            <p className="ghost mono" style={{ marginTop: 14 }}>
              Scan to join. This closes when the first player claims a slot.
            </p>
            <p className="ghost mono" style={{ marginTop: 6 }}>
              {ROOT_KEY}
            </p>
          </div>
        </div>
      ) : null}

      {!started ? (
        <div className="overlay">
          <button className="cta" onClick={begin}>
            START SYSTEM
          </button>
        </div>
      ) : null}
    </div>
  );
}
