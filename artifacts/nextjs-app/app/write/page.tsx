"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  buildSystemPrompt,
  buildUserMessage,
  type BookSoul,
  type AdultSettings,
  type WritingDNA,
  type Inspiration,
} from "../lib/buildPrompt";

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

type ModelSettings = {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  modelsText: string;
};

type SaveStatus = "idle" | "writing" | "saving" | "saved";
type MobileTab = "write" | "chapters" | "ai";

// ── Storage helpers ────────────────────────────────────────────────────────

function ts() { return new Date().toISOString(); }

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function loadBooks(): Book[] {
  try { const r = localStorage.getItem("books"); return r ? JSON.parse(r) : []; } catch { return []; }
}
function loadChapters(): Chapter[] {
  try { const r = localStorage.getItem("chapters"); return r ? JSON.parse(r) : []; } catch { return []; }
}
function persistBooks(b: Book[]) { localStorage.setItem("books", JSON.stringify(b)); }
function persistChapters(c: Chapter[]) { localStorage.setItem("chapters", JSON.stringify(c)); }

function safeParse<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}

// ── Bootstrap ──────────────────────────────────────────────────────────────

function bootstrap(urlBookId: string) {
  let books = loadBooks();
  let chapters = loadChapters();

  if (books.length === 0) {
    const b: Book = { id: crypto.randomUUID(), title: "靡音", createdAt: ts(), updatedAt: ts() };
    books = [b];
    persistBooks(books);
  }

  const defaultBookId = books[0].id;
  let migrated = false;
  chapters = chapters.map((c) => {
    if (!c.bookId || c.outline === undefined || c.aiInstruction === undefined) {
      migrated = true;
      return { ...c, bookId: c.bookId || defaultBookId, outline: c.outline ?? "", aiInstruction: c.aiInstruction ?? "" };
    }
    return c;
  });
  if (migrated) persistChapters(chapters);

  const activeBookId = urlBookId && books.find((b) => b.id === urlBookId) ? urlBookId : defaultBookId;

  if (!chapters.some((c) => c.bookId === activeBookId)) {
    const first: Chapter = { id: crypto.randomUUID(), bookId: activeBookId, title: "第一章", content: "", outline: "", aiInstruction: "", createdAt: ts(), updatedAt: ts() };
    chapters = [...chapters, first];
    persistChapters(chapters);
  }

  return { books, chapters, activeBookId };
}

// ── Component ──────────────────────────────────────────────────────────────

export default function WritePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeBookId, setActiveBookId] = useState("");
  const [activeChapterId, setActiveChapterId] = useState("");
  const [quickNote, setQuickNote] = useState("");
  const [noteSavedMsg, setNoteSavedMsg] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [savedTime, setSavedTime] = useState("");
  const [ready, setReady] = useState(false);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("write");

  // AI state
  const [aiDraft, setAiDraft] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiError, setAiError] = useState("");

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const { books: b, chapters: c, activeBookId: bid } = bootstrap(params.get("bookId") ?? "");
    setBooks(b);
    setChapters(c);
    setActiveBookId(bid);
    setActiveChapterId(c.filter((ch) => ch.bookId === bid)[0]?.id ?? "");

    try {
      const raw = localStorage.getItem("ai-model-settings");
      if (raw) {
        const ms = JSON.parse(raw) as ModelSettings;
        const lines = (ms.modelsText ?? "").split("\n").map((l: string) => l.trim()).filter(Boolean);
        const opts = lines.length > 0 ? lines : ms.defaultModel ? [ms.defaultModel] : [];
        setModelOptions(opts);
        setSelectedModel(ms.defaultModel ?? opts[0] ?? "");
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
      try {
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const totalWords = updatedChapters.reduce((sum, c) => sum + c.content.replace(/\s/g, "").length, 0);
        const cal = JSON.parse(localStorage.getItem("writing-calendar") || "{}");
        cal[todayStr] = { ...(cal[todayStr] ?? { checkedIn: false }), wordCount: totalWords };
        localStorage.setItem("writing-calendar", JSON.stringify(cal));
      } catch {}
      setSavedTime(formatTime(ts()));
      setSaveStatus("saved");
    }, 400);
  }, []);

  const scheduleAutoSave = useCallback((updatedChapters: Chapter[]) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => performSave(updatedChapters), 5000);
  }, [performSave]);

  function updateActiveChapter(patch: Partial<Pick<Chapter, "title" | "content" | "outline" | "aiInstruction">>) {
    const updated = chapters.map((c) => c.id === activeChapterId ? { ...c, ...patch, updatedAt: ts() } : c);
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
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); }, []);

  // ── Chapter actions ───────────────────────────────────────────────────

  function handleSwitchChapter(id: string) {
    if (id === activeChapterId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    persistChapters(chapters);
    setActiveChapterId(id);
    setSaveStatus("idle");
  }

  function handleAddChapter() {
    const c: Chapter = { id: crypto.randomUUID(), bookId: activeBookId, title: "新章节", content: "", outline: "", aiInstruction: "", createdAt: ts(), updatedAt: ts() };
    const updated = [...chapters, c];
    setChapters(updated);
    setActiveChapterId(c.id);
    persistChapters(updated);
  }

  function saveQuickNote() {
    if (!quickNote.trim()) return;
    const old: Inspiration[] = safeParse("inspirations", []);
    const entry: Inspiration = { id: crypto.randomUUID(), content: quickNote.trim(), createdAt: new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) };
    localStorage.setItem("inspirations", JSON.stringify([entry, ...old]));
    setQuickNote("");
    setNoteSavedMsg("已贴到灵感墙");
    window.setTimeout(() => setNoteSavedMsg(""), 1800);
  }

  // ── AI ────────────────────────────────────────────────────────────────

  async function handleAIWrite() {
    const ms = safeParse<ModelSettings | null>("ai-model-settings", null);
    if (!ms?.baseUrl || !ms?.apiKey) { setAiError("请先在模型设置中配置 API URL 和密钥"); return; }
    if (!activeChapter) return;

    const soul = safeParse<BookSoul[]>("book-souls", []).find((s) => s.bookId === activeBookId);
    const systemPrompt = buildSystemPrompt({
      bookTitle: activeBook?.title ?? "",
      writingDNA: safeParse<WritingDNA>("writing-dna", {}),
      soul,
      adultSettings: safeParse<AdultSettings | null>("adult-content-settings", null),
      inspirations: safeParse<Inspiration[]>("inspirations", []),
    });
    const userMessage = buildUserMessage({ title: activeChapter.title, content: activeChapter.content, outline: activeChapter.outline, aiInstruction: activeChapter.aiInstruction });

    setAiDraft(""); setAiError(""); setIsStreaming(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${ms.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ms.apiKey}` },
        body: JSON.stringify({ model: selectedModel || ms.defaultModel, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }], stream: true }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`请求失败：${res.status}`);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break outer;
          try { const t = JSON.parse(payload).choices?.[0]?.delta?.content; if (t) setAiDraft((p) => p + t); } catch {}
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") setAiError(err.message || "请求失败，请检查配置");
    } finally { setIsStreaming(false); }
  }

  function handleAppendDraft() {
    if (!aiDraft) return;
    const cur = activeChapter?.content ?? "";
    const updated = updateActiveChapter({ content: cur + (cur ? "\n\n" : "") + aiDraft });
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    performSave(updated);
    setAiDraft("");
  }

  const content = activeChapter?.content ?? "";
  const wordCount = content.replace(/\s/g, "").length;

  function statusLabel() {
    if (saveStatus === "writing") return "正在写作";
    if (saveStatus === "saving") return "保存中…";
    if (saveStatus === "saved") return `已保存 ${savedTime}`;
    return "";
  }

  if (!ready) return null;

  // ── Shared sub-sections ───────────────────────────────────────────────

  const ChapterList = (
    <div className="flex flex-col gap-2">
      {bookChapters.map((ch) => (
        <button key={ch.id} onClick={() => { handleSwitchChapter(ch.id); setMobileTab("write"); }}
          className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${ch.id === activeChapterId ? "bg-white text-[#4f3524] shadow-sm" : "text-[#9b744d] hover:bg-white/70"}`}>
          <span className="block truncate">{ch.title || "未命名章节"}</span>
          <span className="mt-0.5 block text-xs text-[#c7a984]">{ch.content.replace(/\s/g, "").length} 字</span>
        </button>
      ))}
      <button onClick={handleAddChapter} className="w-full rounded-xl border border-dashed border-[#d8b98f] px-4 py-2.5 text-sm text-[#9b744d] transition hover:bg-white/70">
        + 新章节
      </button>
      <Link href={`/book-soul?bookId=${activeBookId}`} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-[#9b744d] transition hover:bg-white/70">
        <span>🪬</span><span>书籍灵魂卡</span>
      </Link>
    </div>
  );

  const ModelSelect = modelOptions.length > 0 && (
    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
      className="w-full rounded-xl border border-[#e0c9a5] bg-[#fff8eb] px-3 py-2 text-sm text-[#4f3524] outline-none">
      {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
    </select>
  );

  const AIActionButtons = (
    <div className="flex gap-2">
      <Link href={`/prompt-preview?bookId=${activeBookId}&chapterId=${activeChapterId}${selectedModel ? `&model=${encodeURIComponent(selectedModel)}` : ""}`}
        className="flex-1 rounded-xl border border-[#d8b98f] px-3 py-2.5 text-center text-sm text-[#6e4b2d] transition hover:bg-white/70">
        预览 Prompt
      </Link>
      <button onClick={isStreaming ? () => abortRef.current?.abort() : handleAIWrite}
        className={`flex-1 rounded-xl px-3 py-2.5 text-sm text-amber-50 transition ${isStreaming ? "bg-[#9b744d] hover:bg-[#7a5a38]" : "bg-[#6e4b2d] hover:bg-[#58391f]"}`}>
        {isStreaming ? "停止生成" : "让 AI 续写"}
      </button>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <main className="flex h-[100dvh] flex-col bg-[#f8f0df] text-[#4f3524]">

      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-[#e0c9a5] bg-[#fff8eb]/90 px-4 py-3 pl-14 shadow-sm md:px-8 md:pl-8 md:py-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="hidden shrink-0 rounded-full border border-[#d8b98f] px-3 py-1 text-sm text-[#8a6a4d] transition hover:bg-white md:inline-flex">
            ← 回到小屋
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            {activeBook && <span className="hidden shrink-0 text-sm text-[#a37a50] md:inline">{activeBook.title}</span>}
            {activeBook && <span className="hidden text-[#d8b98f] md:inline">/</span>}
            <input type="text" value={activeChapter?.title ?? ""} onChange={(e) => updateActiveChapter({ title: e.target.value })}
              placeholder="章节标题"
              className="w-full min-w-0 bg-transparent text-base font-semibold text-[#4f3524] outline-none placeholder:text-[#c7a984] md:text-xl md:w-56" />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {statusLabel() && (
            <span className={`hidden text-sm md:inline ${saveStatus === "saving" ? "animate-pulse text-[#c4a05a]" : "text-[#9b744d]"}`}>
              {statusLabel()}
            </span>
          )}
          <button onClick={handleSave} className="rounded-full bg-[#6e4b2d] px-4 py-1.5 text-sm text-amber-50 transition hover:bg-[#58391f]">
            保存
          </button>
        </div>
      </header>

      {/* Mobile tab bar */}
      <div className="flex shrink-0 border-b border-[#e0c9a5] bg-[#fff8eb]/90 md:hidden">
        {(["write", "chapters", "ai"] as MobileTab[]).map((tab) => (
          <button key={tab} onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-sm transition ${mobileTab === tab ? "border-b-2 border-[#6e4b2d] font-medium text-[#4f3524]" : "text-[#9b744d]"}`}>
            {tab === "write" ? "✍️ 写作" : tab === "chapters" ? "📑 章节" : "🤖 AI"}
          </button>
        ))}
      </div>

      {/* ── Mobile layout ── */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">

        {/* Mobile: Write tab */}
        {mobileTab === "write" && (
          <div className="flex-1 overflow-auto px-4 py-5">
            <textarea value={content} onChange={(e) => updateActiveChapter({ content: e.target.value })}
              className="min-h-full w-full resize-none bg-transparent text-base leading-8 text-[#4f3524] outline-none placeholder:text-[#c7a984]"
              placeholder="从这里开始写吧……" />
          </div>
        )}

        {/* Mobile: Chapters tab */}
        {mobileTab === "chapters" && (
          <div className="flex-1 overflow-y-auto p-4">
            <p className="mb-3 text-sm font-medium text-[#9b744d]">章节</p>
            {ChapterList}
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-[#9b744d]">速记灵感</p>
              <div className="rounded-2xl border border-[#d7bd83] bg-[#fff2b8] p-4">
                <textarea value={quickNote} onChange={(e) => setQuickNote(e.target.value)} rows={4}
                  className="w-full resize-none bg-transparent text-sm leading-6 text-[#4f3524] outline-none placeholder:text-[#a8874f]"
                  placeholder="突然想到的台词、伏笔……先丢这里。" />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-[#9b744d]">{quickNote.trim().length} 字</span>
                  <button onClick={saveQuickNote} className="rounded-full bg-[#6e4b2d] px-3 py-1 text-xs text-amber-50">贴到灵感墙</button>
                </div>
                {noteSavedMsg && <p className="mt-2 text-xs text-[#7c5a2d]">{noteSavedMsg}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Mobile: AI tab */}
        {mobileTab === "ai" && (
          <div className="flex flex-1 flex-col overflow-hidden p-4 gap-3">
            {/* Compact controls */}
            <div className="shrink-0 space-y-2">
              <textarea rows={3} value={activeChapter?.outline ?? ""} onChange={(e) => updateActiveChapter({ outline: e.target.value })}
                className="w-full resize-none rounded-xl border border-[#e0c9a5] bg-white/70 px-3 py-2.5 text-sm leading-6 text-[#4f3524] outline-none placeholder:text-[#c7a984]"
                placeholder="本章大纲……" />
              <textarea rows={2} value={activeChapter?.aiInstruction ?? ""} onChange={(e) => updateActiveChapter({ aiInstruction: e.target.value })}
                className="w-full resize-none rounded-xl border border-[#e0c9a5] bg-white/70 px-3 py-2.5 text-sm leading-6 text-[#4f3524] outline-none placeholder:text-[#c7a984]"
                placeholder="本次指令……" />
              {ModelSelect}
              {AIActionButtons}
            </div>

            {/* AI draft — takes all remaining space */}
            {aiError && (
              <div className="shrink-0 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{aiError}</div>
            )}
            {(aiDraft || isStreaming) && (
              <div className="flex-1 overflow-auto rounded-2xl border border-[#e0c9a5] bg-white/80 p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[#4f3524]">
                  {aiDraft}
                  {isStreaming && <span className="animate-pulse text-[#9b744d]">▋</span>}
                </pre>
              </div>
            )}
            {aiDraft && !isStreaming && (
              <div className="flex shrink-0 gap-2">
                <button onClick={handleAppendDraft} className="flex-1 rounded-xl bg-[#6e4b2d] px-4 py-2.5 text-sm text-amber-50 transition hover:bg-[#58391f]">
                  追加到正文
                </button>
                <button onClick={() => setAiDraft("")} className="rounded-xl border border-[#d8b98f] px-4 py-2.5 text-sm text-[#9b744d] transition hover:bg-white/70">
                  清空
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden flex-1 overflow-hidden md:grid md:grid-cols-[220px_1fr_280px]">

        {/* Left sidebar */}
        <aside className="flex flex-col border-r border-[#e0c9a5] bg-[#fff8eb]/70 p-5 overflow-y-auto">
          <p className="mb-4 text-sm font-medium text-[#9b744d]">章节</p>
          <div className="flex-1">{ChapterList}</div>
        </aside>

        {/* Main editor */}
        <section className="overflow-auto px-12 py-10">
          <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-[#ead8b8] bg-[#fffaf0] p-8 shadow-sm">
            <textarea value={content} onChange={(e) => updateActiveChapter({ content: e.target.value })}
              className="min-h-[68vh] w-full resize-none bg-transparent text-lg leading-9 text-[#4f3524] outline-none placeholder:text-[#c7a984]"
              placeholder="从这里开始写吧。可以是一句话，一个场景，或者今天突然亮起来的那一幕……" />
          </div>
        </section>

        {/* Right sidebar */}
        <aside className="flex flex-col gap-5 overflow-y-auto border-l border-[#e0c9a5] bg-[#fff8eb]/70 p-5">
          {/* Quick note */}
          <section>
            <p className="mb-3 text-sm font-medium text-[#9b744d]">速记灵感</p>
            <div className="rounded-2xl border border-[#d7bd83] bg-[#fff2b8] p-4 shadow-sm">
              <textarea value={quickNote} onChange={(e) => setQuickNote(e.target.value)}
                className="min-h-20 w-full resize-none bg-transparent text-sm leading-6 text-[#4f3524] outline-none placeholder:text-[#a8874f]"
                placeholder="突然想到的台词、伏笔、梗……先丢这里。" />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-[#9b744d]">{quickNote.trim().length} 字</span>
                <button onClick={saveQuickNote} className="rounded-full bg-[#6e4b2d] px-4 py-1.5 text-xs text-amber-50 transition hover:bg-[#58391f]">贴到灵感墙</button>
              </div>
              {noteSavedMsg && <p className="mt-2 text-xs text-[#7c5a2d]">{noteSavedMsg}</p>}
            </div>
            <Link href="/inspirations" className="mt-2 inline-block text-xs text-[#9b744d] underline underline-offset-4">查看全部灵感 →</Link>
          </section>

          {/* AI section */}
          <section>
            <p className="mb-3 text-sm font-medium text-[#9b744d]">AI 扩写准备</p>
            <div className="space-y-3">
              <div className="rounded-2xl border border-[#e0c9a5] bg-white/70 p-4">
                <label className="mb-2 block text-xs font-medium text-[#9b744d]">本章大纲</label>
                <textarea rows={4} value={activeChapter?.outline ?? ""} onChange={(e) => updateActiveChapter({ outline: e.target.value })}
                  className="w-full resize-none bg-transparent text-sm leading-6 text-[#4f3524] outline-none placeholder:text-[#c7a984]"
                  placeholder="这一章要写什么……" />
              </div>
              <div className="rounded-2xl border border-[#e0c9a5] bg-white/70 p-4">
                <label className="mb-2 block text-xs font-medium text-[#9b744d]">本次指令</label>
                <textarea rows={3} value={activeChapter?.aiInstruction ?? ""} onChange={(e) => updateActiveChapter({ aiInstruction: e.target.value })}
                  className="w-full resize-none bg-transparent text-sm leading-6 text-[#4f3524] outline-none placeholder:text-[#c7a984]"
                  placeholder="对 AI 的特别要求……" />
              </div>
            </div>
            {modelOptions.length > 0 && (
              <div className="mt-3 rounded-2xl border border-[#e0c9a5] bg-white/70 p-4">
                <label className="mb-2 block text-xs font-medium text-[#9b744d]">本次模型</label>
                {ModelSelect}
              </div>
            )}
            <div className="mt-4">{AIActionButtons}</div>
          </section>

          {/* AI draft */}
          {(aiDraft || aiError || isStreaming) && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-[#9b744d]">AI 草稿</p>
                {aiDraft && <span className="text-xs text-[#c7a984]">{aiDraft.replace(/\s/g, "").length} 字</span>}
              </div>
              {aiError && <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{aiError}</div>}
              {(aiDraft || isStreaming) && (
                <div className="rounded-2xl border border-[#e0c9a5] bg-white/70 p-4">
                  <pre className="whitespace-pre-wrap text-sm leading-7 text-[#4f3524]">
                    {aiDraft}
                    {isStreaming && <span className="animate-pulse text-[#9b744d]">▋</span>}
                  </pre>
                </div>
              )}
              {aiDraft && !isStreaming && (
                <div className="mt-3 flex gap-2">
                  <button onClick={handleAppendDraft} className="flex-1 rounded-xl bg-[#6e4b2d] px-4 py-2 text-sm text-amber-50 transition hover:bg-[#58391f]">追加到正文</button>
                  <button onClick={() => setAiDraft("")} className="rounded-xl border border-[#d8b98f] px-4 py-2 text-sm text-[#9b744d] transition hover:bg-white/70">清空</button>
                </div>
              )}
            </section>
          )}
        </aside>
      </div>

      {/* Footer */}
      <footer className="flex shrink-0 items-center gap-4 border-t border-[#e0c9a5] bg-[#fff8eb]/90 px-4 py-2 text-xs text-[#9b744d] md:gap-6 md:px-8 md:py-3">
        <span>{wordCount} 字</span>
        <span>{content.length} 字符</span>
        <span>{content.split("\n").filter(Boolean).length} 段</span>
        <span className="ml-auto text-[#c7a984]">共 {bookChapters.length} 章</span>
      </footer>
    </main>
  );
}
