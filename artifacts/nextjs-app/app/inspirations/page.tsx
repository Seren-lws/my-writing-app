"use client";

import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";

type Inspiration = { id: string; content: string; createdAt: string };

export default function InspirationsPage() {
  const [content, setContent] = useState("");
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
    <main className="min-h-screen bg-[#f5f0e8] px-8 py-10 text-[#3d2b1a]">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="INSPIRATION WALL"
          title="灵感收集"
          subtitle="先记下来，不急着整理。灵感可以乱一点，故事会自己长出来。"
        />

        <section className="mb-8 rounded-[1.5rem] border border-[#e0d4c0] bg-[#faf7f2] p-6 shadow-sm">
          <label className="mb-3 block text-sm font-medium text-[#a07030]">新灵感</label>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            className="min-h-32 w-full resize-none rounded-2xl border border-[#e0d4c0] bg-[#f0ead8] p-4 leading-7 text-[#3d2b1a] outline-none placeholder:text-[#c0a078] focus:border-[#c8a87a] transition"
            placeholder="比如一句台词、一个场景、一个梗、一个人物动作……" />
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-[#9a7a58]">{content.trim().length} 字</p>
            <button onClick={addInspiration}
              className="rounded-full bg-[#7c4f2a] px-5 py-2 text-sm text-amber-50 transition hover:bg-[#643e1f]">
              贴到灵感墙
            </button>
          </div>
        </section>

        {inspirations.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[#d8c8a0] bg-[#faf7f2]/60 p-10 text-center text-[#9a7a58]">
            这里还没有便签。先写下第一条灵感吧。
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {inspirations.map(item => {
              const long = item.content.length > 120 || (item.content.match(/\n/g)?.length ?? 0) >= 4;
              const open = expanded[item.id];
              return (
                <article key={item.id} className="rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between text-xs text-[#9a7a58]">
                    <span>{item.createdAt}</span>
                    <button onClick={() => deleteInspiration(item.id)}
                      className="rounded-full px-3 py-1 transition text-[#b8956a] hover:bg-[#f0ead8] hover:text-[#7c5038]">
                      删除
                    </button>
                  </div>
                  <p className={`whitespace-pre-wrap leading-7 text-[#3d2b1a] ${long && !open ? "line-clamp-4" : ""}`}>{item.content}</p>
                  {long && (
                    <button onClick={() => setExpanded(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className="mt-2 text-xs text-[#a07030] transition hover:text-[#7c5038]">
                      {open ? "收起 ↑" : "展开全文 ↓"}
                    </button>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
