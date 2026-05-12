"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type SaveStatus = "idle" | "writing" | "saving" | "saved";

type Inspiration = {
  id: string;
  content: string;
  createdAt: string;
};

function formatTime(date: Date) {
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WritePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [quickNote, setQuickNote] = useState("");
  const [noteSavedMessage, setNoteSavedMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [savedTime, setSavedTime] = useState("");

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const savedTitle = localStorage.getItem("draft-title");
    const savedContent = localStorage.getItem("draft-content");
    if (savedTitle) setTitle(savedTitle);
    if (savedContent) setContent(savedContent);
  }, []);

  const performSave = useCallback(
    (currentTitle: string, currentContent: string) => {
      if (!currentContent.trim() && !currentTitle.trim()) return;
      setSaveStatus("saving");
      setTimeout(() => {
        localStorage.setItem("draft-title", currentTitle);
        localStorage.setItem("draft-content", currentContent);
        const now = new Date();
        setSavedTime(formatTime(now));
        setSaveStatus("saved");
      }, 400);
    },
    []
  );

  const scheduleAutoSave = useCallback(
    (nextTitle: string, nextContent: string) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        performSave(nextTitle, nextContent);
      }, 5000);
    },
    [performSave]
  );

  function handleTitleChange(value: string) {
    setTitle(value);
    triggerWritingStatus();
    scheduleAutoSave(value, content);
  }

  function handleContentChange(value: string) {
    setContent(value);
    triggerWritingStatus();
    scheduleAutoSave(title, value);
  }

  function triggerWritingStatus() {
    setSaveStatus("writing");
    if (writingTimer.current) clearTimeout(writingTimer.current);
    writingTimer.current = setTimeout(() => {
      setSaveStatus((prev) => (prev === "writing" ? "writing" : prev));
    }, 300);
  }

  function handleSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    performSave(title, content);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      if (writingTimer.current) clearTimeout(writingTimer.current);
    };
  }, []);

  function saveQuickNote() {
    if (!quickNote.trim()) return;
    const saved = localStorage.getItem("inspirations");
    const oldInspirations: Inspiration[] = saved ? JSON.parse(saved) : [];
    const now = new Date();
    const newInspiration: Inspiration = {
      id: crypto.randomUUID(),
      content: quickNote.trim(),
      createdAt: now.toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    localStorage.setItem(
      "inspirations",
      JSON.stringify([newInspiration, ...oldInspirations])
    );
    setQuickNote("");
    setNoteSavedMessage("已贴到灵感墙");
    window.setTimeout(() => setNoteSavedMessage(""), 1800);
  }

  const characterCount = content.length;
  const chineseWordCount = content.replace(/\s/g, "").length;
  const paragraphCount = content.split("\n").filter(Boolean).length;

  function statusLabel() {
    if (saveStatus === "writing") return "正在写作";
    if (saveStatus === "saving") return "自动保存中…";
    if (saveStatus === "saved") return `已自动保存 ${savedTime}`;
    return "";
  }

  return (
    <main className="flex h-screen flex-col bg-[#f8f0df] text-[#4f3524]">
      <header className="flex items-center justify-between border-b border-[#e0c9a5] bg-[#fff8eb]/90 px-8 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="rounded-full border border-[#d8b98f] px-4 py-1.5 text-sm text-[#8a6a4d] transition hover:bg-white"
          >
            ← 回到小屋
          </Link>

          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="未命名章节"
            className="w-80 bg-transparent text-xl font-semibold text-[#4f3524] outline-none placeholder:text-[#c7a984]"
          />
        </div>

        <div className="flex items-center gap-4">
          {statusLabel() && (
            <span
              className={`text-sm transition-opacity ${
                saveStatus === "saving"
                  ? "text-[#c4a05a] animate-pulse"
                  : "text-[#9b744d]"
              }`}
            >
              {statusLabel()}
            </span>
          )}

          <button
            onClick={handleSave}
            className="rounded-full bg-[#6e4b2d] px-5 py-2 text-sm text-amber-50 transition hover:bg-[#58391f]"
          >
            保存
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[220px_1fr_280px] overflow-hidden">
        <aside className="border-r border-[#e0c9a5] bg-[#fff8eb]/70 p-5">
          <p className="mb-4 text-sm font-medium text-[#9b744d]">章节</p>
          <div className="space-y-2">
            <button className="w-full rounded-xl bg-white px-4 py-3 text-left text-sm text-[#4f3524] shadow-sm">
              当前草稿
            </button>
            <button className="w-full rounded-xl px-4 py-3 text-left text-sm text-[#9b744d] transition hover:bg-white/70">
              + 新章节
            </button>
          </div>
        </aside>

        <section className="overflow-auto px-12 py-10">
          <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-[#ead8b8] bg-[#fffaf0] p-8 shadow-sm">
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="min-h-[68vh] w-full resize-none bg-transparent text-lg leading-9 text-[#4f3524] outline-none placeholder:text-[#c7a984]"
              placeholder="从这里开始写吧。可以是一句话，一个场景，或者今天突然亮起来的那一幕……"
            />
          </div>
        </section>

        <aside className="space-y-5 border-l border-[#e0c9a5] bg-[#fff8eb]/70 p-5">
          <section>
            <p className="mb-4 text-sm font-medium text-[#9b744d]">速记灵感</p>
            <div className="rounded-2xl border border-[#d7bd83] bg-[#fff2b8] p-4 shadow-sm">
              <textarea
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                className="min-h-32 w-full resize-none bg-transparent text-sm leading-6 text-[#4f3524] outline-none placeholder:text-[#a8874f]"
                placeholder="突然想到的台词、伏笔、梗、画面……先丢这里。"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-[#9b744d]">
                  {quickNote.trim().length} 字
                </span>
                <button
                  onClick={saveQuickNote}
                  className="rounded-full bg-[#6e4b2d] px-4 py-1.5 text-xs text-amber-50 transition hover:bg-[#58391f]"
                >
                  贴到灵感墙
                </button>
              </div>
              {noteSavedMessage && (
                <p className="mt-3 text-xs text-[#7c5a2d]">{noteSavedMessage}</p>
              )}
            </div>
            <Link
              href="/inspirations"
              className="mt-3 inline-block text-xs text-[#9b744d] underline underline-offset-4"
            >
              查看全部灵感 →
            </Link>
          </section>

          <section>
            <p className="mb-4 text-sm font-medium text-[#9b744d]">AI 搭子</p>
            <div className="rounded-2xl border border-[#ead8b8] bg-white/70 p-4 text-sm leading-6 text-[#806044]">
              这里以后会放 AI 写作助手。它会读取你的写作 DNA、书籍灵魂卡和当前章节上下文。
            </div>
            <button className="mt-4 w-full rounded-xl bg-[#6e4b2d] px-4 py-3 text-sm text-amber-50 opacity-60">
              之后再接入 AI
            </button>
          </section>
        </aside>
      </div>

      <footer className="flex items-center gap-6 border-t border-[#e0c9a5] bg-[#fff8eb]/90 px-8 py-3 text-xs text-[#9b744d]">
        <span>{chineseWordCount} 字</span>
        <span>{characterCount} 字符</span>
        <span>{paragraphCount} 段</span>
      </footer>
    </main>
  );
}
