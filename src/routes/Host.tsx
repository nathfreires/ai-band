import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as Tone from "tone";
import { getEngine } from "../audio/engine";
import { startDemo, DEMO_SLOTS } from "../audio/demo";
import { Waveform } from "../components/Waveform";
import { QrPanel } from "../components/QrPanel";
import { INSTRUMENTS, COLORS } from "../lib/types";
import type { Instrument, Slots } from "../lib/types";
import { ROOT_KEY } from "../lib/music";
import { emptySlots, makeRoomId, watchEvents, watchSlots } from "../lib/room";
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
  const [beat, setBeat] = useState(-1);

  const laneRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const meterRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const beatCounter = useRef(0);

  const joinUrl = `${window.location.origin}/join/${roomId}`;

  const flashLane = useCallback((inst: Instrument) => {
    const lane = laneRefs.current[inst];
    if (lane) {
      lane.classList.add("hit");
      window.setTimeout(() => lane.classList.remove("hit"), 120);
    }
    const m = meterRefs.current[inst];
    if (m) {
      m.style.width = "100%";
      window.setTimeout(() => {
        m.style.width = "0%";
      }, 150);
    }
  }, []);

  const begin = useCallback(async () => {
    const engine = getEngine();
    await engine.start();

    const transport = Tone.getTransport();
    transport.bpm.value = bpm;
    engine.onTrigger = (inst) => flashLane(inst);

    // Beat indicator, drawn in sync with audio.
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
      cleanups.push(offEvents, offSlots);
    }

    setStarted(true);
    cleanupRef.current = () => cleanups.forEach((c) => c());
  }, [bpm, demo, flashLane, roomId]);

  const cleanupRef = useRef<() => void>(() => {});

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
      <div className="topbar">
        <span className="brand">AI BAND // HOST</span>
        <span style={{ display: "flex", gap: 8 }}>
          {demo ? <span className="pill demo-tag mono">DEMO</span> : null}
          <span className="pill mono">
            {firebaseReady ? "RTDB LIVE" : "RTDB OFF"}
          </span>
        </span>
      </div>

      <div className="deck">
        <div className="deck-main">
          <div className="readout">
            <div>
              <span className="lbl">BPM</span>
              <span className="big mono">{bpm.toFixed(1)}</span>
            </div>
            <div>
              <span className="lbl">KEY</span>
              <span className="big key mono">{KEY_LABEL}</span>
            </div>
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
          </div>
          <Waveform getWaveform={() => getEngine().getWaveform()} />
        </div>

        <div className="deck-side">
          <QrPanel url={joinUrl} roomId={roomId} />

          <div className="lanes">
            {INSTRUMENTS.map((inst) => {
              const owner = slots[inst];
              return (
                <div
                  key={inst}
                  ref={(el) => {
                    laneRefs.current[inst] = el;
                  }}
                  className="lane"
                  style={
                    {
                      "--accent": COLORS[inst],
                      "--glow": `${COLORS[inst]}aa`,
                    } as React.CSSProperties
                  }
                >
                  <span className="name">{inst.toUpperCase()}</span>
                  <span className="meter">
                    <i
                      ref={(el) => {
                        meterRefs.current[inst] = el;
                      }}
                    />
                  </span>
                  <span className={`who ${owner ? "" : "open"}`}>
                    {owner ? owner : "OPEN"}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="pill mono" onClick={() => nudgeBpm(-1)}>
              BPM -
            </button>
            <button className="pill mono" onClick={() => nudgeBpm(1)}>
              BPM +
            </button>
            <span className="pill mono" style={{ marginLeft: "auto" }}>
              {ROOT_KEY}
            </span>
          </div>
        </div>
      </div>

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
