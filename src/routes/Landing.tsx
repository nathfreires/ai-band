import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="center-msg">
      <span className="brand" style={{ fontSize: 22 }}>
        AI BAND
      </span>
      <p className="ghost">
        A phone is a controller. The host screen is the speaker. Everyone jams in
        C minor pentatonic, locked to one clock.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link className="cta" to="/host">
          OPEN HOST
        </Link>
        <Link className="cta" to="/host?demo=1" style={{ background: "#ff7a18", color: "#1d0a00" }}>
          DEMO MODE
        </Link>
      </div>
      <span className="ghost mono">
        Host shows a QR code. Scan it on a phone to join.
      </span>
    </div>
  );
}
