"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Inspiration = {
  id: string;
  content: string;
  createdAt: string;
};

export default function InspirationsPage() {
  const [content, setContent] = useState("");
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("inspirations");

    if (saved) {
      setInspirations(JSON.parse(saved));
    }
  }, []);

  function saveInspirations(nextInspirations: Inspiration[]) {
    setInspirations(nextInspirations);
    localStorage.setItem("inspirations", JSON.stringify(nextInspirations));
  }

  function addInspiration() {
    if (!content.trim()) return;

    const now = new Date();

    const newInspiration: Inspiration = {
      id: crypto.randomUUID(),
      content: content.trim(),
      createdAt: now.toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    saveInspirations([newInspiration, ...inspirations]);
    setContent("");
  }

  function deleteInspiration(id: string) {
    const nextInspirations = inspirations.filter((item) => item.id !== id);
    saveInspirations(nextInspirations);
  }

  return (
    <main className="min-h-screen bg-[#f8f0df] px-8 py-10 text-[#4f3524]">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm tracking-[0.25em] text-[#9b744d]">
              INSPIRATION WALL
            </p>
            <h1 className="mt-3 text-4xl font-semibold">灵感收集</h1>
            <p className="mt-3 text-[#8a6a4d]">
              先记下来，不急着整理。灵感可以乱一点，故事会自己长出来。
            </p>
          </div>

          <Link
            href="/"
            className="rounded-full border border-[#d8b98f] bg-[#fff8eb]/70 px-5 py-2 text-sm text-[#6e4b2d] shadow-sm transition hover:bg-white"
          >
            ← 回到小屋
          </Link>
        </header>

        <section className="mb-8 rounded-[1.5rem] border border-[#d6b98f] bg-[#fff8eb] p-6 shadow-sm">
          <label className="mb-3 block text-sm font-medium text-[#9b744d]">
            新灵感
          </label>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-32 w-full resize-none rounded-2xl border border-[#ead8b8] bg-[#fffaf0] p-4 leading-7 text-[#4f3524] outline-none placeholder:text-[#c7a984]"
            placeholder="比如一句台词、一个场景、一个梗、一个人物动作……"
          />

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-[#9b744d]">
              {content.trim().length} 字
            </p>

            <button
              onClick={addInspiration}
              className="rounded-full bg-[#6e4b2d] px-5 py-2 text-sm text-amber-50 transition hover:bg-[#58391f]"
            >
              贴到灵感墙
            </button>
          </div>
        </section>

        {inspirations.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[#d6b98f] bg-[#fff8eb]/60 p-10 text-center text-[#9b744d]">
            这里还没有便签。先写下第一条灵感吧。
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {inspirations.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[#d7bd83] bg-[#fff2b8] p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between text-xs text-[#9b744d]">
                  <span>{item.createdAt}</span>
                  <button
                    onClick={() => deleteInspiration(item.id)}
                    className="rounded-full px-3 py-1 transition hover:bg-[#f3df91]"
                  >
                    删除
                  </button>
                </div>

                <p className="whitespace-pre-wrap leading-7 text-[#4f3524]">
                  {item.content}
                </p>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}