"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "../components/PageHeader";

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
    <main className="min-h-screen bg-[#f5f0e8] text-[#3d2b1a]">
      <div className="mx-auto max-w-xl px-8 py-10 flex flex-col items-center">
        <div className="w-full">
          <PageHeader
            title="成绩看板"
            subtitle="把每一份努力都算数。"
          />
        </div>

        <div className="w-full grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "累计字数", value: fmt(totalWords) },
            { label: "连续打卡", value: `🔥 ${streak}` },
            { label: "累计打卡", value: String(checkedDays) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-5 flex flex-col items-center gap-1 shadow-sm">
              <span className="text-2xl font-semibold text-[#a07030]">{value}</span>
              <span className="text-xs text-[#9a7a58]">{label}</span>
            </div>
          ))}
        </div>

        <Link href="/calendar" className="rounded-full border border-[#c8a87a] bg-[#faf7f2] px-6 py-2.5 text-sm text-[#a07030] transition hover:bg-[#f0ead8] hover:border-[#a07030]">
          查看写作日历 →
        </Link>
      </div>
    </main>
  );
}
