"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SoulCard = {
  bookId: string;
  tone: string;
  dynamics: string;
  worldbuilding: string;
  redlines: string;
  keywords: string;
  aiReminders: string;
};

const EMPTY_CARD = {
  tone: "",
  dynamics: "",
  worldbuilding: "",
  redlines: "",
  keywords: "",
  aiReminders: "",
};

const fields: {
  key: keyof Omit<SoulCard, "bookId">;
  label: string;
  placeholder: string;
}[] = [
  {
    key: "tone",
    label: "这本书的核心基调",
    placeholder: "比如：暧昧、潮湿、克制、危险、沉溺……",
  },
  {
    key: "dynamics",
    label: "主角关系与张力",
    placeholder: "比如：互相试探、权力差、欲望压抑、假装不在意……",
  },
  {
    key: "worldbuilding",
    label: "世界观 / 背景规则",
    placeholder: "比如：故事发生地点、时代、职业背景、组织规则……",
  },
  {
    key: "redlines",
    label: "绝对不能写崩的地方",
    placeholder: "比如：不要让角色突然变幼稚、不要把暧昧写得太直白……",
  },
  {
    key: "keywords",
    label: "本书关键词",
    placeholder: "比如：雨夜、钢琴、香水、失控、沉默、吻……",
  },
  {
    key: "aiReminders",
    label: "AI 写作时要记住的提醒",
    placeholder:
      "比如：多写身体语言，少解释心理；保持暧昧张力，不要急着戳破。",
  },
];

export default function BookSoulPage() {
  const [bookId, setBookId] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [card, setCard] = useState(EMPTY_CARD);
  const [savedAt, setSavedAt] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bid = params.get("bookId") ?? "";
    setBookId(bid);

    // Load book title
    try {
      const raw = localStorage.getItem("books");
      if (raw) {
        const books = JSON.parse(raw);
        const book = books.find((b: { id: string; title: string }) => b.id === bid);
        if (book) setBookTitle(book.title);
      }
    } catch {}

    // Load existing soul card for this book
    try {
      const raw = localStorage.getItem("book-souls");
      if (raw) {
        const souls: SoulCard[] = JSON.parse(raw);
        const existing = souls.find((s) => s.bookId === bid);
        if (existing) {
          const { bookId: _bid, ...rest } = existing;
          void _bid;
          setCard({ ...EMPTY_CARD, ...rest });
        }
      }
    } catch {}

    setReady(true);
  }, []);

  function handleChange(key: keyof typeof EMPTY_CARD, value: string) {
    setCard((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    try {
      const raw = localStorage.getItem("book-souls");
      const souls: SoulCard[] = raw ? JSON.parse(raw) : [];
      const idx = souls.findIndex((s) => s.bookId === bookId);
      const updated: SoulCard = { bookId, ...card };
      if (idx >= 0) {
        souls[idx] = updated;
      } else {
        souls.push(updated);
      }
      localStorage.setItem("book-souls", JSON.stringify(souls));
    } catch {}

    const now = new Date();
    setSavedAt(
      now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    );
  }

  if (!ready) return null;

  return (
    <main className="min-h-screen bg-[#f8f0df] text-[#4f3524]">
      <div className="mx-auto max-w-2xl px-8 py-12">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <Link
              href={`/write?bookId=${bookId}`}
              className="mb-4 inline-block text-sm text-[#9b744d] transition hover:text-[#4f3524]"
            >
              ← 回到写作页
            </Link>
            <div className="flex items-center gap-2 mt-1">
              {bookTitle && (
                <span className="text-sm text-[#a37a50]">{bookTitle}</span>
              )}
              {bookTitle && <span className="text-[#d8b98f]">/</span>}
              <h1 className="text-3xl font-semibold text-[#4f3524]">
                书籍灵魂卡
              </h1>
            </div>
            <p className="mt-2 text-sm text-[#9b744d]">
              写下这本书的骨骼和气息，让每次创作都不迷失方向。
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 pt-8">
            {savedAt && (
              <span className="text-xs text-[#9b744d]">已保存 {savedAt}</span>
            )}
            <button
              onClick={handleSave}
              className="rounded-full bg-[#6e4b2d] px-6 py-2 text-sm text-amber-50 transition hover:bg-[#58391f]"
            >
              保存
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-5">
          {fields.map(({ key, label, placeholder }) => (
            <div
              key={key}
              className="rounded-2xl border border-[#e0c9a5] bg-[#fff8eb] p-6 shadow-sm"
            >
              <label className="mb-3 block text-sm font-medium text-[#6e4b2d]">
                {label}
              </label>
              <textarea
                rows={3}
                value={card[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                className="w-full resize-none bg-transparent text-sm leading-7 text-[#4f3524] outline-none placeholder:text-[#c7a984]"
              />
            </div>
          ))}
        </div>

        {/* Bottom save */}
        <div className="mt-8 flex items-center justify-between">
          {savedAt ? (
            <span className="text-sm text-[#9b744d]">已保存 {savedAt}</span>
          ) : (
            <span />
          )}
          <button
            onClick={handleSave}
            className="rounded-full bg-[#6e4b2d] px-8 py-2.5 text-sm text-amber-50 transition hover:bg-[#58391f]"
          >
            保存灵魂卡
          </button>
        </div>
      </div>
    </main>
  );
}
