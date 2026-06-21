"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BookPublish = {
  bookId: string;
  name: string;
  copywriting: string;
  tags: string;
  schedule: string;
  notes: string;
};

const EMPTY = { name: "", copywriting: "", tags: "", schedule: "", notes: "" };
type FieldKey = keyof typeof EMPTY;

const FIELDS: { key: FieldKey; label: string; placeholder: string; rows: number }[] = [
  { key: "name", label: "发布名称", placeholder: "发到平台用的书名（可能跟内部叫法不一样）……", rows: 1 },
  { key: "copywriting", label: "发布文案", placeholder: "作品简介 + 避雷写一起，方便整段复制出去。\n比如：\n【简介】……\n【避雷】……", rows: 8 },
  { key: "tags", label: "标签 / 分类", placeholder: "平台标签、分类、CP、属性……", rows: 2 },
  { key: "schedule", label: "发布安排", placeholder: "更新计划、发布时间、章节节奏……", rows: 3 },
  { key: "notes", label: "其他备注", placeholder: "发布平台账号、链接、其他杂项……", rows: 3 },
];

function safeParse<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}

export default function PublishPage() {
  const [bookId, setBookId] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [data, setData] = useState(EMPTY);
  const [savedAt, setSavedAt] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bid = params.get("bookId") ?? "";
    setBookId(bid);

    const books = safeParse<{ id: string; title: string }[]>("books", []);
    const book = books.find((b) => b.id === bid);
    if (book) setBookTitle(book.title);

    const all = safeParse<BookPublish[]>("book-publish", []);
    const existing = all.find((p) => p.bookId === bid);
    if (existing) {
      const { bookId: _b, ...rest } = existing;
      void _b;
      setData({ ...EMPTY, ...rest });
    }

    setReady(true);
  }, []);

  function change(key: FieldKey, value: string) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const all = safeParse<BookPublish[]>("book-publish", []);
    const idx = all.findIndex((p) => p.bookId === bookId);
    const updated: BookPublish = { bookId, ...data };
    if (idx >= 0) all[idx] = updated; else all.push(updated);
    localStorage.setItem("book-publish", JSON.stringify(all));
    setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
  }

  function copyField(key: FieldKey) {
    const text = data[key];
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 1500);
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
              <h1 className="text-3xl font-semibold text-[#4f3524]">发布内容</h1>
            </div>
            <p className="mt-2 text-sm text-[#9b744d]">作品对外发布用的信息，每个框都能一键复制出去。</p>
          </div>
          <div className="flex flex-col items-end gap-2 pt-8">
            {savedAt && <span className="text-xs text-[#9b744d]">已保存 {savedAt}</span>}
            <button onClick={handleSave} className="rounded-full bg-[#6e4b2d] px-6 py-2 text-sm text-amber-50 transition hover:bg-[#58391f]">
              保存
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-5">
          {FIELDS.map(({ key, label, placeholder, rows }) => (
            <div key={key} className="rounded-2xl border border-[#e0c9a5] bg-[#fff8eb] p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium text-[#6e4b2d]">{label}</label>
                <button onClick={() => copyField(key)} disabled={!data[key]}
                  className="rounded-full border border-[#e0c9a5] px-3 py-1 text-xs text-[#9b744d] transition hover:bg-[#fff2e0] hover:text-[#6e4b2d] disabled:opacity-40">
                  {copiedKey === key ? "已复制 ✓" : "复制"}
                </button>
              </div>
              {rows === 1 ? (
                <input value={data[key]} onChange={(e) => change(key, e.target.value)} placeholder={placeholder}
                  className="w-full bg-transparent text-sm text-[#4f3524] outline-none placeholder:text-[#c7a984]" />
              ) : (
                <textarea rows={rows} value={data[key]} onChange={(e) => change(key, e.target.value)} placeholder={placeholder}
                  className="w-full resize-none bg-transparent text-sm leading-7 text-[#4f3524] outline-none placeholder:text-[#c7a984]" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-end">
          <button onClick={handleSave} className="rounded-full bg-[#6e4b2d] px-8 py-2.5 text-sm text-amber-50 transition hover:bg-[#58391f]">
            保存发布内容
          </button>
        </div>
      </div>
    </main>
  );
}
