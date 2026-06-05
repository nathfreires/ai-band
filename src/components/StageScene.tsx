import { InstrumentIcon } from "./InstrumentIcon";
import { INSTRUMENTS, COLORS } from "../lib/types";
import type { Instrument, Players, Slots } from "../lib/types";

interface Props {
  slots: Slots;
  players: Players;
  headline: string;
  bpm: number;
  // Registers each character element so the host can pulse it on the beat.
  setRef: (inst: Instrument, el: HTMLDivElement | null) => void;
}

const ACCENTS = INSTRUMENTS.map((inst) => COLORS[inst]);

// The host stage scene: a dark backdrop with accent stage lights, a headline
// banner, and a floor where a flat 2D character appears for each claimed
// instrument. Characters bounce and glow when their player triggers a sound.
// When the full band is assembled the stage breaks into a disco celebration.
export function StageScene({ slots, players, headline, bpm, setRef }: Props) {
  const cast = INSTRUMENTS.filter((inst) => slots[inst]);
  const complete = cast.length === INSTRUMENTS.length;

  // Characters scale down as more join so they always fit without overlap.
  const charWidth = `clamp(92px, min(${(88 / Math.max(cast.length, 1)).toFixed(1)}vw, 30vh), 260px)`;
  const beatDur = `${(60 / Math.max(bpm, 1)).toFixed(3)}s`;

  return (
    <div
      className={`stage-scene ${complete ? "disco" : ""}`}
      style={{ "--beat-dur": beatDur } as React.CSSProperties}
    >
      <div className="stage-lights">
        {INSTRUMENTS.map((inst, i) => (
          <span
            key={inst}
            className="stage-light"
            style={{ "--c": COLORS[inst], animationDelay: `${i * 0.4}s` } as React.CSSProperties}
          />
        ))}
      </div>

      {complete ? (
        <>
          <div
            className="disco-spin"
            style={{ background: `conic-gradient(${ACCENTS.join(",")},${ACCENTS[0]})` }}
          />
          <div className="disco-pulse" />
          <div className="disco-ball-wrap">
            <div className="disco-ball" />
          </div>
        </>
      ) : null}

      <div className={`stage-banner ${cast.length ? "dim" : ""}`}>{headline}</div>

      <div
        className="stage-cast"
        style={{ "--cw": charWidth } as React.CSSProperties}
      >
        {cast.map((inst) => {
          const accent = COLORS[inst];
          const photo = players[inst]?.photo;
          const name = players[inst]?.name?.trim() || slots[inst] || "";
          return (
            <div
              key={inst}
              ref={(el) => setRef(inst, el)}
              className="stage-char"
              style={
                { "--accent": accent, "--glow": `${accent}cc` } as React.CSSProperties
              }
            >
              <div className="char-figure">
                <div className="char-face">
                  {photo ? <img src={photo} alt={name} /> : <span className="char-noimg" />}
                </div>
                <div className="char-body">
                  <span className="char-icon">
                    <InstrumentIcon instrument={inst} />
                  </span>
                </div>
              </div>
              <span className="char-name mono" title={name}>
                {name}
              </span>
              <div className="char-eq">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          );
        })}
      </div>

      <div className="stage-floor" />
    </div>
  );
}
