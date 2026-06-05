import { useCallback, useRef } from "react";

interface Props {
  onTap: (note: string) => void;
}

// Live baile funk drum controller. Three large pads the drummer taps to play
// the beat themselves. KICK and CLAP fire their one shots. PERC fires a
// tamborzao hit, rotating through the three tambor pitches for a rolling feel.
// Taps go through the normal event flow and are quantized on the host.
const TAMS = ["tam1", "tam2", "tam3"];

const PADS = [
  { label: "KICK", sub: "surdo", note: () => "kick" },
  { label: "CLAP", sub: "clap", note: () => "clap" },
  {
    label: "PERC",
    sub: "tamborzao",
    note: () => TAMS[Math.floor(Math.random() * TAMS.length)],
  },
];

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
      {PADS.map((pad, i) => (
        <button
          key={pad.label}
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
