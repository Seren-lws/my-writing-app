"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Inspiration = { id: string; content: string; createdAt: string };

export default function InspirationsPage() {
  const [content, setContent] = useState("");
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("inspirations");
    if (saved) setInspirations(JSON.parse(saved));
  }, []);

  function saveInspirations(next: Inspiration[]) {
    setInspirations(next);
    localStorage.setItem("inspirations", JSON.stringify(next));
  }

  function addInspiration() {
    if (!content.trim()) return;
    const now = new Date();
    const entry: Inspiration = {
      id: crypto.randomUUID(),
      content: content.trim(),
      createdAt: now.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
    };
    saveInspirations([entry, ...inspirations]);
    setContent("");
  }

  function deleteInspiration(id: string) {
    saveInspirations(inspirations.filter(i => i.id !== id));
  }

  return (
    <main className="min-h-screen bg-[#140c05] px-8 py-10 text-[#f0e6d3]">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm tracking-[0.25em] text-[#9b744d]">INSPIRATION WALL</p>
            <h1 className="mt-3 text-4xl font-semibold text-[#f0e6d3]">灵感收集</h1>
            <p className="mt-3 text-[#c8a878]">先记下来，不急着整理。灵感可以乱一点，故事会自己长出来。</p>
          </div>
          <Link href="/" className="rounded-full border border-[#5a3518] bg-[#1e1008] px-5 py-2 text-sm text-[#d4a05a] shadow-sm transition hover:bg-[#281405]">
            ← 回到小屋
          </Link>
        </header>

        <section className="mb-8 rounded-[1.5rem] border border-[#5a3518] bg-[#1e1008] p-6 shadow-sm">
          <label className="mb-3 block text-sm font-medium text-[#d4a05a]">新灵感</label>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            className="min-h-32 w-full resize-none rounded-2xl border border-[#3a2010] bg-[#281405] p-4 leading-7 text-[#f0e6d3] outline-none placeholder:text-[#5a3820] focus:border-[#c8a060] transition"
            placeholder="比如一句台词、一个场景、一个梗、一个人物动作……" />
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-[#8a6040]">{content.trim().length} 字</p>
            <button onClick={addInspiration}
              className="rounded-full bg-[#6e4b2d] px-5 py-2 text-sm text-amber-50 transition hover:bg-[#58391f]">
              贴到灵感墙
            </button>
          </div>
        </section>

        {inspirations.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[#5a3518] bg-[#1e1008]/60 p-10 text-center text-[#8a6040]">
            这里还没有便签。先写下第一条灵感吧。
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {inspirations.map(item => (
              <article key={item.id} className="rounded-2xl border border-[#5a4010] bg-[#1e1500] p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between text-xs text-[#8a6040]">
                  <span>{item.createdAt}</span>
                  <button onClick={() => deleteInspiration(item.id)}
                    className="rounded-full px-3 py-1 transition hover:bg-[#3a2800] text-[#6a4a28] hover:text-[#c8a878]">
                    删除
                  </button>
                </div>
                <p className="whitespace-pre-wrap leading-7 text-[#e8d5b7]">{item.content}</p>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
