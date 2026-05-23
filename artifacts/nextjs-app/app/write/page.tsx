"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AdvisorPanel from "../components/AdvisorPanel";
import { normalizeBaseUrl, streamChat, chatCompletion } from "../lib/aiClient";
import ChapterSidebar from "./components/ChapterSidebar";
import FindReplaceBar from "./components/FindReplaceBar";
import QuickNoteBox from "./components/QuickNoteBox";
import AnalysisPanel from "./components/AnalysisPanel";
import { useBooksAndChapters } from "./hooks/useBooksAndChapters";
import { useAutoSave } from "./hooks/useAutoSave";
import { useFindReplace } from "./hooks/useFindReplace";

// ── Types ──────────────────────────────────────────────────────────────────

type Inspiration = { id: string; content: string; createdAt: string };
type AIIssue = { type: "typo" | "ai"; text: string; suggestion: string };
type Chapter = { id: string; bookId: string; title: string; content: string; outline: string; aiInstruction: string; createdAt: string; updatedAt: string };

// ── Helpers ────────────────────────────────────────────────────────────────

function ts() { return new Date().toISOString(); }

// ── Repeat word analysis ───────────────────────────────────────────────────

function analyzeRepeatWords(text: string): { word: string; count: number }[] {
  const cleaned = text.replace(/\s+/g, "");
  if (cleaned.length < 30) return [];
  const counts = new Map<string, number>();
  for (let len = 2; len <= 5; len++) {
    for (let i = 0; i <= cleaned.length - len; i++) {
      const seq = cleaned.slice(i, i + len);
      if (/[，。！？、；：""''（）《》【】\n\r]/.test(seq)) continue;
      counts.set(seq, (counts.get(seq) || 0) + 1);
    }
  }
  const threshold = Math.max(3, Math.floor(cleaned.length / 400));
  const entries = Array.from(counts.entries())
    .filter(([, c]) => c >= threshold)
    .sort((a, b) => b[0].length - a[0].length || b[1] - a[1]);
  const dominated = new Set<string>();
  for (const [word, cnt] of entries) {
    for (const [other, otherCnt] of entries) {
      if (other !== word && other.includes(word) && otherCnt >= cnt) { dominated.add(word); break; }
    }
  }
  return entries.filter(([word]) => !dominated.has(word)).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([word, count]) => ({ word, count }));
}

// ── Component ──────────────────────────────────────────────────────────────

export default function WritePage() {
  const [quickNote, setQuickNote] = useState("");
  const [noteSavedMessage, setNoteSavedMessage] = useState("");
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [aiDraft, setAiDraft] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);
  const [mobileTab, setMobileTab] = useState<"write" | "chapters" | "tools" | "advisor">("write");
  const [leftOpen, setLeftOpen] = useState(true);

  // Analysis
  const [analysisMode, setAnalysisMode] = useState<"none" | "repeat" | "ai">("none");
  const [repeatWords, setRepeatWords] = useState<{ word: string; count: number }[]>([]);
  const [aiIssues, setAiIssues] = useState<AIIssue[]>([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const aiAbortRef = useRef<AbortController | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Stable ref that bridges useBooksAndChapters ↔ useAutoSave.
  const afterSwitchRef = useRef<() => void>(() => {});

  // ── Books & Chapters hook ─────────────────────────────────────────────────

  const {
    books,
    chapters,
    setChapters,
    activeBookId,
    activeChapterId,
    ready,
    activeBook,
    bookChapters,
    activeChapter,
    handleSwitchChapter,
    handleAddChapter,
  } = useBooksAndChapters({
    onAfterSwitchChapter: () => afterSwitchRef.current(),
  });

  // ── Auto-save hook (needs chapters from above) ────────────────────────────

  const {
    saveStatus,
    setSaveStatus,
    scheduleAutoSave,
    handleSave,
    cancelPendingSave,
    statusLabel,
  } = useAutoSave(chapters);

  // Update the bridge ref every render so handleSwitchChapter always gets
  // fresh cancelPendingSave / setSaveStatus references.
  afterSwitchRef.current = () => {
    cancelPendingSave();
    setSaveStatus("idle");
    setAnalysisMode("none");
    setRepeatWords([]);
    setAiIssues([]);
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const content = activeChapter?.content ?? "";
  const wordCount = content.replace(/\s/g, "").length;
  const characterCount = content.length;
  const paragraphCount = content.split("\n").filter(Boolean).length;

  // ── updateActiveChapter (memoized; passed to useFindReplace) ──────────────

  const updateActiveChapter = useCallback(
    (patch: Partial<Pick<Chapter, "title" | "content" | "outline" | "aiInstruction">>) => {
      const updated = chapters.map((c) =>
        c.id === activeChapterId ? { ...c, ...patch, updatedAt: ts() } : c
      );
      setChapters(updated);
      setSaveStatus("writing");
      scheduleAutoSave(updated);
      return updated;
    },
    [chapters, activeChapterId, setSaveStatus, scheduleAutoSave, setChapters]
  );

  // ── Find & Replace hook ───────────────────────────────────────────────────

  const {
    showFind,
    setShowFind,
    findQuery,
    replaceQuery,
    setReplaceQuery,
    findCaseSensitive,
    findUseRegex,
    findMatches,
    findMatchIdx,
    findInputRef,
    handleFindQueryChange,
    handleFindNext,
    handleFindPrev,
    handleReplace,
    handleReplaceAll,
    openFindWith,
    handleToggleCaseSensitive,
    handleToggleRegex,
  } = useFindReplace({ content, editorRef, updateActiveChapter });

  // ── Init: load model settings ─────────────────────────────────────────────

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ai-model-settings");
      if (raw) {
        const ms = JSON.parse(raw) as { baseUrl?: string; apiKey?: string; defaultModel?: string; modelsText?: string };
        const lines = (ms.modelsText ?? "").split("\n").map((l: string) => l.trim()).filter(Boolean);
        const def = ms.defaultModel?.trim() ?? "";
        const opts = def ? [def, ...lines.filter((l) => l !== def)] : lines;
        setModelOptions(opts);
        setSelectedModel(opts[0] ?? "");
      }
    } catch {}
  }, []);

  // ── Keyboard shortcuts (no deps — intentional, avoids stale closures) ─────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setShowFind(true);
        setTimeout(() => findInputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setShowFind(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // ── Quick note ────────────────────────────────────────────────────────────

  function saveQuickNote() {
    if (!quickNote.trim()) return;
    const saved = localStorage.getItem("inspirations");
    const old: Inspiration[] = saved ? JSON.parse(saved) : [];
    const entry: Inspiration = {
      id: crypto.randomUUID(),
      content: quickNote.trim(),
      createdAt: new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
    };
    localStorage.setItem("inspirations", JSON.stringify([entry, ...old]));
    setQuickNote("");
    setNoteSavedMessage("已贴到灵感墙");
    window.setTimeout(() => setNoteSavedMessage(""), 1800);
  }

  // ── Text analysis ─────────────────────────────────────────────────────────

  function handleRepeatAnalysis() {
    if (analysisMode === "repeat") { setAnalysisMode("none"); return; }
    setRepeatWords(analyzeRepeatWords(content));
    setAnalysisMode("repeat");
  }

  async function handleAIAnalysis() {
    if (analysisMode === "ai" && !aiAnalyzing) { setAnalysisMode("none"); return; }
    if (!content.trim()) return;
    let ms: { baseUrl?: string; apiKey?: string; defaultModel?: string } = {};
    try { const raw = localStorage.getItem("ai-model-settings"); if (raw) ms = JSON.parse(raw); } catch {}
    if (!ms.baseUrl || !ms.apiKey) { alert("请先在模型设置中配置 API URL 和密钥"); return; }

    setAnalysisMode("ai");
    setAiIssues([]);
    setAiAnalyzing(true);

    const system = `你是专业中文写作编辑。分析以下小说正文，找出：
1. 错别字或明显用词错误（type:"typo"）
2. AI生成痕迹强的句子：过度整齐的排比、套路化情绪描写（"心跳加速""泪水模糊"等）、缺乏个人语感的泛化表达（type:"ai"）

只返回JSON，不要其他内容：{"issues":[{"type":"typo"|"ai","text":"原文中15字以内的问题片段","suggestion":"修改建议"}]}
最多返回10条，优先选最典型的。无问题则返回{"issues":[]}.`;

    try {
      const text = await chatCompletion({
        baseUrl: normalizeBaseUrl(ms.baseUrl ?? "https://api.openai.com/v1"),
        apiKey: ms.apiKey ?? "",
        model: selectedModel || ms.defaultModel || "",
        messages: [{ role: "system", content: system }, { role: "user", content: `请分析：\n\n${content.slice(0, 4000)}` }],
      });
      const m = text.match(/\{[\s\S]*\}/);
      if (m) setAiIssues(JSON.parse(m[0]).issues ?? []);
    } catch {
      setAiIssues([{ type: "typo", text: "请求失败", suggestion: "请检查模型设置" }]);
    } finally {
      setAiAnalyzing(false);
    }
  }

  // ── AI 扩写 ───────────────────────────────────────────────────────────────

  async function handleAIWrite() {
    if (aiStreaming) { aiAbortRef.current?.abort(); return; }
    let ms: { baseUrl?: string; apiKey?: string; defaultModel?: string } = {};
    try { const raw = localStorage.getItem("ai-model-settings"); if (raw) ms = JSON.parse(raw); } catch {}
    const baseUrl = normalizeBaseUrl(ms.baseUrl ?? "https://api.openai.com/v1");
    const apiKey = ms.apiKey ?? "";

    let dna = ""; let soul = ""; let characters: Record<string, string>[] = [];
    try { const r = localStorage.getItem("writing-dna"); if (r) { const d = JSON.parse(r); dna = [d.languageStyle && `语言风格：${d.languageStyle}`, d.writingPrefs && `写作偏好：${d.writingPrefs}`, d.taboos && `禁忌：${d.taboos}`, d.references && `参考作品：${d.references}`, d.dynamics && `人物张力：${d.dynamics}`].filter(Boolean).join("\n"); } } catch {}
    try { const r = localStorage.getItem("book-souls"); if (r) { const souls = JSON.parse(r); const s = Array.isArray(souls) ? souls.find((x: Record<string, string>) => x.bookId === activeBookId) : null; if (s) soul = [s.tone && `基调：${s.tone}`, s.dynamics && `人物动力：${s.dynamics}`, s.worldbuilding && `世界观：${s.worldbuilding}`, s.redlines && `红线：${s.redlines}`, s.keywords && `关键词：${s.keywords}`, s.aiReminders && `AI提醒：${s.aiReminders}`].filter(Boolean).join("\n"); } } catch {}
    try { const r = localStorage.getItem("book-characters"); if (r) { const all = JSON.parse(r); characters = all.filter((c: Record<string, string>) => c.bookId === activeBookId); } } catch {}

    const charBlock = characters.length > 0 ? characters.map((c) => `${c.role ? `[${c.role}] ` : ""}${c.name}${c.alias ? `（${c.alias}）` : ""}${c.personality ? `：${c.personality}` : ""}`).join("\n") : "";
    let systemPrompt = "你是一位专业的中文小说写作助手，根据作者的风格设定和章节要求续写或扩写正文。直接输出正文内容，不要加标题或解释。";
    if (dna) systemPrompt += `\n\n【写作风格】\n${dna}`;
    if (soul) systemPrompt += `\n\n【书籍设定】\n${soul}`;
    if (charBlock) systemPrompt += `\n\n【主要角色】\n${charBlock}`;

    const userParts: string[] = [];
    if (activeChapter?.outline) userParts.push(`本章大纲：${activeChapter.outline}`);
    if (activeChapter?.content) userParts.push(`已有正文（请在此基础上续写）：\n${activeChapter.content}`);
    if (activeChapter?.aiInstruction) userParts.push(`特别要求：${activeChapter.aiInstruction}`);
    if (userParts.length === 0) userParts.push("请开始写这一章的正文。");

    setAiDraft(""); setAiStreaming(true);
    const abort = new AbortController();
    aiAbortRef.current = abort;
    let accumulated = "";

    try {
      await streamChat({
        baseUrl,
        apiKey,
        model: selectedModel || ms.defaultModel || "",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userParts.join("\n\n") }],
        signal: abort.signal,
        onDelta: (delta) => { accumulated += delta; setAiDraft(accumulated); },
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") setAiDraft("（请求出错，请检查模型设置）");
    } finally { setAiStreaming(false); }
  }

  function handleAppendDraft() {
    if (!aiDraft.trim()) return;
    const sep = content.trim() ? "\n\n" : "";
    updateActiveChapter({ content: content + sep + aiDraft });
    setAiDraft("");
  }

  if (!ready) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="flex h-[100dvh] flex-col bg-[#f5f0e8] text-[#3d2b1a]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#e0d4c0] bg-[#fdf9f4]/95 px-8 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="rounded-full border border-[#e0d4c0] px-4 py-1.5 text-sm text-[#7c5038] transition hover:bg-[#f0ead8]">← 回到小屋</Link>
          <div className="flex items-center gap-2">
            {activeBook && <Link href="/" className="text-sm text-[#7c5038] transition hover:text-[#a07030]">{activeBook.title}</Link>}
            {activeBook && <span className="text-[#c0a078]">/</span>}
            <input type="text" value={activeChapter?.title ?? ""} onChange={(e) => updateActiveChapter({ title: e.target.value })}
              placeholder="章节标题" className="w-56 bg-transparent text-xl font-semibold text-[#3d2b1a] outline-none placeholder:text-[#c0a078]" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {statusLabel() && (
            <span className={`text-sm transition-opacity ${saveStatus === "saving" ? "animate-pulse text-[#a07030]" : "text-[#7c5038]"}`}>{statusLabel()}</span>
          )}
          <button onClick={handleSave} className="rounded-full bg-[#7c4f2a] px-5 py-2 text-sm text-amber-50 transition hover:bg-[#643e1f]">保存</button>
        </div>
      </header>

      {/* ── Mobile ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">
        <div className="flex-1 overflow-hidden">
          {mobileTab === "write" && (
            <div className="flex h-full flex-col overflow-hidden">
              <div className="flex-1 overflow-auto px-4 py-6">
                <textarea value={content} onChange={(e) => updateActiveChapter({ content: e.target.value })}
                  className="min-h-[55vh] w-full resize-none bg-transparent text-base leading-8 text-[#3d2b1a] outline-none placeholder:text-[#c0a078]"
                  placeholder="从这里开始写吧……" />
              </div>
              <div className="flex justify-center border-t border-[#e0d4c0] bg-[#fdf9f4]/60 py-2">
                <button onClick={() => setMobileTab("advisor")} className="rounded-full border border-[#e0d4c0] bg-[#faf7f2] px-5 py-1.5 text-sm text-[#a07030] shadow-sm">问军师</button>
              </div>
            </div>
          )}
          {mobileTab === "chapters" && (
            <div className="flex h-full flex-col p-4">
              <div className="flex-1 space-y-2 overflow-y-auto">
                {bookChapters.map((ch) => (
                  <button key={ch.id} onClick={() => { handleSwitchChapter(ch.id); setMobileTab("write"); }}
                    className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${ch.id === activeChapterId ? "bg-[#f0ead8] text-[#3d2b1a] shadow-sm" : "text-[#7c5038] hover:bg-[#f0ead8]"}`}>
                    <span className="block font-medium">{ch.title || "未命名章节"}</span>
                    <span className="mt-0.5 block text-xs text-[#9a7a58]">{ch.content.replace(/\s/g, "").length} 字</span>
                  </button>
                ))}
              </div>
              <button onClick={() => { handleAddChapter(); setMobileTab("write"); }}
                className="mt-3 w-full rounded-xl border border-dashed border-[#c8a87a] px-4 py-2.5 text-sm text-[#7c5038]">+ 新章节</button>
              <Link href={`/book-soul?bookId=${activeBookId}`} className="mt-2 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-[#7c5038]">
                <span>🪬</span><span>书籍灵魂卡</span>
              </Link>
            </div>
          )}
          {mobileTab === "tools" && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
              <div className="rounded-2xl border border-[#e0d4c0] bg-[#f0ead8] p-4">
                <p className="mb-2 text-xs font-medium text-[#7c5038]">速记灵感</p>
                <textarea value={quickNote} onChange={(e) => setQuickNote(e.target.value)}
                  className="min-h-20 w-full resize-none bg-transparent text-sm leading-6 text-[#3d2b1a] outline-none placeholder:text-[#c0a078]"
                  placeholder="突然想到的台词、伏笔……先丢这里。" />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-[#9a7a58]">{quickNote.trim().length} 字</span>
                  <button onClick={saveQuickNote} className="rounded-full bg-[#7c4f2a] px-4 py-1.5 text-xs text-amber-50">贴到灵感墙</button>
                </div>
                {noteSavedMessage && <p className="mt-2 text-xs text-[#7c5038]">{noteSavedMessage}</p>}
              </div>
              <div className="rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-4">
                <label className="mb-2 block text-xs font-medium text-[#7c5038]">本章大纲</label>
                <textarea rows={3} value={activeChapter?.outline ?? ""} onChange={(e) => updateActiveChapter({ outline: e.target.value })}
                  className="w-full resize-none bg-transparent text-sm leading-6 text-[#3d2b1a] outline-none placeholder:text-[#c0a078]" placeholder="这一章要写什么？" />
              </div>
              <div className="rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-4">
                <label className="mb-2 block text-xs font-medium text-[#7c5038]">本次指令</label>
                <textarea rows={2} value={activeChapter?.aiInstruction ?? ""} onChange={(e) => updateActiveChapter({ aiInstruction: e.target.value })}
                  className="w-full resize-none bg-transparent text-sm leading-6 text-[#3d2b1a] outline-none placeholder:text-[#c0a078]" placeholder="对 AI 的特别要求……" />
              </div>
              {modelOptions.length > 0 && (
                <div className="rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-4">
                  <label className="mb-2 block text-xs font-medium text-[#7c5038]">本次模型</label>
                  <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full rounded-xl border border-[#e0d4c0] bg-[#f0ead8] px-3 py-2 text-sm text-[#3d2b1a] outline-none">
                    {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}
              <button onClick={handleAIWrite}
                className={`w-full rounded-xl px-4 py-3 text-sm text-amber-50 transition ${aiStreaming ? "bg-[#9a7a58] hover:bg-[#7c5038]" : "bg-[#7c4f2a] hover:bg-[#643e1f]"}`}>
                {aiStreaming ? "⏹ 停止生成" : "✍️ AI 扩写"}
              </button>
              {aiDraft && (
                <div className="rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#7c5038]">草稿 · {aiDraft.replace(/\s/g, "").length} 字</span>
                    <button onClick={() => setAiDraft("")} className="text-xs text-[#9a7a58]">清空</button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-[#3d2b1a]">
                    {aiDraft}{aiStreaming && <span className="animate-pulse text-[#7c5038]">▍</span>}
                  </p>
                  {!aiStreaming && <button onClick={handleAppendDraft} className="mt-3 w-full rounded-xl bg-[#7c4f2a] px-4 py-2 text-xs text-amber-50">追加到正文 →</button>}
                </div>
              )}
              {/* Analysis */}
              <div className="rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-4">
                <p className="mb-3 text-xs font-medium text-[#7c5038]">文本检测</p>
                <AnalysisPanel
                  analysisMode={analysisMode}
                  repeatWords={repeatWords}
                  aiIssues={aiIssues}
                  aiAnalyzing={aiAnalyzing}
                  onRepeatAnalysis={handleRepeatAnalysis}
                  onAIAnalysis={handleAIAnalysis}
                  onLocate={openFindWith}
                />
              </div>
            </div>
          )}
          {mobileTab === "advisor" && (
            <div className="h-full">
              <AdvisorPanel bookId={activeBookId} chapters={bookChapters} activeChapterId={activeChapterId} />
            </div>
          )}
        </div>
        <nav className="flex shrink-0 border-t border-[#e0d4c0] bg-[#fdf9f4]/95">
          {(["write", "chapters", "tools", "advisor"] as const).map((tab) => {
            const items = { write: ["✍️", "写作"], chapters: ["📑", "章节"], tools: ["🔧", "工具"], advisor: ["🎯", "军师"] };
            const [icon, label] = items[tab];
            return (
              <button key={tab} onClick={() => setMobileTab(tab)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition ${mobileTab === tab ? "text-[#a07030]" : "text-[#b8956a]"}`}>
                <span className="text-lg">{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Desktop 3-column ───────────────────────────────────────────────── */}
      <div className={`hidden flex-1 md:grid md:overflow-hidden ${leftOpen ? "md:grid-cols-[220px_1fr_420px]" : "md:grid-cols-[28px_1fr_420px]"}`}>
        {/* Left sidebar */}
        <ChapterSidebar
          bookChapters={bookChapters}
          activeChapterId={activeChapterId}
          activeBookId={activeBookId}
          leftOpen={leftOpen}
          onSwitchChapter={handleSwitchChapter}
          onAddChapter={handleAddChapter}
          onToggle={setLeftOpen}
        />

        {/* Main editor */}
        <section className="flex flex-col overflow-hidden">
          {showFind && (
            <FindReplaceBar
              findQuery={findQuery}
              replaceQuery={replaceQuery}
              findCaseSensitive={findCaseSensitive}
              findUseRegex={findUseRegex}
              findMatches={findMatches}
              findMatchIdx={findMatchIdx}
              findInputRef={findInputRef}
              onQueryChange={handleFindQueryChange}
              onReplaceChange={setReplaceQuery}
              onToggleCaseSensitive={handleToggleCaseSensitive}
              onToggleRegex={handleToggleRegex}
              onFindNext={handleFindNext}
              onFindPrev={handleFindPrev}
              onReplace={handleReplace}
              onReplaceAll={handleReplaceAll}
              onClose={() => setShowFind(false)}
            />
          )}
          <div className="flex-1 overflow-auto px-12 py-10">
            <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-[#e0d4c0] bg-[#faf7f2] p-8 shadow-sm">
              <textarea
                ref={editorRef}
                value={content}
                onChange={(e) => updateActiveChapter({ content: e.target.value })}
                className="min-h-[60vh] w-full resize-none bg-transparent text-lg leading-9 text-[#3d2b1a] outline-none placeholder:text-[#c0a078]"
                placeholder="从这里开始写吧。可以是一句话，一个场景，或者今天突然亮起来的那一幕……"
              />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-[#e0d4c0] bg-[#fdf9f4]/60 px-6 py-2">
            <button
              onClick={() => { setShowFind((f) => !f); if (!showFind) setTimeout(() => findInputRef.current?.focus(), 50); }}
              className="rounded-full border border-[#e0d4c0] bg-[#faf7f2] px-4 py-1.5 text-sm text-[#7c5038] shadow-sm transition hover:bg-[#f0ead8]">
              查找替换 <kbd className="ml-1 text-[10px] text-[#9a7a58]">⌘F</kbd>
            </button>
            <button onClick={() => setAdvisorOpen((o) => !o)}
              className="rounded-full border border-[#e0d4c0] bg-[#faf7f2] px-6 py-1.5 text-sm text-[#a07030] shadow-sm transition hover:bg-[#f0ead8]">
              {advisorOpen ? "收起军师 ↓" : "写作军师 ↑"}
            </button>
          </div>
          {advisorOpen && (
            <div className="h-96 shrink-0 border-t border-[#e0d4c0]">
              <AdvisorPanel bookId={activeBookId} chapters={bookChapters} activeChapterId={activeChapterId} />
            </div>
          )}
        </section>

        {/* Right sidebar */}
        <aside className="flex flex-col gap-5 overflow-y-auto border-l border-[#e0d4c0] bg-[#faf7f2] p-5">
          {/* Quick note */}
          <QuickNoteBox
            value={quickNote}
            savedMessage={noteSavedMessage}
            onChange={setQuickNote}
            onSave={saveQuickNote}
          />

          {/* AI writing */}
          <section>
            <p className="mb-4 text-sm font-medium text-[#7c5038]">AI 扩写准备</p>
            <div className="space-y-3">
              <div className="rounded-2xl border border-[#e0d4c0] bg-[#f0ead8] p-4">
                <label className="mb-2 block text-xs font-medium text-[#7c5038]">本章大纲</label>
                <textarea rows={4} value={activeChapter?.outline ?? ""} onChange={(e) => updateActiveChapter({ outline: e.target.value })}
                  className="w-full resize-none bg-transparent text-sm leading-6 text-[#3d2b1a] outline-none placeholder:text-[#c0a078]"
                  placeholder="这一章要写什么？几个关键节拍或场景……" />
              </div>
              <div className="rounded-2xl border border-[#e0d4c0] bg-[#f0ead8] p-4">
                <label className="mb-2 block text-xs font-medium text-[#7c5038]">本次指令</label>
                <textarea rows={3} value={activeChapter?.aiInstruction ?? ""} onChange={(e) => updateActiveChapter({ aiInstruction: e.target.value })}
                  className="w-full resize-none bg-transparent text-sm leading-6 text-[#3d2b1a] outline-none placeholder:text-[#c0a078]"
                  placeholder="对 AI 的特别要求，比如：重点写眼神交流，不要推进剧情……" />
              </div>
            </div>
            {modelOptions.length > 0 && (
              <div className="mt-3 rounded-2xl border border-[#e0d4c0] bg-[#f0ead8] p-4">
                <label className="mb-2 block text-xs font-medium text-[#7c5038]">本次模型</label>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-xl border border-[#e0d4c0] bg-[#faf7f2] px-3 py-2 text-sm text-[#3d2b1a] outline-none">
                  {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}
            <button onClick={handleAIWrite}
              className={`mt-4 w-full rounded-xl px-4 py-3 text-sm text-amber-50 transition ${aiStreaming ? "bg-[#9a7a58] hover:bg-[#7c5038]" : "bg-[#7c4f2a] hover:bg-[#643e1f]"}`}>
              {aiStreaming ? "⏹ 停止生成" : "✍️ AI 扩写"}
            </button>
            {aiDraft && (
              <div className="mt-3 rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#7c5038]">草稿 · {aiDraft.replace(/\s/g, "").length} 字</span>
                  <button onClick={() => setAiDraft("")} className="text-xs text-[#9a7a58] hover:text-[#7c5038] transition">清空</button>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-[#3d2b1a]">
                  {aiDraft}{aiStreaming && <span className="animate-pulse text-[#7c5038]">▍</span>}
                </p>
                {!aiStreaming && (
                  <button onClick={handleAppendDraft} className="mt-3 w-full rounded-xl bg-[#7c4f2a] px-4 py-2 text-xs text-amber-50 transition hover:bg-[#643e1f]">追加到正文 →</button>
                )}
              </div>
            )}
          </section>

          {/* Text analysis */}
          <section>
            <p className="mb-3 text-sm font-medium text-[#7c5038]">文本检测</p>
            <AnalysisPanel
              analysisMode={analysisMode}
              repeatWords={repeatWords}
              aiIssues={aiIssues}
              aiAnalyzing={aiAnalyzing}
              onRepeatAnalysis={handleRepeatAnalysis}
              onAIAnalysis={handleAIAnalysis}
              onLocate={openFindWith}
            />
          </section>
        </aside>
      </div>

      {/* Footer */}
      <footer className="hidden items-center gap-6 border-t border-[#e0d4c0] bg-[#fdf9f4]/90 px-8 py-3 text-xs text-[#7c5038] md:flex">
        <span>{wordCount} 字</span>
        <span>{characterCount} 字符</span>
        <span>{paragraphCount} 段</span>
        <span className="ml-auto text-[#9a7a58]">共 {bookChapters.length} 章</span>
      </footer>
    </main>
  );
}
