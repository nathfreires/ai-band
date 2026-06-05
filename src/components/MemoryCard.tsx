import { useEffect, useRef, useState } from "react";
import { InstrumentIcon } from "./InstrumentIcon";
import { COLORS } from "../lib/types";
import type { Instrument } from "../lib/types";

export interface MemoryMember {
  instrument: Instrument;
  name: string;
  photo?: string;
}

export interface Memory {
  url: string;
  band: MemoryMember[];
  date: Date;
  room: string;
  bpm: number;
  keyLabel: string;
  ext: string;
}

interface Props {
  memory: Memory;
  onClose: () => void;
}

// A shareable keepsake recap of a jam, styled like a polaroid in the rekordbox
// plus Miami aesthetic. Fully separate from the live engine.
export function MemoryCard({ memory, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onEnd = () => setPlaying(false);
    a.addEventListener("ended", onEnd);
    return () => a.removeEventListener("ended", onEnd);
  }, []);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      void a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const dateLabel = memory.date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeLabel = memory.date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="overlay" onClick={onClose}>
      <div className="memory-card" onClick={(e) => e.stopPropagation()}>
        <div className="memory-sheen" />
        <div className="memory-head">
          <span className="memory-kicker mono">A MEMORY FROM</span>
          <span className="memory-title">CURSOR MIAMI HACKATHON</span>
        </div>

        <div className="memory-band">
          {memory.band.length === 0 ? (
            <span className="ghost mono">No players were on stage.</span>
          ) : (
            memory.band.map((m) => (
              <div
                key={m.instrument}
                className="mem-member"
                style={{ "--accent": COLORS[m.instrument] } as React.CSSProperties}
              >
                <div className="mem-face">
                  {m.photo ? <img src={m.photo} alt={m.name} /> : <span className="mem-noimg" />}
                  <span className="mem-badge">
                    <InstrumentIcon instrument={m.instrument} />
                  </span>
                </div>
                <span className="mem-name mono" title={m.name}>
                  {m.name}
                </span>
                <span className="mem-inst mono">{m.instrument}</span>
              </div>
            ))
          )}
        </div>

        <div className="memory-stats mono">
          <span>
            <i>ROOM</i>
            {memory.room}
          </span>
          <span>
            <i>BPM</i>
            {memory.bpm.toFixed(0)}
          </span>
          <span>
            <i>KEY</i>
            {memory.keyLabel}
          </span>
          <span>
            <i>DATE</i>
            {dateLabel} {timeLabel}
          </span>
        </div>

        <audio ref={audioRef} src={memory.url} preload="auto" />
        <div className="memory-actions">
          <button className="mem-btn play" onClick={togglePlay}>
            {playing ? "PAUSE" : "PLAY"}
          </button>
          <a
            className="mem-btn"
            href={memory.url}
            download={`cursor-miami-jam.${memory.ext}`}
          >
            DOWNLOAD
          </a>
          <button className="mem-btn ghost-btn" onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
