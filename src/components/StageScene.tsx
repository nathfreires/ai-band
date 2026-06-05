import { InstrumentIcon } from "./InstrumentIcon";
import { INSTRUMENTS, COLORS } from "../lib/types";
import type { Instrument, Players, Slots } from "../lib/types";

interface Props {
  slots: Slots;
  players: Players;
  headline: string;
  // Registers each character element so the host can pulse it on the beat.
  setRef: (inst: Instrument, el: HTMLDivElement | null) => void;
}

// The host stage scene: a dark backdrop with accent stage lights, a headline
// banner, and a floor where a flat 2D character appears for each claimed
// instrument. Characters bounce and glow when their player triggers a sound.
export function StageScene({ slots, players, headline, setRef }: Props) {
  const cast = INSTRUMENTS.filter((inst) => slots[inst]);

  return (
    <div className="stage-scene">
      <div className="stage-lights">
        {INSTRUMENTS.map((inst) => (
          <span
            key={inst}
            className="stage-light"
            style={{ "--c": COLORS[inst] } as React.CSSProperties}
          />
        ))}
      </div>

      <div className={`stage-banner ${cast.length ? "dim" : ""}`}>{headline}</div>

      <div className="stage-floor">
        <div className="stage-cast">
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
      </div>
    </div>
  );
}
