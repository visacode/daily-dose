import { useEffect, useRef } from "react";

type Blob = { x: number; y: number; r: number; col: string; s: number; p: number };

const BLOBS: Blob[] = [
  { x: 0.15, y: 0.3, r: 0.6, col: "124,77,255", s: 0.00011, p: 0 },
  { x: 0.55, y: 0.8, r: 0.55, col: "255,61,127", s: 0.00014, p: 2 },
  { x: 0.88, y: 0.2, r: 0.5, col: "61,216,255", s: 0.00009, p: 4 },
  { x: 0.4, y: 0.05, r: 0.45, col: "255,154,61", s: 0.00013, p: 1 },
];

export function Aurora({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let start = 0;
    let lastDraw = 0;

    const draw = (now: number) => {
      if (!start) start = now;
      const time = reduced ? 1200 : now - start;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = 0.5;
      const pixelWidth = Math.max(1, Math.round(width * dpr));
      const pixelHeight = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#0B0920";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      for (const blob of BLOBS) {
        const x = (blob.x + Math.sin(time * blob.s * 6.28 + blob.p) * 0.2) * width;
        const y = (blob.y + Math.cos(time * blob.s * 5.1 + blob.p) * 0.3) * height;
        const radius = blob.r * Math.max(width, height);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(${blob.col},0.55)`);
        gradient.addColorStop(1, `rgba(${blob.col},0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.globalCompositeOperation = "source-over";
      const sparks = Math.round(Math.min(24, width / 40));
      for (let i = 0; i < sparks; i += 1) {
        const px = (i * 97.3 + time * 0.008 * (1 + (i % 4))) % Math.max(1, width);
        const py = Math.abs((i * 53.7 + Math.sin(time * 0.0006 + i) * 8) % Math.max(1, height));
        const alpha = 0.25 + 0.35 * Math.sin(time * 0.002 + i * 1.7);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, alpha)})`;
        ctx.beginPath();
        ctx.arc(px, py, i % 7 === 0 ? 1.7 : 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (document.hidden || now - lastDraw < 40) return;
      lastDraw = now;
      draw(now);
    };

    if (reduced) {
      draw(performance.now());
      return;
    }
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [reduced]);

  return <canvas ref={ref} className="aurora" aria-hidden="true" />;
}
