import type { Instrument } from "../lib/types";

// Minimal flat instrument glyphs, drawn with currentColor.
export function InstrumentIcon({ instrument }: { instrument: Instrument }) {
  const common = {
    viewBox: "0 0 24 24",
    width: "100%",
    height: "100%",
    "aria-hidden": true,
  } as const;

  switch (instrument) {
    case "drums":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2}>
          <ellipse cx="12" cy="9" rx="8" ry="3" />
          <path d="M4 9v6c0 1.7 3.6 3 8 3s8-1.3 8-3V9" />
          <path d="M9 8 5 3M15 8l4-5" strokeLinecap="round" />
        </svg>
      );
    case "bass":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="8" cy="16" r="5" />
          <path d="M11 13l7-8" strokeLinecap="round" />
          <path d="M17 4l3 3" strokeLinecap="round" />
        </svg>
      );
    case "chords":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="6" width="18" height="12" rx="1" />
          <path d="M8 6v12M13 6v12M18 6v12" />
        </svg>
      );
    case "lead":
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 3l2.6 5.7L21 9.3l-4.6 4 1.2 6.2L12 16.6 6.4 19.5l1.2-6.2-4.6-4 6.4-.6z" />
        </svg>
      );
    case "fx":
      return (
        <svg {...common} fill="currentColor">
          <path d="M11 3l1.6 4.9L17 9.5l-4.4 1.6L11 16l-1.6-4.9L5 9.5l4.4-1.6z" />
          <circle cx="18" cy="17" r="1.6" />
          <circle cx="6.5" cy="16.5" r="1.1" />
        </svg>
      );
    default:
      return null;
  }
}
