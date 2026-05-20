"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AdvisorPanel from "../components/AdvisorPanel";

// ── Types ──────────────────────────────────────────────────────────────────

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
  outline: string;
  aiInstruction: string;
  createdAt: string;
  updatedAt: string;
};

type Inspiration = {
  id: string;
  content: string;
  createdAt: string;
};

type SaveStatus = "idle" | "writing" | "saving" | "saved";

// ── Storage helpers ────────────────────────────────────────────────────────

function ts() {
  return new Date().toISOString();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem("books");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadChapters(): Chapter[] {
  try {
    const raw = localStorage.getItem("chapters");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistBooks(b: Book[]) {
  localStorage.setItem("books", JSON.stringify(b));
}

function persistChapters(c: Chapter[]) {
  localStorage.setItem("chapters", JSON.stringify(c));
}

// ── Migration + bootstrap ──────────────────────────────────────────────────

function bootstrap(urlBookId: string): {
  books: Book[];
  chapters: Chapter[];
  activeBookId: string;
} {
  let books = loadBooks();
  let chapters = loadChapters();

  if (books.length === 0) {
    const defaultBook: Book = {
      id: crypto.randomUUID(),
      title: "靡音",
      createdAt: ts(),
      updatedAt: ts(),
    };
    books = [defaultBook];
    persistBooks(books);
  }

  const defaultBookId = books[0].id;

  let migrated = false;
  chapters = chapters.map((c) => {
    const needsBookId = !c.bookId;
    const needsOutline = c.outline === undefined;
    const needsAiInstruction = c.aiInstruction === undefined;
    if (needsBookId || needsOutline || needsAiInstruction) {
      migrated = true;
      return {
        ...c,
        bookId: c.bookId || defaultBookId,
        outline: c.outline ?? "",
        aiInstruction: c.aiInstruction ?? "",
      };
    }
    return c;
  });
  if (migrated) persistChapters(chapters);

  const targetBookId =
    urlBookId && books.find((b) => b.id === urlBookId)
      ? urlBookId
      : defaultBookId;

  const bookChapters = chapters.filter((c) => c.bookId === targetBookId);
  if (bookChapters.length === 0) {
    const first: Chapter = {
      id: crypto.randomUUID(),
      bookId: targetBookId,
      title: "第一章",
      content: "",
      outline: "",
      aiInstruction: "",
      createdAt: ts(),
      updatedAt: ts(),
    };
    chapters = [...chapters, first];
    persistChapters(chapters);
  }

  return { books, chapters, activeBookId: targetBookId };
}

// ── Component ──────────────────────────────────────────────────────────────

export default function WritePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeBookId, setActiveBookId] = useState<string>("");
  const [activeChapterId, setActiveChapterId] = useState<string>("");
  const [quickNote, setQuickNote] = useState("");
  const [noteSavedMessage, setNoteSavedMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [savedTime, setSavedTime] = useState("");
  const [ready, setReady] = useState(false);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [aiDraft, setAiDraft] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlBookId = params.get("bookId") ?? "";
    const { books: b, chapters: c, activeBookId: bid } = bootstrap(urlBookId);
    setBooks(b);
    setChapters(c);
    setActiveBookId(bid);
    const bookChapters = c.filter((ch) => ch.bookId === bid);
    setActiveChapterId(bookChapters[0]?.id ?? "");

    try {
      const raw = localStorage.getItem("ai-model-settings");
      if (raw) {
        const ms = JSON.parse(raw) as {
          baseUrl?: string;
          apiKey?: string;
          defaultModel?: string;
          modelsText?: string;
        };
        const lines = (ms.modelsText ?? "")
          .split("\n")
          .map((l: string) => l.trim())
          .filter(Boolean);
        const def = ms.defaultModel?.trim() ?? "";
        // 默认模型始终排第一，可选模型列表去重追加在后面
        const opts = def
          ? [def, ...lines.filter((l) => l !== def)]
          : lines;
        setModelOptions(opts);
        setSelectedModel(opts[0] ?? "");
      }
    } catch {}

    setReady(true);
  }, []);

  const activeBook = books.find((b) => b.id === activeBookId) ?? null;
  const bookChapters = chapters.filter((c) => c.bookId === activeBookId);
  const activeChapter = chapters.find((c) => c.id === activeChapterId) ?? null;

  // ── Save ──────────────────────────────────────────────────────────────

  const performSave = useCallback((updatedChapters: Chapter[]) => {
    setSaveStatus("saving");
    setTimeout(() => {
      persistChapters(updatedChapters);
      setSavedTime(formatTime(ts()));
      setSaveStatus("saved");
    }, 400);
  }, []);

  const scheduleAutoSave = useCallback(
    (updatedChapters: Chapter[]) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(
        () => performSave(updatedChapters),
        5000,
      );
    },
    [performSave],
  );

  function updateActiveChapter(
    patch: Partial<
      Pick<Chapter, "title" | "content" | "outline" | "aiInstruction">
    >,
  ) {
    const updated = chapters.map((c) =>
      c.id === activeChapterId ? { ...c, ...patch, updatedAt: ts() } : c,
    );
    setChapters(updated);
    setSaveStatus("writing");
    scheduleAutoSave(updated);
    return updated;
  }

  function handleSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    performSave(chapters);
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
    };
  }, []);

  // ── Chapter actions ───────────────────────────────────────────────────

  function handleSwitchChapter(id: string) {
    if (id === activeChapterId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    persistChapters(chapters);
    setActiveChapterId(id);
    setSaveStatus("idle");
  }

  function handleAddChapter() {
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      bookId: activeBookId,
      title: "新章节",
      content: "",
      outline: "",
      aiInstruction: "",
      createdAt: ts(),
      updatedAt: ts(),
    };
    const updated = [...chapters, newChapter];
    setChapters(updated);
    setActiveChapterId(newChapter.id);
    persistChapters(updated);
  }

  // ── Quick inspiration note ────────────────────────────────────────────

  function saveQuickNote() {
    if (!quickNote.trim()) return;
    const saved = localStorage.getItem("inspirations");
    const old: Inspiration[] = saved ? JSON.parse(saved) : [];
    const entry: Inspiration = {
      id: crypto.randomUUID(),
      content: quickNote.trim(),
      createdAt: new Date().toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    localStorage.setItem("inspirations", JSON.stringify([entry, ...old]));
    setQuickNote("");
    setNoteSavedMessage("已贴到灵感墙");
    window.setTimeout(() => setNoteSavedMessage(""), 1800);
  }

  // ── AI 扩写 ───────────────────────────────────────────────────────────

  async function handleAIWrite() {
    if (aiStreaming) {
      aiAbortRef.current?.abort();
      return;
    }

    let ms: { baseUrl?: string; apiKey?: string; defaultModel?: string } = {};
    try {
      const raw = localStorage.getItem("ai-model-settings");
      if (raw) ms = JSON.parse(raw);
    } catch {}

    const baseUrl = (ms.baseUrl ?? "").replace(/\/$/, "") || "https://api.openai.com";
    const apiKey = ms.apiKey ?? "";

    // Build system prompt from stored data
    let dna = "";
    let soul = "";
    let characters: Record<string, string>[] = [];
    try {
      const r = localStorage.getItem("writing-dna");
      if (r) {
        const d = JSON.parse(r);
        dna = [
          d.languageStyle && `语言风格：${d.languageStyle}`,
          d.preferences && `写作偏好：${d.preferences}`,
          d.taboos && `禁忌：${d.taboos}`,
        ].filter(Boolean).join("\n");
      }
    } catch {}
    try {
      const r = localStorage.getItem(`book-soul-${activeBookId}`);
      if (r) {
        const s = JSON.parse(r);
        soul = [
          s.tone && `基调：${s.tone}`,
          s.relationship && `主角关系：${s.relationship}`,
          s.worldRules && `世界观：${s.worldRules}`,
          s.mustNotBreak && `不能破坏：${s.mustNotBreak}`,
        ].filter(Boolean).join("\n");
      }
    } catch {}
    try {
      const r = localStorage.getItem("book-characters");
      if (r) {
        const all = JSON.parse(r);
        characters = all.filter((c: Record<string, string>) => c.bookId === activeBookId);
      }
    } catch {}

    const charBlock = characters.length > 0
      ? characters.map((c) => `${c.role ? `[${c.role}] ` : ""}${c.name}${c.alias ? `（${c.alias}）` : ""}${c.personality ? `：${c.personality}` : ""}`).join("\n")
      : "";

    let systemPrompt = "你是一位专业的中文小说写作助手，根据作者的风格设定和章节要求续写或扩写正文。直接输出正文内容，不要加标题或解释。";
    if (dna) systemPrompt += `\n\n【写作风格】\n${dna}`;
    if (soul) systemPrompt += `\n\n【书籍设定】\n${soul}`;
    if (charBlock) systemPrompt += `\n\n【主要角色】\n${charBlock}`;

    const chapter = activeChapter;
    const userParts: string[] = [];
    if (chapter?.outline) userParts.push(`本章大纲：${chapter.outline}`);
    if (chapter?.content) userParts.push(`已有正文（请在此基础上续写）：\n${chapter.content}`);
    if (chapter?.aiInstruction) userParts.push(`特别要求：${chapter.aiInstruction}`);
    if (userParts.length === 0) userParts.push("请开始写这一章的正文。");

    setAiDraft("");
    setAiStreaming(true);
    const abort = new AbortController();
    aiAbortRef.current = abort;
    let accumulated = "";

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        signal: abort.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: selectedModel || ms.defaultModel || "",
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userParts.join("\n\n") },
          ],
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("no reader");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const json = t.slice(5).trim();
          if (json === "[DONE]") break;
          try {
            const delta = JSON.parse(json).choices?.[0]?.delta?.content ?? "";
            if (delta) { accumulated += delta; setAiDraft(accumulated); }
          } catch {}
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        setAiDraft("（请求出错，请检查模型设置）");
      }
    } finally {
      setAiStreaming(false);
    }
  }

  function handleAppendDraft() {
    if (!aiDraft.trim()) return;
    const sep = content.trim() ? "\n\n" : "";
    updateActiveChapter({ content: content + sep + aiDraft });
    setAiDraft("");
  }

  // ── Counts ────────────────────────────────────────────────────────────

  const content = activeChapter?.content ?? "";
  const wordCount = content.replace(/\s/g, "").length;
  const characterCount = content.length;
  const paragraphCount = content.split("\n").filter(Boolean).length;

  function statusLabel() {
    if (saveStatus === "writing") return "正在写作";
    if (saveStatus === "saving") return "自动保存中…";
    if (saveStatus === "saved") return `已自动保存 ${savedTime}`;
    return "";
  }

  if (!ready) return null;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <main className="flex h-screen flex-col bg-[#f8f0df] text-[#4f3524]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#e0c9a5] bg-[#fff8eb]/90 px-8 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="rounded-full border border-[#d8b98f] px-4 py-1.5 text-sm text-[#8a6a4d] transition hover:bg-white"
          >
            ← 回到小屋
          </Link>

          <div className="flex items-center gap-2">
            {activeBook && (
              <span className="text-sm text-[#a37a50]">{activeBook.title}</span>
            )}
            {activeBook && <span className="text-[#d8b98f]">/</span>}
            <input
              type="text"
              value={activeChapter?.title ?? ""}
              onChange={(e) => updateActiveChapter({ title: e.target.value })}
              placeholder="章节标题"
              className="w-56 bg-transparent text-xl font-semibold text-[#4f3524] outline-none placeholder:text-[#c7a984]"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {statusLabel() && (
            <span
              className={`text-sm transition-opacity ${
                saveStatus === "saving"
                  ? "animate-pulse text-[#c4a05a]"
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
        {/* Left sidebar — chapters */}
        <aside className="flex flex-col border-r border-[#e0c9a5] bg-[#fff8eb]/70 p-5">
          <p className="mb-4 text-sm font-medium text-[#9b744d]">章节</p>

          <div className="flex-1 space-y-1.5 overflow-y-auto">
            {bookChapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => handleSwitchChapter(ch.id)}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${
                  ch.id === activeChapterId
                    ? "bg-white text-[#4f3524] shadow-sm"
                    : "text-[#9b744d] hover:bg-white/70"
                }`}
              >
                <span className="block truncate">
                  {ch.title || "未命名章节"}
                </span>
                <span className="mt-0.5 block text-xs text-[#c7a984]">
                  {ch.content.replace(/\s/g, "").length} 字
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={handleAddChapter}
            className="mt-4 w-full rounded-xl border border-dashed border-[#d8b98f] px-4 py-2.5 text-sm text-[#9b744d] transition hover:bg-white/70"
          >
            + 新章节
          </button>

          <Link
            href={`/book-soul?bookId=${activeBookId}`}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-[#9b744d] transition hover:bg-white/70"
          >
            <span>🪬</span>
            <span>书籍灵魂卡</span>
          </Link>
        </aside>

        {/* Main editor + advisor */}
        <section className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto px-12 py-10">
            <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-[#ead8b8] bg-[#fffaf0] p-8 shadow-sm">
              <textarea
                value={content}
                onChange={(e) =>
                  updateActiveChapter({ content: e.target.value })
                }
                className="min-h-[60vh] w-full resize-none bg-transparent text-lg leading-9 text-[#4f3524] outline-none placeholder:text-[#c7a984]"
                placeholder="从这里开始写吧。可以是一句话，一个场景，或者今天突然亮起来的那一幕……"
              />
            </div>
          </div>

          {/* Advisor toggle */}
          <div className="flex justify-center border-t border-[#e0c9a5] bg-[#fff8eb]/60 py-2">
            <button
              onClick={() => setAdvisorOpen((o) => !o)}
              className="rounded-full border border-[#d8b98f] bg-[#fff8eb] px-6 py-1.5 text-sm text-[#6e4b2d] shadow-sm transition hover:bg-white"
            >
              {advisorOpen ? "收起军师 ↓" : "🎯 写作军师 ↑"}
            </button>
          </div>

          {advisorOpen && (
            <div className="h-96 shrink-0 border-t border-[#e0c9a5]">
              <AdvisorPanel
                bookId={activeBookId}
                bookTitle={activeBook?.title ?? ""}
                chapters={bookChapters}
                activeChapterId={activeChapterId}
              />
            </div>
          )}
        </section>

        {/* Right sidebar */}
        <aside className="flex flex-col gap-5 overflow-y-auto border-l border-[#e0c9a5] bg-[#fff8eb]/70 p-5">
          <section>
            <p className="mb-4 text-sm font-medium text-[#9b744d]">速记灵感</p>
            <div className="rounded-2xl border border-[#d7bd83] bg-[#fff2b8] p-4 shadow-sm">
              <textarea
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                className="min-h-24 w-full resize-none bg-transparent text-sm leading-6 text-[#4f3524] outline-none placeholder:text-[#a8874f]"
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
                <p className="mt-3 text-xs text-[#7c5a2d]">
                  {noteSavedMessage}
                </p>
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
            <p className="mb-4 text-sm font-medium text-[#9b744d]">
              AI 扩写准备
            </p>

            <div className="space-y-3">
              <div className="rounded-2xl border border-[#e0c9a5] bg-white/70 p-4">
                <label className="mb-2 block text-xs font-medium text-[#9b744d]">
                  本章大纲
                </label>
                <textarea
                  rows={4}
                  value={activeChapter?.outline ?? ""}
                  onChange={(e) =>
                    updateActiveChapter({ outline: e.target.value })
                  }
                  className="w-full resize-none bg-transparent text-sm leading-6 text-[#4f3524] outline-none placeholder:text-[#c7a984]"
                  placeholder="这一章要写什么？几个关键节拍或场景……"
                />
              </div>

              <div className="rounded-2xl border border-[#e0c9a5] bg-white/70 p-4">
                <label className="mb-2 block text-xs font-medium text-[#9b744d]">
                  本次指令
                </label>
                <textarea
                  rows={3}
                  value={activeChapter?.aiInstruction ?? ""}
                  onChange={(e) =>
                    updateActiveChapter({ aiInstruction: e.target.value })
                  }
                  className="w-full resize-none bg-transparent text-sm leading-6 text-[#4f3524] outline-none placeholder:text-[#c7a984]"
                  placeholder="对 AI 的特别要求，比如：重点写眼神交流，不要推进剧情……"
                />
              </div>
            </div>

            {modelOptions.length > 0 && (
              <div className="mt-3 rounded-2xl border border-[#e0c9a5] bg-white/70 p-4">
                <label className="mb-2 block text-xs font-medium text-[#9b744d]">
                  本次模型
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-xl border border-[#e0c9a5] bg-[#fff8eb] px-3 py-2 text-sm text-[#4f3524] outline-none"
                >
                  {modelOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleAIWrite}
              className={`mt-4 w-full rounded-xl px-4 py-3 text-sm text-amber-50 transition ${
                aiStreaming
                  ? "bg-[#9b744d] hover:bg-[#7a5c38]"
                  : "bg-[#6e4b2d] hover:bg-[#58391f]"
              }`}
            >
              {aiStreaming ? "⏹ 停止生成" : "✍️ AI 扩写"}
            </button>

            {aiDraft && (
              <div className="mt-3 rounded-2xl border border-[#e0c9a5] bg-[#fffaf0] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#9b744d]">
                    草稿 · {aiDraft.replace(/\s/g, "").length} 字
                  </span>
                  <button
                    onClick={() => setAiDraft("")}
                    className="text-xs text-[#c7a984] hover:text-[#9b744d] transition"
                  >
                    清空
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-[#4f3524]">
                  {aiDraft}
                  {aiStreaming && <span className="animate-pulse text-[#9b744d]">▍</span>}
                </p>
                {!aiStreaming && (
                  <button
                    onClick={handleAppendDraft}
                    className="mt-3 w-full rounded-xl bg-[#6e4b2d] px-4 py-2 text-xs text-amber-50 transition hover:bg-[#58391f]"
                  >
                    追加到正文 →
                  </button>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>

      {/* Footer */}
      <footer className="flex items-center gap-6 border-t border-[#e0c9a5] bg-[#fff8eb]/90 px-8 py-3 text-xs text-[#9b744d]">
        <span>{wordCount} 字</span>
        <span>{characterCount} 字符</span>
        <span>{paragraphCount} 段</span>
        <span className="ml-auto text-[#c7a984]">
          共 {bookChapters.length} 章
        </span>
      </footer>
    </main>
  );
}
