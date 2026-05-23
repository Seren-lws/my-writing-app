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
    <div className="shrink-0 border-b border-[#4c2c14] bg-[#261609] px-4 py-2 space-y-1.5">
      {/* Find row */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1.5 rounded-xl border border-[#6a4020] bg-[#311d0c] px-3 py-1.5">
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
            className="flex-1 bg-transparent text-sm text-[#f0e6d3] outline-none placeholder:text-[#5a3820]"
          />
          <button
            title="区分大小写"
            onClick={() => onToggleCaseSensitive(!findCaseSensitive)}
            className={`rounded px-1.5 py-0.5 text-xs font-mono transition ${
              findCaseSensitive ? "bg-[#6e4b2d] text-amber-50" : "text-[#8a6040] hover:text-[#c8a878]"
            }`}
          >
            Aa
          </button>
          <button
            title="正则表达式"
            onClick={() => onToggleRegex(!findUseRegex)}
            className={`rounded px-1.5 py-0.5 text-xs font-mono transition ${
              findUseRegex ? "bg-[#6e4b2d] text-amber-50" : "text-[#8a6040] hover:text-[#c8a878]"
            }`}
          >
            .*
          </button>
        </div>
        <span className="shrink-0 min-w-[40px] text-center text-xs text-[#8a6040]">
          {findMatches.length > 0
            ? `${findMatchIdx + 1}/${findMatches.length}`
            : findQuery ? "0 个" : ""}
        </span>
        <button
          onClick={onFindPrev}
          disabled={!findMatches.length}
          className="rounded px-2 py-1 text-[#c8a878] hover:bg-[#4c2c14] disabled:opacity-30 text-sm"
        >
          ↑
        </button>
        <button
          onClick={onFindNext}
          disabled={!findMatches.length}
          className="rounded px-2 py-1 text-[#c8a878] hover:bg-[#4c2c14] disabled:opacity-30 text-sm"
        >
          ↓
        </button>
        <button
          onClick={onClose}
          className="rounded px-2 py-1 text-[#8a6040] hover:text-[#c8a878] text-sm"
        >
          ✕
        </button>
      </div>

      {/* Replace row */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center rounded-xl border border-[#4c2c14] bg-[#311d0c] px-3 py-1.5">
          <input
            type="text"
            value={replaceQuery}
            onChange={(e) => onReplaceChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onReplace(); }}
            placeholder="替换为…"
            className="flex-1 bg-transparent text-sm text-[#f0e6d3] outline-none placeholder:text-[#5a3820]"
          />
        </div>
        <button
          onClick={onReplace}
          disabled={!findMatches.length}
          className="rounded-lg border border-[#6a4020] px-3 py-1.5 text-xs text-[#c8a878] transition hover:bg-[#311d0c] disabled:opacity-30"
        >
          替换
        </button>
        <button
          onClick={onReplaceAll}
          disabled={!findMatches.length}
          className="rounded-lg border border-[#6a4020] px-3 py-1.5 text-xs text-[#c8a878] transition hover:bg-[#311d0c] disabled:opacity-30"
        >
          全替换
        </button>
      </div>
    </div>
  );
}
