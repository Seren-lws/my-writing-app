"use client";

import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";

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
    <main className="min-h-screen bg-[#f5f0e8] text-[#3d2b1a]">
      <style>{`
        @keyframes stamp { 0% { transform: scale(1.35); } 60% { transform: scale(0.92); } 100% { transform: scale(1); } }
        .animate-stamp { animation: stamp 0.4s ease-out; }
      `}</style>

      <div className="mx-auto max-w-2xl px-8 py-10">
        <PageHeader
          title="写作日历"
          subtitle="记录每一天的创作，让坚持看得见。"
        />

        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { value: `🔥 ${streak}`, label: "连续打卡天数" },
            { value: String(monthCheckedDays), label: "本月打卡天数" },
            { value: fmtCount(todayWordCount) || "—", label: "今日字数" },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-5 text-center shadow-sm">
              <p className="text-2xl font-semibold text-[#a07030]">{value}</p>
              <p className="mt-1.5 text-xs text-[#9a7a58]">{label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#7c5038] transition hover:bg-[#f0ead8]">‹</button>
            <span className="font-medium text-[#3d2b1a]">{year}年{month + 1}月</span>
            <button onClick={nextMonth} disabled={!canGoNext}
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#7c5038] transition hover:bg-[#f0ead8] disabled:cursor-not-allowed disabled:opacity-25">›</button>
          </div>

          <div className="mb-1 grid grid-cols-7">
            {WEEK_DAYS.map(d => (
              <div key={d} className="py-1 text-center text-xs font-medium text-[#b8956a]">{d}</div>
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
                  isToday && checked  ? "bg-[#7c4f2a] text-amber-50" : "",
                  isToday && !checked ? "bg-[#f0ead8] ring-2 ring-[#c8a87a]" : "",
                  !isToday && checked ? "bg-[#e8d8c0]" : "",
                  !isToday && !checked && !isFuture ? "hover:bg-[#f0ead8]" : "",
                  isStamping ? "animate-stamp" : "",
                ].filter(Boolean).join(" ")}>
                  <span className={`text-sm font-medium leading-none ${isToday && checked ? "text-amber-50" : "text-[#3d2b1a]"}`}>{day}</span>
                  {checked && <span className={`mt-0.5 text-xs ${isToday ? "text-amber-200" : "text-[#a07030]"}`}>✓</span>}
                  {wc > 0 && <span className={`mt-0.5 text-[10px] leading-none ${isToday && checked ? "text-amber-200" : "text-[#9a7a58]"}`}>{fmtCount(wc)}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {isCurrentMonth && (
          <div className="mt-5 rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-6 shadow-sm">
            <p className="mb-4 text-sm font-medium text-[#a07030]">
              今天 · {now.getFullYear()}年{now.getMonth() + 1}月{now.getDate()}日
            </p>
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#e0d4c0] bg-[#f0ead8] px-4 py-2.5">
                <input type="number" value={wordInput} onChange={e => handleWordChange(e.target.value)}
                  placeholder="今天写了多少字" min={0}
                  className="flex-1 bg-transparent text-sm text-[#3d2b1a] outline-none placeholder:text-[#c0a078] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                <span className="shrink-0 text-sm text-[#7c5038]">字</span>
              </div>
              <button onClick={handleCheckIn} disabled={isCheckedIn}
                className={`shrink-0 rounded-full px-6 py-2.5 text-sm transition ${isCheckedIn ? "cursor-default bg-[#e8d8c0] text-[#a07030]" : "bg-[#7c4f2a] text-amber-50 hover:bg-[#643e1f] active:scale-95"}`}>
                {isCheckedIn ? "已打卡 ✓" : "今天打卡 ✍️"}
              </button>
            </div>
            {isCheckedIn && <p className="mt-3 text-xs text-[#9a7a58]">今天已完成打卡，明天继续加油 ✨</p>}
          </div>
        )}
      </div>
    </main>
  );
}
