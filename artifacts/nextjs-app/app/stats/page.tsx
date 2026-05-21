"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function safeParse<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}

export default function StatsPage() {
  const [totalWords, setTotalWords] = useState(0);
  const [streak, setStreak] = useState(0);
  const [checkedDays, setCheckedDays] = useState(0);

  useEffect(() => {
    const chapters = safeParse<{ content?: string }[]>("chapters", []);
    const total = chapters.reduce((sum, c) => sum + (c.content?.replace(/\s/g, "").length ?? 0), 0);
    setTotalWords(total);

    const calendar = safeParse<Record<string, { checkedIn: boolean }>>("writing-calendar", {});
    const days = Object.values(calendar).filter(v => v.checkedIn).length;
    setCheckedDays(days);

    let s = 0;
    const d = new Date();
    const todayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!calendar[todayKey]?.checkedIn) d.setDate(d.getDate() - 1);
    while (true) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (calendar[key]?.checkedIn) { s++; d.setDate(d.getDate() - 1); } else break;
    }
    setStreak(s);
  }, []);

  function fmt(n: number) {
    if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  }

  return (
    <main className="min-h-screen bg-[#140c05] text-[#f0e6d3]">
      <div className="mx-auto max-w-xl px-8 py-16 flex flex-col items-center">
        <Link href="/" className="mb-8 self-start text-sm text-[#c8a878] transition hover:text-[#f0e6d3]">← 回到小屋</Link>
        <h1 className="text-3xl font-semibold text-[#f0e6d3] mb-2">成绩看板</h1>
        <p className="text-[#8a6040] mb-10 text-center">把每一份努力都算数。</p>

        <div className="w-full grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "累计字数", value: fmt(totalWords) },
            { label: "连续打卡", value: `🔥 ${streak}` },
            { label: "累计打卡", value: String(checkedDays) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-[#3a2010] bg-[#1e1008] p-5 flex flex-col items-center gap-1 shadow-sm">
              <span className="text-2xl font-semibold text-[#d4a05a]">{value}</span>
              <span className="text-xs text-[#8a6040]">{label}</span>
            </div>
          ))}
        </div>

        <Link href="/calendar" className="rounded-full border border-[#5a3518] bg-[#1e1008] px-6 py-2.5 text-sm text-[#d4a05a] transition hover:bg-[#281405]">
          查看写作日历 →
        </Link>
      </div>
    </main>
  );
}
