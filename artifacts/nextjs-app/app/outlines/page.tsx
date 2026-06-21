"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Chapter = {
  id: string;
  bookId: string;
  title: string;
  content: string;
  outline: string;
  aiInstruction: string;
  createdAt: string;
  updatedAt: string;
};

function safeParse<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}

export default function OutlinesPage() {
  const [bookId, setBookId] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [savedAt, setSavedAt] = useState("");
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bid = params.get("bookId") ?? "";
    setBookId(bid);

    const books = safeParse<{ id: string; title: string }[]>("books", []);
    const book = books.find((b) => b.id === bid);
    if (book) setBookTitle(book.title);

    const all = safeParse<Chapter[]>("chapters", []);
    setChapters(all.filter((c) => c.bookId === bid));

    setReady(true);
  }, []);

  function updateOutline(id: string, value: string) {
    const next = chapters.map((c) => (c.id === id ? { ...c, outline: value } : c));
    setChapters(next);
    const all = safeParse<Chapter[]>("chapters", []);
    const merged = all.map((c) =>
      c.bookId === bookId ? next.find((n) => n.id === c.id) ?? c : c,
    );
    localStorage.setItem("chapters", JSON.stringify(merged));
    setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
  }

  function copyAll() {
    const text = chapters
      .map((c, i) => `【第${i + 1}章 ${c.title || "未命名"}】\n${c.outline || "（暂无大纲）"}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!ready) return null;

  return (
    <main className="min-h-screen bg-[#f8f0df] text-[#4f3524]">
      <div className="mx-auto max-w-2xl px-4 py-12 md:px-8">

        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <Link href={`/write?bookId=${bookId}`} className="mb-4 inline-block text-sm text-[#9b744d] transition hover:text-[#4f3524]">
              ← 回到写作页
            </Link>
            <div className="mt-1 flex items-center gap-2">
              {bookTitle && <span className="text-sm text-[#a37a50]">{bookTitle}</span>}
              {bookTitle && <span className="text-[#d8b98f]">/</span>}
              <h1 className="text-3xl font-semibold text-[#4f3524]">章节大纲</h1>
            </div>
            <p className="mt-2 text-sm text-[#9b744d]">全书每章的大纲汇总在这里，方便回顾、跟军师讨论。改动会和写作页同步。</p>
          </div>
          <div className="flex flex-col items-end gap-2 pt-8">
            {savedAt && <span className="text-xs text-[#9b744d]">已保存 {savedAt}</span>}
            <button onClick={copyAll} className="rounded-full bg-[#6e4b2d] px-5 py-2 text-sm text-amber-50 transition hover:bg-[#58391f]">
              {copied ? "已复制 ✓" : "复制全部"}
            </button>
          </div>
        </div>

        {/* Chapters */}
        {chapters.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8b98f] bg-[#fff8eb]/50 px-8 py-12 text-center">
            <p className="text-3xl mb-3">📑</p>
            <p className="text-sm text-[#9b744d]">这本书还没有章节。去写作页新建章节后，大纲就会出现在这里。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chapters.map((c, i) => (
              <div key={c.id} className="rounded-2xl border border-[#e0c9a5] bg-[#fff8eb] p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-[#f0dfc0] px-2.5 py-0.5 text-xs text-[#8a6a4d]">第 {i + 1} 章</span>
                  <Link href={`/write?bookId=${bookId}`} className="text-sm font-medium text-[#4f3524] transition hover:text-[#9b6a3a]">
                    {c.title || "未命名章节"}
                  </Link>
                </div>
                <textarea rows={4} value={c.outline} onChange={(e) => updateOutline(c.id, e.target.value)}
                  placeholder="这一章要写什么？几个关键节拍或场景……"
                  className="w-full resize-none bg-transparent text-sm leading-7 text-[#4f3524] outline-none placeholder:text-[#c7a984]" />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
