"use client";

import { useEffect, useRef } from "react";

const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&";

interface Column {
  x: number;
  y: number;
  speed: number;
  fontSize: number;
  chars: string[];
  length: number;
  opacity: number;
  colorIndex: number;
}

const COLORS = [
  { head: "rgba(167,139,250,1)",   trail: "rgba(139,92,246," },   // violet
  { head: "rgba(186,230,253,1)",   trail: "rgba(14,165,233,"  },  // sky
  { head: "rgba(196,181,253,1)",   trail: "rgba(99,102,241,"  },  // indigo
  { head: "rgba(255,255,255,1)",   trail: "rgba(180,180,220," },  // white-ish
];

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let columns: Column[] = [];

    const initColumns = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const fontSize = 14;
      const colCount = Math.floor(canvas.width / fontSize);

      columns = Array.from({ length: colCount }, (_, i) => ({
        x:          i * fontSize,
        y:          Math.random() * -canvas.height,
        speed:      Math.random() * 1.2 + 0.4,
        fontSize,
        chars:      Array.from({ length: 30 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
        length:     Math.floor(Math.random() * 18 + 8),
        opacity:    Math.random() * 0.5 + 0.15,
        colorIndex: Math.floor(Math.random() * COLORS.length),
      }));
    };

    initColumns();
    window.addEventListener("resize", initColumns);

    const draw = () => {
      // Dark translucent overlay for fade trail
      ctx.fillStyle = "rgba(10, 10, 15, 0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const col of columns) {
        const color = COLORS[col.colorIndex];

        for (let i = 0; i < col.length; i++) {
          const charY = col.y - i * col.fontSize;
          if (charY < -col.fontSize || charY > canvas.height) continue;

          // Randomly mutate chars
          if (Math.random() < 0.02) {
            col.chars[i] = CHARS[Math.floor(Math.random() * CHARS.length)];
          }

          if (i === 0) {
            // Bright head character
            ctx.fillStyle = color.head;
            ctx.shadowColor = color.head;
            ctx.shadowBlur = 10;
          } else {
            // Fading trail
            const alpha = (col.opacity * (1 - i / col.length)).toFixed(2);
            ctx.fillStyle = `${color.trail}${alpha})`;
            ctx.shadowBlur = 0;
          }

          ctx.font = `${col.fontSize}px monospace`;
          ctx.fillText(col.chars[i], col.x, charY);
        }

        ctx.shadowBlur = 0;
        col.y += col.speed;

        // Reset column when it scrolls off
        if (col.y - col.length * col.fontSize > canvas.height) {
          col.y          = Math.random() * -200;
          col.speed      = Math.random() * 1.2 + 0.4;
          col.length     = Math.floor(Math.random() * 18 + 8);
          col.opacity    = Math.random() * 0.5 + 0.15;
          col.colorIndex = Math.floor(Math.random() * COLORS.length);
          col.chars      = Array.from({ length: 30 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]);
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", initColumns);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-40" />
      {/* Subtle radial vignette so text stays readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0a0a0f_100%)]" />
    </div>
  );
}
