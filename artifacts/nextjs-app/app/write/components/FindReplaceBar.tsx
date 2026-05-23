"use client";

import { RefObject } from "react";

type Match = { start: number; end: number };

type Props = {
  findQuery: string;
  replaceQuery: string;
  findCaseSensitive: boolean;
  findUseRegex: boolean;
  findMatches: Match[];
  findMatchIdx: number;
  findInputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (q: string) => void;
  onReplaceChange: (q: string) => void;
  onToggleCaseSensitive: (v: boolean) => void;
  onToggleRegex: (v: boolean) => void;
  onFindNext: () => void;
  onFindPrev: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
};

export default function FindReplaceBar({
  findQuery,
  replaceQuery,
  findCaseSensitive,
  findUseRegex,
  findMatches,
  findMatchIdx,
  findInputRef,
  onQueryChange,
  onReplaceChange,
  onToggleCaseSensitive,
  onToggleRegex,
  onFindNext,
  onFindPrev,
  onReplace,
  onReplaceAll,
  onClose,
}: Props) {
  return (
    <div className="shrink-0 border-b border-[#e0d4c0] bg-[#faf7f2] px-4 py-2 space-y-1.5">
      {/* Find row */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1.5 rounded-xl border border-[#c8a87a] bg-[#f0ead8] px-3 py-1.5">
          <input
            ref={findInputRef}
            type="text"
            value={findQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.shiftKey ? onFindPrev() : onFindNext(); }
              if (e.key === "Escape") onClose();
            }}
            placeholder="查找…"
            className="flex-1 bg-transparent text-sm text-[#3d2b1a] outline-none placeholder:text-[#c0a078]"
          />
          <button
            title="区分大小写"
            onClick={() => onToggleCaseSensitive(!findCaseSensitive)}
            className={`rounded px-1.5 py-0.5 text-xs font-mono transition ${
              findCaseSensitive ? "bg-[#7c4f2a] text-amber-50" : "text-[#9a7a58] hover:text-[#3d2b1a]"
            }`}
          >
            Aa
          </button>
          <button
            title="正则表达式"
            onClick={() => onToggleRegex(!findUseRegex)}
            className={`rounded px-1.5 py-0.5 text-xs font-mono transition ${
              findUseRegex ? "bg-[#7c4f2a] text-amber-50" : "text-[#9a7a58] hover:text-[#3d2b1a]"
            }`}
          >
            .*
          </button>
        </div>
        <span className="shrink-0 min-w-[40px] text-center text-xs text-[#9a7a58]">
          {findMatches.length > 0
            ? `${findMatchIdx + 1}/${findMatches.length}`
            : findQuery ? "0 个" : ""}
        </span>
        <button
          onClick={onFindPrev}
          disabled={!findMatches.length}
          className="rounded px-2 py-1 text-[#7c5038] hover:bg-[#f0ead8] disabled:opacity-30 text-sm"
        >
          ↑
        </button>
        <button
          onClick={onFindNext}
          disabled={!findMatches.length}
          className="rounded px-2 py-1 text-[#7c5038] hover:bg-[#f0ead8] disabled:opacity-30 text-sm"
        >
          ↓
        </button>
        <button
          onClick={onClose}
          className="rounded px-2 py-1 text-[#9a7a58] hover:text-[#7c5038] text-sm"
        >
          ✕
        </button>
      </div>

      {/* Replace row */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center rounded-xl border border-[#e0d4c0] bg-[#f0ead8] px-3 py-1.5">
          <input
            type="text"
            value={replaceQuery}
            onChange={(e) => onReplaceChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onReplace(); }}
            placeholder="替换为…"
            className="flex-1 bg-transparent text-sm text-[#3d2b1a] outline-none placeholder:text-[#c0a078]"
          />
        </div>
        <button
          onClick={onReplace}
          disabled={!findMatches.length}
          className="rounded-lg border border-[#e0d4c0] px-3 py-1.5 text-xs text-[#7c5038] transition hover:bg-[#f0ead8] disabled:opacity-30"
        >
          替换
        </button>
        <button
          onClick={onReplaceAll}
          disabled={!findMatches.length}
          className="rounded-lg border border-[#e0d4c0] px-3 py-1.5 text-xs text-[#7c5038] transition hover:bg-[#f0ead8] disabled:opacity-30"
        >
          全替换
        </button>
      </div>
    </div>
  );
}
