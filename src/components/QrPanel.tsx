import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Props {
  url: string;
  roomId: string;
  compact?: boolean;
}

export function QrPanel({ url, roomId, compact = false }: Props) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(url, {
      margin: 1,
      width: compact ? 120 : 320,
      color: { dark: "#0d0d0f", light: "#ffffff" },
    })
      .then((d) => {
        if (alive) setSrc(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [url, compact]);

  if (compact) {
    return (
      <div className="qrcard qrcard-mini">
        {src ? <img src={src} alt={`Join room ${roomId}`} /> : null}
        <div className="room mono">{roomId}</div>
      </div>
    );
  }

  return (
    <div className="qrcard">
      {src ? <img src={src} alt={`Join room ${roomId}`} /> : null}
      <div className="room mono">{roomId}</div>
      <div className="hint">{url}</div>
    </div>
  );
}
