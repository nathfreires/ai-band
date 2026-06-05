import { useCallback, useRef } from "react";
import { DRUM_PADS } from "../audio/drumkit";

interface Props {
  onTap: (note: string) => void;
}

// Live baile funk drum controller. Eight large pads, all synthesized on the
// host. Taps go through the normal event flow and are quantized on the host.
export function DrumPads({ onTap }: Props) {
  const refs = useRef<Record<number, HTMLButtonElement | null>>({});

  const flash = useCallback((i: number) => {
    const el = refs.current[i];
    if (!el) return;
    el.classList.add("flash");
    window.setTimeout(() => el.classList.remove("flash"), 110);
  }, []);

  return (
    <div className="drum-pads">
      {DRUM_PADS.map((pad, i) => (
        <button
          key={pad.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="pad drum-pad"
          onPointerDown={(e) => {
            e.preventDefault();
            flash(i);
            onTap(pad.note());
          }}
        >
          <span className="drum-pad-label">{pad.label}</span>
          <span className="drum-pad-sub">{pad.sub}</span>
        </button>
      ))}
    </div>
  );
}
