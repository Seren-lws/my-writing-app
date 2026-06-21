"use client";

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

type Props = {
  bookChapters: Chapter[];
  activeChapterId: string;
  activeBookId: string;
  leftOpen: boolean;
  onSwitchChapter: (id: string) => void;
  onAddChapter: () => void;
  onToggle: (open: boolean) => void;
};

export default function ChapterSidebar({
  bookChapters,
  activeChapterId,
  activeBookId,
  leftOpen,
  onSwitchChapter,
  onAddChapter,
  onToggle,
}: Props) {
  return (
    <aside
      className={`flex flex-col border-r border-[#e0d4c0] bg-[#faf7f2] overflow-hidden ${
        leftOpen ? "p-5" : "items-center pt-4"
      }`}
    >
      {leftOpen ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-[#7c5038]">章节</p>
            <button
              onClick={() => onToggle(false)}
              title="收起"
              className="rounded-lg px-2 py-1 text-xs text-[#9a7a58] transition hover:bg-[#f0ead8] hover:text-[#7c5038]"
            >
              ‹
            </button>
          </div>
          <div className="flex-1 space-y-1.5 overflow-y-auto">
            {bookChapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => onSwitchChapter(ch.id)}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${
                  ch.id === activeChapterId
                    ? "bg-[#f0ead8] text-[#3d2b1a] shadow-sm"
                    : "text-[#7c5038] hover:bg-[#f0ead8]"
                }`}
              >
                <span className="block truncate font-medium">{ch.title || "未命名章节"}</span>
                <span className="mt-0.5 block text-xs text-[#9a7a58]">
                  {ch.content.replace(/\s/g, "").length} 字
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={onAddChapter}
            className="mt-4 w-full rounded-xl border border-dashed border-[#c8a87a] px-4 py-2.5 text-sm text-[#7c5038] transition hover:bg-[#f0ead8]"
          >
            + 新章节
          </button>
          <Link
            href={`/book-soul?bookId=${activeBookId}`}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-[#7c5038] transition hover:bg-[#f0ead8]"
          >
            <span>🪬</span>
            <span>书籍灵魂卡</span>
          </Link>
          <Link
            href={`/outlines?bookId=${activeBookId}`}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-[#7c5038] transition hover:bg-[#f0ead8]"
          >
            <span>📋</span>
            <span>章节大纲</span>
          </Link>
          <Link
            href={`/publish?bookId=${activeBookId}`}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-[#7c5038] transition hover:bg-[#f0ead8]"
          >
            <span>📢</span>
            <span>发布内容</span>
          </Link>
        </>
      ) : (
        <button
          onClick={() => onToggle(true)}
          title="展开章节列表"
          className="flex flex-col items-center gap-2 text-[#9a7a58] transition hover:text-[#7c5038]"
        >
          <span className="text-base leading-none">›</span>
          <span className="text-[10px] [writing-mode:vertical-rl]">章节</span>
        </button>
      )}
    </aside>
  );
}
