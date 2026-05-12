"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Book = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type Chapter = {
  id: string;
  bookId: string;
  title: string;
  content: string;
};

export default function HomeBookList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    const rawBooks = localStorage.getItem("books");
    const rawChapters = localStorage.getItem("chapters");
    const loadedBooks: Book[] = rawBooks ? JSON.parse(rawBooks) : [];
    const loadedChapters: Chapter[] = rawChapters ? JSON.parse(rawChapters) : [];
    setBooks(loadedBooks);
    setChapters(loadedChapters);
  }, []);

  function addBook() {
    const now = new Date().toISOString();
    const newBook: Book = {
      id: crypto.randomUUID(),
      title: "新作品",
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...books, newBook];
    setBooks(updated);
    localStorage.setItem("books", JSON.stringify(updated));
  }

  function chapterCountFor(bookId: string) {
    return chapters.filter((c) => c.bookId === bookId).length;
  }

  function totalWordsFor(bookId: string) {
    return chapters
      .filter((c) => c.bookId === bookId)
      .reduce((sum, c) => sum + (c.content ?? "").replace(/\s/g, "").length, 0);
  }

  if (books.length === 0) return null;

  return (
    <section className="mt-6 rounded-[2rem] border border-[#d6b98f] bg-[#cda374] p-6 shadow-2xl">
      <div className="rounded-[1.5rem] border border-[#e5c99e] bg-[#efd5aa] px-6 py-5 shadow-inner">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#4f3524]">作品库</h2>
          <button
            onClick={addBook}
            className="rounded-full border border-[#d8b98f] bg-[#fff8eb]/70 px-4 py-1.5 text-sm text-[#6e4b2d] shadow-sm transition hover:bg-white"
          >
            + 新建作品
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/write?bookId=${book.id}`}
              className="group rounded-2xl border border-[#d9c29b] bg-[#fff7e8] p-5 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-3 text-2xl">📖</div>
              <h3 className="truncate font-semibold text-[#4f3524]">
                {book.title}
              </h3>
              <div className="mt-2 flex items-center gap-3 text-xs text-[#9b744d]">
                <span>{chapterCountFor(book.id)} 章</span>
                <span>·</span>
                <span>{totalWordsFor(book.id).toLocaleString()} 字</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
