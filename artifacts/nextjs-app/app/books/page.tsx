"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Book = { id: string; title: string; createdAt: string; updatedAt: string };
type Chapter = { id: string; bookId: string; title: string; content: string };

function ts() { return new Date().toISOString(); }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}
function fmtWords(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w 字`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k 字`;
  return n > 0 ? `${n} 字` : "暂无内容";
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const b = localStorage.getItem("books");
      const c = localStorage.getItem("chapters");
      setBooks(b ? JSON.parse(b) : []);
      setChapters(c ? JSON.parse(c) : []);
    } catch {}
    setReady(true);
  }, []);

  function persist(b: Book[]) {
    setBooks(b);
    localStorage.setItem("books", JSON.stringify(b));
  }

  function handleCreate() {
    const title = newTitle.trim();
    if (!title) return;
    const book: Book = { id: crypto.randomUUID(), title, createdAt: ts(), updatedAt: ts() };
    persist([...books, book]);
    setNewTitle("");
  }

  function handleRename(id: string) {
    const title = editTitle.trim();
    if (!title) return;
    persist(books.map((b) => b.id === id ? { ...b, title, updatedAt: ts() } : b));
    setEditingId(null);
  }

  function handleDelete(id: string) {
    if (!confirm("确认删除这本书？章节数据也会一并删除。")) return;
    const updatedBooks = books.filter((b) => b.id !== id);
    const updatedChapters = chapters.filter((c) => c.bookId !== id);
    persist(updatedBooks);
    setChapters(updatedChapters);
    localStorage.setItem("chapters", JSON.stringify(updatedChapters));
  }

  function getWordCount(bookId: string) {
    return chapters
      .filter((c) => c.bookId === bookId)
      .reduce((sum, c) => sum + (c.content?.replace(/\s/g, "").length ?? 0), 0);
  }

  function getChapterCount(bookId: string) {
    return chapters.filter((c) => c.bookId === bookId).length;
  }

  if (!ready) return null;

  return (
    <main className="min-h-screen bg-[#1c1108] px-6 py-10 text-[#f0e6d3] md:px-12">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <header className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs tracking-[0.25em] text-[#9b744d]">MY WORKS</p>
            <Link href="/" className="rounded-full border border-[#6a4020] px-4 py-1.5 text-sm text-[#c8a878] transition hover:bg-[#311d0c]">
              ← 回到小屋
            </Link>
          </div>
          <h1 className="text-3xl font-semibold text-[#f0e6d3]">我的作品库</h1>
          <p className="mt-2 text-sm text-[#c8a878]">
            {books.length > 0 ? `共 ${books.length} 部作品` : "还没有作品，新建第一本吧~"}
          </p>
        </header>

        {/* New book input */}
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-[#4c2c14] bg-[#261609] p-4">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            placeholder="输入新作品名称，回车或点新建……"
            className="flex-1 bg-transparent text-sm text-[#f0e6d3] outline-none placeholder:text-[#9b744d]"
          />
          <button
            onClick={handleCreate}
            disabled={!newTitle.trim()}
            className="rounded-full bg-[#6e4b2d] px-5 py-2 text-sm text-amber-50 transition hover:bg-[#58391f] disabled:opacity-40"
          >
            + 新建
          </button>
        </div>

        {/* Book list */}
        {books.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#4c2c14] py-20 text-center text-[#6a4020]">
            <p className="text-4xl mb-3">📖</p>
            <p className="text-sm">在上面输入书名，开始你的第一部作品</p>
          </div>
        ) : (
          <div className="space-y-3">
            {books.map((book) => {
              const wordCount = getWordCount(book.id);
              const chapterCount = getChapterCount(book.id);
              const isEditing = editingId === book.id;

              return (
                <div
                  key={book.id}
                  className="group rounded-2xl border border-[#4c2c14] bg-[#261609] transition hover:border-[#6e4b2d]"
                >
                  <div className="flex items-center gap-4 px-6 py-5">
                    {/* Book icon */}
                    <span className="shrink-0 text-2xl">📗</span>

                    {/* Title / edit */}
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(book.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onBlur={() => handleRename(book.id)}
                          className="w-full bg-transparent text-base font-semibold text-[#f0e6d3] outline-none border-b border-[#6e4b2d] pb-0.5"
                        />
                      ) : (
                        <p className="truncate text-base font-semibold text-[#f0e6d3]">{book.title}</p>
                      )}
                      <p className="mt-1 text-xs text-[#8a6040]">
                        {chapterCount > 0 ? `${chapterCount} 章 · ` : ""}{fmtWords(wordCount)} · 更新于 {fmtDate(book.updatedAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => { setEditingId(book.id); setEditTitle(book.title); }}
                        className="rounded-lg px-3 py-1.5 text-xs text-[#8a6040] transition hover:bg-[#311d0c] hover:text-[#c8a878] opacity-0 group-hover:opacity-100"
                      >
                        重命名
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
                        className="rounded-lg px-3 py-1.5 text-xs text-[#8a6040] transition hover:bg-[#311d0c] hover:text-red-400 opacity-0 group-hover:opacity-100"
                      >
                        删除
                      </button>
                      <Link
                        href={`/write?bookId=${book.id}`}
                        className="rounded-full bg-[#6e4b2d] px-4 py-1.5 text-sm text-amber-50 transition hover:bg-[#58391f]"
                      >
                        进入写作 →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
