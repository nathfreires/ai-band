import { useCallback, useRef } from "react";
import type { Instrument } from "../lib/types";
import { COLORS } from "../lib/types";
import { PAD_LAYOUTS } from "../lib/instruments";

interface Props {
  instrument: Instrument;
  onTap: (note: string) => void;
}

// Performance pad grid. A tap fires the callback. Visual flash is local only,
// phones never produce sound.
export function PadGrid({ instrument, onTap }: Props) {
  const pads = PAD_LAYOUTS[instrument];
  const accent = COLORS[instrument];
  const cols = pads.length <= 6 ? 2 : 4;
  const refs = useRef<Record<number, HTMLButtonElement | null>>({});

  const flash = useCallback((i: number) => {
    const el = refs.current[i];
    if (!el) return;
    el.classList.add("flash");
    window.setTimeout(() => el.classList.remove("flash"), 110);
  }, []);

  return (
    <div
      className="pad-grid"
      style={
        {
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          "--accent": accent,
          "--glow": `${accent}99`,
        } as React.CSSProperties
      }
    >
      {pads.map((pad, i) => (
        <button
          key={pad.note}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="pad"
          onPointerDown={(e) => {
            e.preventDefault();
            flash(i);
            onTap(pad.note);
          }}
        >
          {pad.label}
        </button>
      ))}
    </div>
  );
}
