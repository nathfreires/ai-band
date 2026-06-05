import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Props {
  url: string;
  roomId: string;
}

export function QrPanel({ url, roomId }: Props) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(url, {
      margin: 1,
      width: 320,
      color: { dark: "#0d0d0f", light: "#ffffff" },
    })
      .then((d) => {
        if (alive) setSrc(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [url]);

  return (
    <div className="qrcard">
      {src ? <img src={src} alt={`Join room ${roomId}`} /> : null}
      <div className="room mono">{roomId}</div>
      <div className="hint">{url}</div>
    </div>
  );
}
