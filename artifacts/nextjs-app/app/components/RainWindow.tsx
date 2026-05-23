"use client";

import { useEffect, useState } from "react";

type Needle = {
  id: number;
  x: number;        // % from left
  width: number;    // px  0.5–1
  height: number;   // px  40–110  (long needles)
  duration: number; // s   0.45–0.9
  delay: number;    // s   random spread
  opacity: number;  // very low, 0.08–0.22
};

const RAIN_CSS = `
@keyframes rain-needle {
  0%   { transform: translateY(-120px) skewX(-6deg); opacity: 0; }
  8%   { opacity: var(--op); }
  88%  { opacity: var(--op); }
  100% { transform: translateY(108vh) skewX(-6deg); opacity: 0; }
}
`;

export default function RainWindow() {
  const [needles, setNeedles] = useState<Needle[]>([]);

  useEffect(() => {
    const list: Needle[] = Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      width: 0.5 + Math.random() * 0.5,        // 0.5 – 1 px
      height: 40 + Math.random() * 70,          // 40 – 110 px
      duration: 0.45 + Math.random() * 0.45,   // 0.45 – 0.9 s (fast)
      delay: Math.random() * 8,
      opacity: 0.08 + Math.random() * 0.14,    // very faint
    }));
    setNeedles(list);
  }, []);

  return (
    <>
      <style>{RAIN_CSS}</style>
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none hidden md:block"
        style={{ zIndex: 2 }}
      >
        {needles.map((n) => (
          <div
            key={n.id}
            className="absolute"
            style={
              {
                left: `${n.x}%`,
                top: `-${n.height + 20}px`,
                width: `${n.width}px`,
                height: `${n.height}px`,
                borderRadius: "1px",
                background: `linear-gradient(to bottom,
                  transparent 0%,
                  rgba(200,225,255,${n.opacity}) 30%,
                  rgba(200,225,255,${n.opacity}) 70%,
                  transparent 100%)`,
                "--op": n.opacity,
                animation: `rain-needle ${n.duration}s ${n.delay}s linear infinite`,
                willChange: "transform",
              } as React.CSSProperties & { "--op": number }
            }
          />
        ))}
      </div>
    </>
  );
}
