"use client";

import { useEffect, useState } from "react";

type Drop = {
  id: number;
  x: number;        // % from left
  width: number;    // px
  height: number;   // px
  duration: number; // animation seconds
  delay: number;    // animation delay seconds
  isStreak: boolean;
};

const RAIN_CSS = `
@keyframes rain-drop {
  0%   { transform: translateY(-24px) scaleY(0.85); opacity: 0; }
  6%   { opacity: 0.75; }
  88%  { opacity: 0.45; }
  100% { transform: translateY(106vh) scaleY(1.08); opacity: 0; }
}
@keyframes rain-streak {
  0%   { transform: translateY(-70px); opacity: 0; }
  4%   { opacity: 0.38; }
  94%  { opacity: 0.18; }
  100% { transform: translateY(106vh); opacity: 0; }
}
`;

export default function RainWindow() {
  const [drops, setDrops] = useState<Drop[]>([]);

  useEffect(() => {
    const list: Drop[] = [];
    // Fat water drops — slow, teardrop shape
    for (let i = 0; i < 30; i++) {
      list.push({
        id: i,
        x: Math.random() * 100,
        width: 5 + Math.random() * 11,
        height: 12 + Math.random() * 20,
        duration: 2.8 + Math.random() * 4.5,
        delay: Math.random() * 12,
        isStreak: false,
      });
    }
    // Thin streaks — fast, linear
    for (let i = 30; i < 62; i++) {
      list.push({
        id: i,
        x: Math.random() * 100,
        width: 1 + Math.random() * 1.5,
        height: 24 + Math.random() * 48,
        duration: 0.7 + Math.random() * 1.1,
        delay: Math.random() * 8,
        isStreak: true,
      });
    }
    setDrops(list);
  }, []);

  return (
    <>
      <style>{RAIN_CSS}</style>
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none hidden md:block"
        style={{ zIndex: 0 }}
      >
        {drops.map((drop) => (
          <div
            key={drop.id}
            className="absolute"
            style={{
              left: `${drop.x}%`,
              top: `-${drop.height + 24}px`,
              width: `${drop.width}px`,
              height: `${drop.height}px`,
              borderRadius: drop.isStreak
                ? "50%"
                : "50% 50% 52% 48% / 28% 28% 72% 72%",
              background: drop.isStreak
                ? "linear-gradient(to bottom, transparent 0%, rgba(160,200,235,0.32) 40%, rgba(160,200,235,0.32) 60%, transparent 100%)"
                : "radial-gradient(ellipse at 38% 28%, rgba(255,255,255,0.52) 0%, rgba(180,218,248,0.28) 42%, rgba(120,170,215,0.1) 80%, transparent 100%)",
              boxShadow: drop.isStreak
                ? "none"
                : "0 2px 6px rgba(80,140,200,0.12), inset 0 0 4px rgba(255,255,255,0.18)",
              backdropFilter: drop.isStreak ? "none" : "blur(1.5px)",
              animation: `${drop.isStreak ? "rain-streak" : "rain-drop"} ${drop.duration}s ${drop.delay}s ease-in infinite`,
              willChange: "transform",
            }}
          />
        ))}
      </div>
    </>
  );
}
