"use client";

import Link from "next/link";

type Props = {
  value: string;
  savedMessage: string;
  onChange: (v: string) => void;
  onSave: () => void;
};

export default function QuickNoteBox({ value, savedMessage, onChange, onSave }: Props) {
  return (
    <section>
      <p className="mb-4 text-sm font-medium text-[#c8a878]">速记灵感</p>
      <div className="rounded-2xl border border-[#5a4010] bg-[#1e1500] p-4 shadow-sm">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-24 w-full resize-none bg-transparent text-sm leading-6 text-[#e8d5b7] outline-none placeholder:text-[#5a3820]"
          placeholder="突然想到的台词、伏笔、梗、画面……先丢这里。"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-[#8a6040]">{value.trim().length} 字</span>
          <button
            onClick={onSave}
            className="rounded-full bg-[#6e4b2d] px-4 py-1.5 text-xs text-amber-50 transition hover:bg-[#58391f]"
          >
            贴到灵感墙
          </button>
        </div>
        {savedMessage && (
          <p className="mt-3 text-xs text-[#c8a878]">{savedMessage}</p>
        )}
      </div>
      <Link
        href="/inspirations"
        className="mt-3 inline-block text-xs text-[#8a6040] underline underline-offset-4"
      >
        查看全部灵感 →
      </Link>
    </section>
  );
}
