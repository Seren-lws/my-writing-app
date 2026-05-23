"use client";

import { useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

type Book = { id: string; title: string; createdAt: string; updatedAt: string };
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

type Options = {
  /** Called after chapter switch completes — use to cancel pending saves,
   *  reset save status, and clear analysis state in the parent. */
  onAfterSwitchChapter?: () => void;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function ts() { return new Date().toISOString(); }
function loadBooks(): Book[] {
  try { const r = localStorage.getItem("books"); return r ? JSON.parse(r) : []; } catch { return []; }
}
function loadChapters(): Chapter[] {
  try { const r = localStorage.getItem("chapters"); return r ? JSON.parse(r) : []; } catch { return []; }
}
function persistBooks(b: Book[]) { localStorage.setItem("books", JSON.stringify(b)); }
function persistChapters(c: Chapter[]) { localStorage.setItem("chapters", JSON.stringify(c)); }

// ── Bootstrap ──────────────────────────────────────────────────────────────

function bootstrap(urlBookId: string): { books: Book[]; chapters: Chapter[]; activeBookId: string } {
  let books = loadBooks();
  let chapters = loadChapters();

  // 1. 没有作品时自动创建默认作品「靡音」
  if (books.length === 0) {
    const defaultBook: Book = { id: crypto.randomUUID(), title: "靡音", createdAt: ts(), updatedAt: ts() };
    books = [defaultBook];
    persistBooks(books);
  }

  const defaultBookId = books[0].id;

  // 2. 旧章节迁移：补 bookId / outline / aiInstruction 字段
  let migrated = false;
  chapters = chapters.map((c) => {
    const needsBookId = !c.bookId;
    const needsOutline = c.outline === undefined;
    const needsAiInstruction = c.aiInstruction === undefined;
    if (needsBookId || needsOutline || needsAiInstruction) {
      migrated = true;
      return {
        ...c,
        bookId: c.bookId || defaultBookId,
        outline: c.outline ?? "",
        aiInstruction: c.aiInstruction ?? "",
      };
    }
    return c;
  });
  if (migrated) persistChapters(chapters);

  // 3. 确定目标 bookId（优先 URL 参数）
  const targetBookId =
    urlBookId && books.find((b) => b.id === urlBookId) ? urlBookId : defaultBookId;

  // 4. 当前作品没有章节时自动创建「第一章」
  const bookChapters = chapters.filter((c) => c.bookId === targetBookId);
  if (bookChapters.length === 0) {
    const first: Chapter = {
      id: crypto.randomUUID(),
      bookId: targetBookId,
      title: "第一章",
      content: "",
      outline: "",
      aiInstruction: "",
      createdAt: ts(),
      updatedAt: ts(),
    };
    chapters = [...chapters, first];
    persistChapters(chapters);
  }

  return { books, chapters, activeBookId: targetBookId };
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useBooksAndChapters({ onAfterSwitchChapter }: Options = {}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeBookId, setActiveBookId] = useState<string>("");
  const [activeChapterId, setActiveChapterId] = useState<string>("");
  const [ready, setReady] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────

  const activeBook = books.find((b) => b.id === activeBookId) ?? null;
  const bookChapters = chapters.filter((c) => c.bookId === activeBookId);
  const activeChapter = chapters.find((c) => c.id === activeChapterId) ?? null;

  // ── Init: load books/chapters from localStorage ───────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlBookId = params.get("bookId") ?? "";
    const { books: b, chapters: c, activeBookId: bid } = bootstrap(urlBookId);
    setBooks(b);
    setChapters(c);
    setActiveBookId(bid);
    const bChapters = c.filter((ch) => ch.bookId === bid);
    setActiveChapterId(bChapters[0]?.id ?? "");
    setReady(true);
  }, []);

  // ── Chapter actions ───────────────────────────────────────────────────────

  function handleSwitchChapter(id: string) {
    if (id === activeChapterId) return;
    // Immediately persist current state before switching
    persistChapters(chapters);
    setActiveChapterId(id);
    // Delegate save-timer cancel, save-status reset, and analysis clear to caller
    onAfterSwitchChapter?.();
  }

  function handleAddChapter() {
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      bookId: activeBookId,
      title: "新章节",
      content: "",
      outline: "",
      aiInstruction: "",
      createdAt: ts(),
      updatedAt: ts(),
    };
    const updated = [...chapters, newChapter];
    setChapters(updated);
    setActiveChapterId(newChapter.id);
    persistChapters(updated);
  }

  return {
    books,
    chapters,
    setChapters,
    activeBookId,
    activeChapterId,
    ready,
    activeBook,
    bookChapters,
    activeChapter,
    handleSwitchChapter,
    handleAddChapter,
  };
}
