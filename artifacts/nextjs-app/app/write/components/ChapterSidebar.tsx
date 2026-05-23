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
      className={`flex flex-col border-r border-[#4c2c14] bg-[#261609] overflow-hidden ${
        leftOpen ? "p-5" : "items-center pt-4"
      }`}
    >
      {leftOpen ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-[#c8a878]">章节</p>
            <button
              onClick={() => onToggle(false)}
              title="收起"
              className="rounded-lg px-2 py-1 text-xs text-[#8a6040] transition hover:bg-[#311d0c] hover:text-[#c8a878]"
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
                    ? "bg-[#4c2c14] text-[#f0e6d3] shadow-sm"
                    : "text-[#c8a878] hover:bg-[#311d0c]"
                }`}
              >
                <span className="block truncate">{ch.title || "未命名章节"}</span>
                <span className="mt-0.5 block text-xs text-[#8a6040]">
                  {ch.content.replace(/\s/g, "").length} 字
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={onAddChapter}
            className="mt-4 w-full rounded-xl border border-dashed border-[#6a4020] px-4 py-2.5 text-sm text-[#c8a878] transition hover:bg-[#311d0c]"
          >
            + 新章节
          </button>
          <Link
            href={`/book-soul?bookId=${activeBookId}`}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-[#c8a878] transition hover:bg-[#311d0c]"
          >
            <span>🪬</span>
            <span>书籍灵魂卡</span>
          </Link>
        </>
      ) : (
        <button
          onClick={() => onToggle(true)}
          title="展开章节列表"
          className="flex flex-col items-center gap-2 text-[#8a6040] transition hover:text-[#c8a878]"
        >
          <span className="text-base leading-none">›</span>
          <span className="text-[10px] [writing-mode:vertical-rl]">章节</span>
        </button>
      )}
    </aside>
  );
}
