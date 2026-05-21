"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DayRecord = { checkedIn: boolean; wordCount: number };
type CalendarData = Record<string, DayRecord>;

const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];

function makeDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function todayKey() {
  const d = new Date();
  return makeDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}
function getCalendarGrid(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const grid: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) grid.push(null);
  for (let d = 1; d <= totalDays; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}
function calcStreak(data: CalendarData): number {
  let streak = 0;
  const d = new Date();
  if (!data[todayKey()]?.checkedIn) d.setDate(d.getDate() - 1);
  while (true) {
    const key = makeDateKey(d.getFullYear(), d.getMonth(), d.getDate());
    if (data[key]?.checkedIn) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}
function fmtCount(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n > 0 ? String(n) : "";
}
function safeParse<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [data, setData] = useState<CalendarData>({});
  const [wordInput, setWordInput] = useState("");
  const [stampKey, setStampKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = safeParse<CalendarData>("writing-calendar", {});
    setData(loaded);
    const wc = loaded[todayKey()]?.wordCount;
    if (wc) setWordInput(String(wc));
    setReady(true);
  }, []);

  function persist(updated: CalendarData) {
    setData(updated);
    localStorage.setItem("writing-calendar", JSON.stringify(updated));
  }
  function handleCheckIn() {
    const key = todayKey();
    const wc = parseInt(wordInput) || data[key]?.wordCount || 0;
    persist({ ...data, [key]: { checkedIn: true, wordCount: wc } });
    setStampKey(key);
    setTimeout(() => setStampKey(null), 500);
  }
  function handleWordChange(val: string) {
    setWordInput(val);
    const wc = parseInt(val) || 0;
    if (wc > 0) {
      const key = todayKey();
      persist({ ...data, [key]: { ...(data[key] ?? { checkedIn: false }), wordCount: wc } });
    }
  }

  const today = todayKey();
  const isCheckedIn = data[today]?.checkedIn ?? false;
  const streak = calcStreak(data);
  const monthCheckedDays = Object.entries(data).filter(([k, v]) => {
    const d = new Date(k + "T00:00:00");
    return d.getFullYear() === year && d.getMonth() === month && v.checkedIn;
  }).length;
  const todayWordCount = data[today]?.wordCount ?? 0;
  const grid = getCalendarGrid(year, month);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const canGoNext = !(year === now.getFullYear() && month === now.getMonth());

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (!canGoNext) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
  }

  if (!ready) return null;

  return (
    <main className="min-h-screen bg-[#140c05] text-[#f0e6d3]">
      <style>{`
        @keyframes stamp { 0% { transform: scale(1.35); } 60% { transform: scale(0.92); } 100% { transform: scale(1); } }
        .animate-stamp { animation: stamp 0.4s ease-out; }
      `}</style>

      <div className="mx-auto max-w-2xl px-8 py-10">
        <header className="mb-8">
          <Link href="/" className="mb-4 inline-block text-sm text-[#c8a878] transition hover:text-[#f0e6d3]">
            ← 回到小屋
          </Link>
          <h1 className="text-3xl font-semibold text-[#f0e6d3]">写作日历</h1>
          <p className="mt-2 text-sm text-[#c8a878]">记录每一天的创作，让坚持看得见。</p>
        </header>

        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { value: `🔥 ${streak}`, label: "连续打卡天数" },
            { value: String(monthCheckedDays), label: "本月打卡天数" },
            { value: fmtCount(todayWordCount) || "—", label: "今日字数" },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-2xl border border-[#3a2010] bg-[#1e1008] p-5 text-center shadow-sm">
              <p className="text-2xl font-semibold text-[#d4a05a]">{value}</p>
              <p className="mt-1.5 text-xs text-[#c8a878]">{label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#3a2010] bg-[#1e1008] p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#c8a878] transition hover:bg-[#3a2010]">‹</button>
            <span className="font-medium text-[#f0e6d3]">{year}年{month + 1}月</span>
            <button onClick={nextMonth} disabled={!canGoNext}
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#c8a878] transition hover:bg-[#3a2010] disabled:cursor-not-allowed disabled:opacity-25">›</button>
          </div>

          <div className="mb-1 grid grid-cols-7">
            {WEEK_DAYS.map(d => (
              <div key={d} className="py-1 text-center text-xs font-medium text-[#6a4a28]">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const key = makeDateKey(year, month, day);
              const rec = data[key];
              const checked = rec?.checkedIn ?? false;
              const wc = rec?.wordCount ?? 0;
              const isToday = isCurrentMonth && day === now.getDate();
              const isFuture = year > now.getFullYear() ||
                (year === now.getFullYear() && month > now.getMonth()) ||
                (isCurrentMonth && day > now.getDate());
              const isStamping = stampKey === key;

              return (
                <div key={key} className={[
                  "relative flex min-h-[52px] flex-col items-center justify-center rounded-xl py-2.5 text-center transition-colors",
                  isFuture ? "cursor-not-allowed opacity-25" : "",
                  isToday && checked ? "bg-[#6e4b2d]" : "",
                  isToday && !checked ? "bg-[#281405] ring-2 ring-[#6e4b2d]" : "",
                  !isToday && checked ? "bg-[#3a2010]" : "",
                  !isToday && !checked && !isFuture ? "hover:bg-[#281405]" : "",
                  isStamping ? "animate-stamp" : "",
                ].filter(Boolean).join(" ")}>
                  <span className={`text-sm font-medium leading-none ${isToday && checked ? "text-amber-50" : "text-[#f0e6d3]"}`}>{day}</span>
                  {checked && <span className={`mt-0.5 text-xs ${isToday ? "text-amber-200" : "text-[#d4a05a]"}`}>✓</span>}
                  {wc > 0 && <span className={`mt-0.5 text-[10px] leading-none ${isToday && checked ? "text-amber-200" : "text-[#8a6040]"}`}>{fmtCount(wc)}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {isCurrentMonth && (
          <div className="mt-5 rounded-2xl border border-[#3a2010] bg-[#1e1008] p-6 shadow-sm">
            <p className="mb-4 text-sm font-medium text-[#d4a05a]">
              今天 · {now.getFullYear()}年{now.getMonth() + 1}月{now.getDate()}日
            </p>
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#3a2010] bg-[#281405] px-4 py-2.5">
                <input type="number" value={wordInput} onChange={e => handleWordChange(e.target.value)}
                  placeholder="今天写了多少字" min={0}
                  className="flex-1 bg-transparent text-sm text-[#f0e6d3] outline-none placeholder:text-[#5a3820] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                <span className="shrink-0 text-sm text-[#c8a878]">字</span>
              </div>
              <button onClick={handleCheckIn} disabled={isCheckedIn}
                className={`shrink-0 rounded-full px-6 py-2.5 text-sm transition ${isCheckedIn ? "cursor-default bg-[#5a3518] text-amber-200" : "bg-[#6e4b2d] text-amber-50 hover:bg-[#58391f] active:scale-95"}`}>
                {isCheckedIn ? "已打卡 ✓" : "今天打卡 ✍️"}
              </button>
            </div>
            {isCheckedIn && <p className="mt-3 text-xs text-[#8a6040]">今天已完成打卡，明天继续加油 ✨</p>}
          </div>
        )}
      </div>
    </main>
  );
}
