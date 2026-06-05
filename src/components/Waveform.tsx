import { useEffect, useRef } from "react";

interface Props {
  // Returns the current time domain buffer from the host analyser, or null.
  getWaveform: () => Float32Array | null;
}

// Scrolling dual color waveform overview in the rekordbox style. New peaks push
// in from the right. Upper half cyan, lower half orange.
export function Waveform({ getWaveform }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const history = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const buf = getWaveform();
      let peak = 0;
      if (buf) {
        for (let i = 0; i < buf.length; i++) {
          const v = Math.abs(buf[i]);
          if (v > peak) peak = v;
        }
      }
      const w = canvas.width;
      const h = canvas.height;
      const barW = Math.max(1, Math.floor(2 * dpr));
      const cols = Math.floor(w / barW);

      const hist = history.current;
      hist.push(peak);
      while (hist.length > cols) hist.shift();

      ctx.clearRect(0, 0, w, h);

      // center line
      ctx.fillStyle = "#1b1b21";
      ctx.fillRect(0, h / 2 - dpr, w, 2 * dpr);

      const mid = h / 2;
      for (let i = 0; i < hist.length; i++) {
        const x = w - (hist.length - i) * barW;
        const amp = Math.min(1, hist[i] * 1.4);
        const up = amp * (mid - 4 * dpr);
        // upper, cyan
        ctx.fillStyle = "rgba(0,160,233,0.9)";
        ctx.fillRect(x, mid - up, barW - dpr, up);
        // lower, orange
        ctx.fillStyle = "rgba(255,122,24,0.85)";
        ctx.fillRect(x, mid, barW - dpr, up);
      }

      // leading edge glow
      ctx.fillStyle = "rgba(0,160,233,0.35)";
      ctx.fillRect(w - barW, 0, barW, h);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [getWaveform]);

  return (
    <div className="wavewrap">
      <canvas ref={canvasRef} />
    </div>
  );
}
