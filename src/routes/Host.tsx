import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as Tone from "tone";
import { getEngine } from "../audio/engine";
import { startDemo, DEMO_SLOTS } from "../audio/demo";
import { startTamborzao } from "../audio/patterns";
import { DRUM_PADS } from "../audio/drumkit";
import { Waveform } from "../components/Waveform";
import { QrPanel } from "../components/QrPanel";
import { StageScene } from "../components/StageScene";

const HEADLINE = "CURSOR MIAMI HACKATHON";
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

const DEFAULT_BPM = 130;
const KEY_LABEL = "Cm";

export function Host() {
  const [params] = useSearchParams();
  const demo = params.get("demo") === "1";
  const view = params.get("view") === "rows" ? "rows" : "stage";
  const [roomId] = useState(() => params.get("room") || makeRoomId());

  const [started, setStarted] = useState(false);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [slots, setSlots] = useState<Slots>(emptySlots());
  const [players, setPlayers] = useState<Players>(emptyPlayers());
  const [beat, setBeat] = useState(-1);
  const [showQr, setShowQr] = useState(false);
  const [autoBeat, setAutoBeat] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const playingTimers = useRef<Record<string, number>>({});
  const beatCounter = useRef(0);
  const cleanupRef = useRef<() => void>(() => {});
  const drumLoopRef = useRef<(() => void) | null>(null);

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
    // Keep the equalizer animating for a beat after the last hit.
    el.classList.add("playing");
    window.clearTimeout(playingTimers.current[inst]);
    playingTimers.current[inst] = window.setTimeout(() => {
      el.classList.remove("playing");
    }, 600);
  }, []);

  // Start the auto player: the full fake band in demo, the tamborzao loop live.
  const startAuto = useCallback(
    (engine: ReturnType<typeof getEngine>): (() => void) => {
      if (demo) {
        setSlots(DEMO_SLOTS);
        const stop = startDemo(engine);
        return () => {
          stop();
          setSlots(emptySlots());
        };
      }
      return startTamborzao(engine);
    },
    [demo],
  );

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
    if (!demo && firebaseReady) {
      // Every phone tap is quantized to the host clock before it sounds.
      const offEvents = watchEvents(roomId, (ev) => {
        // Quantize to the next 16th, then nudge slightly so it grooves
        // instead of sounding robotic.
        const time = Tone.getTransport().nextSubdivision("16n") + Math.random() * 0.018;
        engine.trigger(ev.instrument, ev.note, time);
      });
      const offSlots = watchSlots(roomId, setSlots);
      const offPlayers = watchPlayers(roomId, setPlayers);
      cleanups.push(offEvents, offSlots, offPlayers);
    }

    // Nothing auto plays on load. The auto beat only runs once enabled.
    if (autoBeat) drumLoopRef.current = startAuto(engine);

    setStarted(true);
    cleanupRef.current = () => cleanups.forEach((c) => c());
  }, [autoBeat, bpm, demo, pulseSection, roomId, startAuto]);

  const toggleAutoBeat = () => {
    setAutoBeat((prev) => {
      const next = !prev;
      if (started) {
        if (next && !drumLoopRef.current) {
          drumLoopRef.current = startAuto(getEngine());
        } else if (!next && drumLoopRef.current) {
          drumLoopRef.current();
          drumLoopRef.current = null;
        }
      }
      return next;
    });
  };

  useEffect(() => {
    return () => {
      cleanupRef.current();
      drumLoopRef.current?.();
      drumLoopRef.current = null;
      const transport = Tone.getTransport();
      transport.stop();
      transport.cancel();
    };
  }, []);

  // Keyboard drum pads on the host so the kit can be played fast.
  useEffect(() => {
    if (!started) return;
    const map = new Map(DRUM_PADS.map((p) => [p.key, p]));
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const pad = map.get(e.key.toLowerCase());
      if (!pad) return;
      const engine = getEngine();
      if (!engine.isLoaded()) return;
      // Quantize to the 16th grid with light humanize, like every tap.
      const time =
        Tone.getTransport().nextSubdivision("16n") + Math.random() * 0.018;
      engine.trigger("drums", pad.note(), time);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started]);

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
          <span className="brand">{HEADLINE}</span>
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
          <button
            className={`pill mono ${autoBeat ? "pill-on" : ""}`}
            onClick={toggleAutoBeat}
            title="Toggle the built-in tamborzao beat"
          >
            AUTO BEAT {autoBeat ? "ON" : "OFF"}
          </button>
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

      {view === "rows" ? (
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
      ) : (
        <StageScene
          slots={slots}
          players={players}
          headline={HEADLINE}
          setRef={(inst, el) => {
            sectionRefs.current[inst] = el;
          }}
        />
      )}

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
