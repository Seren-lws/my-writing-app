"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AdvisorPanel from "../components/AdvisorPanel";

// ── Types ──────────────────────────────────────────────────────────────────

type Book = { id: string; title: string; createdAt: string; updatedAt: string };
type Chapter = { id: string; bookId: string; title: string; content: string; outline: string; aiInstruction: string; createdAt: string; updatedAt: string };
type Inspiration = { id: string; content: string; createdAt: string };
type SaveStatus = "idle" | "writing" | "saving" | "saved";
type Match = { start: number; end: number };
type AIIssue = { type: "typo" | "ai"; text: string; suggestion: string };

// ── Storage helpers ────────────────────────────────────────────────────────

function ts() { return new Date().toISOString(); }
function formatTime(iso: string) { return new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }); }
function loadBooks(): Book[] { try { const r = localStorage.getItem("books"); return r ? JSON.parse(r) : []; } catch { return []; } }
function loadChapters(): Chapter[] { try { const r = localStorage.getItem("chapters"); return r ? JSON.parse(r) : []; } catch { return []; } }
function persistBooks(b: Book[]) { localStorage.setItem("books", JSON.stringify(b)); }
function persistChapters(c: Chapter[]) { localStorage.setItem("chapters", JSON.stringify(c)); }

// ── Bootstrap ──────────────────────────────────────────────────────────────

function bootstrap(urlBookId: string): { books: Book[]; chapters: Chapter[]; activeBookId: string } {
  let books = loadBooks();
  let chapters = loadChapters();
  if (books.length === 0) {
    const defaultBook: Book = { id: crypto.randomUUID(), title: "靡音", createdAt: ts(), updatedAt: ts() };
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
      return { ...c, bookId: c.bookId || defaultBookId, outline: c.outline ?? "", aiInstruction: c.aiInstruction ?? "" };
    }
    return c;
  });
  if (migrated) persistChapters(chapters);
  const targetBookId = urlBookId && books.find((b) => b.id === urlBookId) ? urlBookId : defaultBookId;
  const bookChapters = chapters.filter((c) => c.bookId === targetBookId);
  if (bookChapters.length === 0) {
    const first: Chapter = { id: crypto.randomUUID(), bookId: targetBookId, title: "第一章", content: "", outline: "", aiInstruction: "", createdAt: ts(), updatedAt: ts() };
    chapters = [...chapters, first];
    persistChapters(chapters);
  }
  return { books, chapters, activeBookId: targetBookId };
}

// ── Find helper ────────────────────────────────────────────────────────────

function computeMatches(query: string, text: string, caseSensitive: boolean, useRegex: boolean): Match[] {
  if (!query) return [];
  try {
    const flags = caseSensitive ? "g" : "gi";
    const pattern = useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(pattern, flags);
    const matches: Match[] = [];
    let m;
    while ((m = re.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length });
      if (m[0].length === 0) re.lastIndex++;
    }
    return matches;
  } catch { return []; }
}

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
  const [mobileTab, setMobileTab] = useState<"write" | "chapters" | "tools" | "advisor">("write");

  // Find & Replace
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [findCaseSensitive, setFindCaseSensitive] = useState(false);
  const [findUseRegex, setFindUseRegex] = useState(false);
  const [findMatches, setFindMatches] = useState<Match[]>([]);
  const [findMatchIdx, setFindMatchIdx] = useState(0);

  // Analysis
  const [analysisMode, setAnalysisMode] = useState<"none" | "repeat" | "ai">("none");
  const [repeatWords, setRepeatWords] = useState<{ word: string; count: number }[]>([]);
  const [aiIssues, setAiIssues] = useState<AIIssue[]>([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);

  const activeBook = books.find((b) => b.id === activeBookId) ?? null;
  const bookChapters = chapters.filter((c) => c.bookId === activeBookId);
  const activeChapter = chapters.find((c) => c.id === activeChapterId) ?? null;
  const content = activeChapter?.content ?? "";
  const wordCount = content.replace(/\s/g, "").length;
  const characterCount = content.length;
  const paragraphCount = content.split("\n").filter(Boolean).length;

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
        const ms = JSON.parse(raw) as { baseUrl?: string; apiKey?: string; defaultModel?: string; modelsText?: string };
        const lines = (ms.modelsText ?? "").split("\n").map((l: string) => l.trim()).filter(Boolean);
        const def = ms.defaultModel?.trim() ?? "";
        const opts = def ? [def, ...lines.filter((l) => l !== def)] : lines;
        setModelOptions(opts);
        setSelectedModel(opts[0] ?? "");
      }
    } catch {}
    setReady(true);
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────

  const performSave = useCallback((updatedChapters: Chapter[]) => {
    setSaveStatus("saving");
    setTimeout(() => { persistChapters(updatedChapters); setSavedTime(formatTime(ts())); setSaveStatus("saved"); }, 400);
  }, []);

  const scheduleAutoSave = useCallback((updatedChapters: Chapter[]) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => performSave(updatedChapters), 30000);
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

  useEffect(() => { return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); }; }, []);

  // ── Chapter actions ───────────────────────────────────────────────────────

  function handleSwitchChapter(id: string) {
    if (id === activeChapterId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    persistChapters(chapters);
    setActiveChapterId(id);
    setSaveStatus("idle");
    setAnalysisMode("none");
    setRepeatWords([]);
    setAiIssues([]);
  }

  function handleAddChapter() {
    const newChapter: Chapter = { id: crypto.randomUUID(), bookId: activeBookId, title: "新章节", content: "", outline: "", aiInstruction: "", createdAt: ts(), updatedAt: ts() };
    const updated = [...chapters, newChapter];
    setChapters(updated);
    setActiveChapterId(newChapter.id);
    persistChapters(updated);
  }

  // ── Quick note ────────────────────────────────────────────────────────────

  function saveQuickNote() {
    if (!quickNote.trim()) return;
    const saved = localStorage.getItem("inspirations");
    const old: Inspiration[] = saved ? JSON.parse(saved) : [];
    const entry: Inspiration = { id: crypto.randomUUID(), content: quickNote.trim(), createdAt: new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) };
    localStorage.setItem("inspirations", JSON.stringify([entry, ...old]));
    setQuickNote("");
    setNoteSavedMessage("已贴到灵感墙");
    window.setTimeout(() => setNoteSavedMessage(""), 1800);
  }

  // ── Find & Replace ────────────────────────────────────────────────────────

  function jumpToMatch(matches: Match[], idx: number) {
    const match = matches[idx];
    if (!match || !editorRef.current) return;
    editorRef.current.focus();
    editorRef.current.setSelectionRange(match.start, match.end);
    const linesBefore = content.slice(0, match.start).split("\n").length - 1;
    editorRef.current.scrollTop = Math.max(0, linesBefore * 36 - 100);
  }

  function handleFindQueryChange(q: string) {
    setFindQuery(q);
    const matches = computeMatches(q, content, findCaseSensitive, findUseRegex);
    setFindMatches(matches);
    setFindMatchIdx(0);
  }

  function handleFindOption(cs: boolean, rx: boolean) {
    const matches = computeMatches(findQuery, content, cs, rx);
    setFindMatches(matches);
    setFindMatchIdx(0);
    if (matches.length > 0) jumpToMatch(matches, 0);
  }

  function handleFindNext() {
    if (!findMatches.length) return;
    const next = (findMatchIdx + 1) % findMatches.length;
    setFindMatchIdx(next);
    jumpToMatch(findMatches, next);
  }

  function handleFindPrev() {
    if (!findMatches.length) return;
    const prev = (findMatchIdx - 1 + findMatches.length) % findMatches.length;
    setFindMatchIdx(prev);
    jumpToMatch(findMatches, prev);
  }

  function handleReplace() {
    if (!findMatches.length) return;
    const match = findMatches[findMatchIdx];
    const newContent = content.slice(0, match.start) + replaceQuery + content.slice(match.end);
    updateActiveChapter({ content: newContent });
    const newMatches = computeMatches(findQuery, newContent, findCaseSensitive, findUseRegex);
    setFindMatches(newMatches);
    const next = Math.min(findMatchIdx, newMatches.length - 1);
    setFindMatchIdx(Math.max(0, next));
  }

  function handleReplaceAll() {
    if (!findMatches.length) return;
    let newContent = content;
    let offset = 0;
    for (const match of findMatches) {
      const s = match.start + offset;
      const e = match.end + offset;
      newContent = newContent.slice(0, s) + replaceQuery + newContent.slice(e);
      offset += replaceQuery.length - (match.end - match.start);
    }
    updateActiveChapter({ content: newContent });
    setFindMatches([]);
  }

  function openFindWith(word: string) {
    setFindQuery(word);
    setShowFind(true);
    const matches = computeMatches(word, content, false, false);
    setFindMatches(matches);
    setFindMatchIdx(0);
    if (matches.length > 0) setTimeout(() => jumpToMatch(matches, 0), 50);
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
      const baseUrl = (ms.baseUrl ?? "").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ms.apiKey}` },
        body: JSON.stringify({
          model: selectedModel || ms.defaultModel || "",
          messages: [{ role: "system", content: system }, { role: "user", content: `请分析：\n\n${content.slice(0, 4000)}` }],
          stream: false,
        }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? "";
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
    const baseUrl = (ms.baseUrl ?? "").replace(/\/$/, "") || "https://api.openai.com";
    const apiKey = ms.apiKey ?? "";

    let dna = ""; let soul = ""; let characters: Record<string, string>[] = [];
    try { const r = localStorage.getItem("writing-dna"); if (r) { const d = JSON.parse(r); dna = [d.languageStyle && `语言风格：${d.languageStyle}`, d.preferences && `写作偏好：${d.preferences}`, d.taboos && `禁忌：${d.taboos}`].filter(Boolean).join("\n"); } } catch {}
    try { const r = localStorage.getItem(`book-soul-${activeBookId}`); if (r) { const s = JSON.parse(r); soul = [s.tone && `基调：${s.tone}`, s.relationship && `主角关系：${s.relationship}`, s.worldRules && `世界观：${s.worldRules}`, s.mustNotBreak && `不能破坏：${s.mustNotBreak}`].filter(Boolean).join("\n"); } } catch {}
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
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST", signal: abort.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: selectedModel || ms.defaultModel || "", stream: true, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userParts.join("\n\n") }] }),
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
          try { const delta = JSON.parse(json).choices?.[0]?.delta?.content ?? ""; if (delta) { accumulated += delta; setAiDraft(accumulated); } } catch {}
        }
      }
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

  function statusLabel() {
    if (saveStatus === "writing") return "正在写作";
    if (saveStatus === "saving") return "自动保存中…";
    if (saveStatus === "saved") return `已自动保存 ${savedTime}`;
    return "";
  }

  if (!ready) return null;

  // ── Find bar ──────────────────────────────────────────────────────────────

  const FindBar = showFind && (
    <div className="shrink-0 border-b border-[#4c2c14] bg-[#261609] px-4 py-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1.5 rounded-xl border border-[#6a4020] bg-[#311d0c] px-3 py-1.5">
          <input
            ref={findInputRef}
            type="text"
            value={findQuery}
            onChange={(e) => handleFindQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.shiftKey ? handleFindPrev() : handleFindNext(); }
              if (e.key === "Escape") setShowFind(false);
            }}
            placeholder="查找…"
            className="flex-1 bg-transparent text-sm text-[#f0e6d3] outline-none placeholder:text-[#5a3820]"
          />
          <button
            title="区分大小写"
            onClick={() => { const nc = !findCaseSensitive; setFindCaseSensitive(nc); handleFindOption(nc, findUseRegex); }}
            className={`rounded px-1.5 py-0.5 text-xs font-mono transition ${findCaseSensitive ? "bg-[#6e4b2d] text-amber-50" : "text-[#8a6040] hover:text-[#c8a878]"}`}>
            Aa
          </button>
          <button
            title="正则表达式"
            onClick={() => { const nr = !findUseRegex; setFindUseRegex(nr); handleFindOption(findCaseSensitive, nr); }}
            className={`rounded px-1.5 py-0.5 text-xs font-mono transition ${findUseRegex ? "bg-[#6e4b2d] text-amber-50" : "text-[#8a6040] hover:text-[#c8a878]"}`}>
            .*
          </button>
        </div>
        <span className="shrink-0 min-w-[40px] text-center text-xs text-[#8a6040]">
          {findMatches.length > 0 ? `${findMatchIdx + 1}/${findMatches.length}` : findQuery ? "0 个" : ""}
        </span>
        <button onClick={handleFindPrev} disabled={!findMatches.length} className="rounded px-2 py-1 text-[#c8a878] hover:bg-[#4c2c14] disabled:opacity-30 text-sm">↑</button>
        <button onClick={handleFindNext} disabled={!findMatches.length} className="rounded px-2 py-1 text-[#c8a878] hover:bg-[#4c2c14] disabled:opacity-30 text-sm">↓</button>
        <button onClick={() => setShowFind(false)} className="rounded px-2 py-1 text-[#8a6040] hover:text-[#c8a878] text-sm">✕</button>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center rounded-xl border border-[#4c2c14] bg-[#311d0c] px-3 py-1.5">
          <input
            type="text"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleReplace(); }}
            placeholder="替换为…"
            className="flex-1 bg-transparent text-sm text-[#f0e6d3] outline-none placeholder:text-[#5a3820]"
          />
        </div>
        <button onClick={handleReplace} disabled={!findMatches.length}
          className="rounded-lg border border-[#6a4020] px-3 py-1.5 text-xs text-[#c8a878] transition hover:bg-[#311d0c] disabled:opacity-30">替换</button>
        <button onClick={handleReplaceAll} disabled={!findMatches.length}
          className="rounded-lg border border-[#6a4020] px-3 py-1.5 text-xs text-[#c8a878] transition hover:bg-[#311d0c] disabled:opacity-30">全替换</button>
      </div>
    </div>
  );

  // ── Analysis panel (shared between mobile + desktop) ──────────────────────

  const AnalysisResults = (
    <>
      {analysisMode === "repeat" && (
        <div className="mt-3">
          {repeatWords.length > 0 ? (
            <>
              <p className="mb-2 text-xs text-[#8a6040]">点击词语可在编辑器中定位</p>
              <div className="flex flex-wrap gap-1.5">
                {repeatWords.map(({ word, count }) => (
                  <button key={word} onClick={() => openFindWith(word)}
                    className="rounded-full border border-[#6a4020] bg-[#311d0c] px-2.5 py-1 text-xs text-[#d4a05a] transition hover:bg-[#4c2c14]">
                    {word} <span className="text-[#8a6040]">×{count}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-[#8a6040]">未发现明显重复词（≥3次）</p>
          )}
        </div>
      )}
      {analysisMode === "ai" && (
        <div className="mt-3">
          {aiAnalyzing && <p className="text-xs text-[#8a6040] animate-pulse">AI 正在分析…</p>}
          {!aiAnalyzing && aiIssues.length === 0 && <p className="text-xs text-[#8a6040]">未发现明显问题</p>}
          {aiIssues.length > 0 && (
            <div className="space-y-2">
              {aiIssues.map((issue, i) => (
                <div key={i} className="rounded-xl border border-[#4c2c14] bg-[#311d0c] p-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${issue.type === "typo" ? "bg-red-950/50 text-red-400" : "bg-[#1e1500] text-[#c8a060]"}`}>
                      {issue.type === "typo" ? "错别字" : "AI味"}
                    </span>
                    <button onClick={() => openFindWith(issue.text.slice(0, 12))}
                      className="text-[10px] text-[#8a6040] underline underline-offset-2 hover:text-[#c8a878]">定位</button>
                  </div>
                  <p className="text-xs text-[#f0e6d3] leading-5">「{issue.text}」</p>
                  <p className="mt-1 text-xs text-[#8a6040] leading-5">{issue.suggestion}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="flex h-[100dvh] flex-col bg-[#1c1108] text-[#f0e6d3]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#4c2c14] bg-[#261609]/90 px-8 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="rounded-full border border-[#6a4020] px-4 py-1.5 text-sm text-[#c8a878] transition hover:bg-[#311d0c]">← 回到小屋</Link>
          <div className="flex items-center gap-2">
            {activeBook && <Link href="/" className="text-sm text-[#c8a878] transition hover:text-[#d4a05a]">{activeBook.title}</Link>}
            {activeBook && <span className="text-[#6a4020]">/</span>}
            <input type="text" value={activeChapter?.title ?? ""} onChange={(e) => updateActiveChapter({ title: e.target.value })}
              placeholder="章节标题" className="w-56 bg-transparent text-xl font-semibold text-[#f0e6d3] outline-none placeholder:text-[#5a3820]" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {statusLabel() && (
            <span className={`text-sm transition-opacity ${saveStatus === "saving" ? "animate-pulse text-[#d4a05a]" : "text-[#c8a878]"}`}>{statusLabel()}</span>
          )}
          <button onClick={handleSave} className="rounded-full bg-[#6e4b2d] px-5 py-2 text-sm text-amber-50 transition hover:bg-[#58391f]">保存</button>
        </div>
      </header>

      {/* ── Mobile ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">
        <div className="flex-1 overflow-hidden">
          {mobileTab === "write" && (
            <div className="flex h-full flex-col overflow-hidden">
              <div className="flex-1 overflow-auto px-4 py-6">
                <textarea value={content} onChange={(e) => updateActiveChapter({ content: e.target.value })}
                  className="min-h-[55vh] w-full resize-none bg-transparent text-base leading-8 text-[#e8d5b7] outline-none placeholder:text-[#5a3820]"
                  placeholder="从这里开始写吧……" />
              </div>
              <div className="flex justify-center border-t border-[#4c2c14] bg-[#261609]/60 py-2">
                <button onClick={() => setMobileTab("advisor")} className="rounded-full border border-[#6a4020] bg-[#311d0c] px-5 py-1.5 text-sm text-[#d4a05a] shadow-sm">问军师</button>
              </div>
            </div>
          )}
          {mobileTab === "chapters" && (
            <div className="flex h-full flex-col p-4">
              <div className="flex-1 space-y-2 overflow-y-auto">
                {bookChapters.map((ch) => (
                  <button key={ch.id} onClick={() => { handleSwitchChapter(ch.id); setMobileTab("write"); }}
                    className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${ch.id === activeChapterId ? "bg-[#4c2c14] text-[#f0e6d3] shadow-sm" : "text-[#c8a878] hover:bg-[#311d0c]"}`}>
                    <span className="block font-medium">{ch.title || "未命名章节"}</span>
                    <span className="mt-0.5 block text-xs text-[#8a6040]">{ch.content.replace(/\s/g, "").length} 字</span>
                  </button>
                ))}
              </div>
              <button onClick={() => { handleAddChapter(); setMobileTab("write"); }}
                className="mt-3 w-full rounded-xl border border-dashed border-[#6a4020] px-4 py-2.5 text-sm text-[#c8a878]">+ 新章节</button>
              <Link href={`/book-soul?bookId=${activeBookId}`} className="mt-2 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-[#c8a878]">
                <span>🪬</span><span>书籍灵魂卡</span>
              </Link>
            </div>
          )}
          {mobileTab === "tools" && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
              <div className="rounded-2xl border border-[#5a4010] bg-[#1e1500] p-4">
                <p className="mb-2 text-xs font-medium text-[#c8a878]">速记灵感</p>
                <textarea value={quickNote} onChange={(e) => setQuickNote(e.target.value)}
                  className="min-h-20 w-full resize-none bg-transparent text-sm leading-6 text-[#e8d5b7] outline-none placeholder:text-[#5a3820]"
                  placeholder="突然想到的台词、伏笔……先丢这里。" />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-[#8a6040]">{quickNote.trim().length} 字</span>
                  <button onClick={saveQuickNote} className="rounded-full bg-[#6e4b2d] px-4 py-1.5 text-xs text-amber-50">贴到灵感墙</button>
                </div>
                {noteSavedMessage && <p className="mt-2 text-xs text-[#c8a878]">{noteSavedMessage}</p>}
              </div>
              <div className="rounded-2xl border border-[#4c2c14] bg-[#311d0c] p-4">
                <label className="mb-2 block text-xs font-medium text-[#c8a878]">本章大纲</label>
                <textarea rows={3} value={activeChapter?.outline ?? ""} onChange={(e) => updateActiveChapter({ outline: e.target.value })}
                  className="w-full resize-none bg-transparent text-sm leading-6 text-[#f0e6d3] outline-none placeholder:text-[#5a3820]" placeholder="这一章要写什么？" />
              </div>
              <div className="rounded-2xl border border-[#4c2c14] bg-[#311d0c] p-4">
                <label className="mb-2 block text-xs font-medium text-[#c8a878]">本次指令</label>
                <textarea rows={2} value={activeChapter?.aiInstruction ?? ""} onChange={(e) => updateActiveChapter({ aiInstruction: e.target.value })}
                  className="w-full resize-none bg-transparent text-sm leading-6 text-[#f0e6d3] outline-none placeholder:text-[#5a3820]" placeholder="对 AI 的特别要求……" />
              </div>
              {modelOptions.length > 0 && (
                <div className="rounded-2xl border border-[#4c2c14] bg-[#311d0c] p-4">
                  <label className="mb-2 block text-xs font-medium text-[#c8a878]">本次模型</label>
                  <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full rounded-xl border border-[#4c2c14] bg-[#261609] px-3 py-2 text-sm text-[#f0e6d3] outline-none">
                    {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}
              <button onClick={handleAIWrite}
                className={`w-full rounded-xl px-4 py-3 text-sm text-amber-50 transition ${aiStreaming ? "bg-[#6a4020]" : "bg-[#6e4b2d]"}`}>
                {aiStreaming ? "⏹ 停止生成" : "✍️ AI 扩写"}
              </button>
              {aiDraft && (
                <div className="rounded-2xl border border-[#4c2c14] bg-[#261609] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#c8a878]">草稿 · {aiDraft.replace(/\s/g, "").length} 字</span>
                    <button onClick={() => setAiDraft("")} className="text-xs text-[#8a6040]">清空</button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-[#e8d5b7]">
                    {aiDraft}{aiStreaming && <span className="animate-pulse text-[#c8a878]">▍</span>}
                  </p>
                  {!aiStreaming && <button onClick={handleAppendDraft} className="mt-3 w-full rounded-xl bg-[#6e4b2d] px-4 py-2 text-xs text-amber-50">追加到正文 →</button>}
                </div>
              )}
              {/* Analysis */}
              <div className="rounded-2xl border border-[#4c2c14] bg-[#261609] p-4">
                <p className="mb-3 text-xs font-medium text-[#c8a878]">文本检测</p>
                <div className="flex gap-2">
                  <button onClick={handleRepeatAnalysis}
                    className={`flex-1 rounded-xl border py-2 text-xs transition ${analysisMode === "repeat" ? "border-[#6e4b2d] bg-[#6e4b2d] text-amber-50" : "border-[#6a4020] text-[#c8a878] hover:bg-[#311d0c]"}`}>
                    重复词
                  </button>
                  <button onClick={handleAIAnalysis}
                    className={`flex-1 rounded-xl border py-2 text-xs transition ${analysisMode === "ai" ? "border-[#6e4b2d] bg-[#6e4b2d] text-amber-50" : "border-[#6a4020] text-[#c8a878] hover:bg-[#311d0c]"}`}>
                    {aiAnalyzing ? "检测中…" : "AI 检测"}
                  </button>
                </div>
                {AnalysisResults}
              </div>
            </div>
          )}
          {mobileTab === "advisor" && (
            <div className="h-full">
              <AdvisorPanel bookId={activeBookId} chapters={bookChapters} activeChapterId={activeChapterId} />
            </div>
          )}
        </div>
        <nav className="flex shrink-0 border-t border-[#4c2c14] bg-[#261609]/95">
          {(["write", "chapters", "tools", "advisor"] as const).map((tab) => {
            const items = { write: ["✍️", "写作"], chapters: ["📑", "章节"], tools: ["🔧", "工具"], advisor: ["🎯", "军师"] };
            const [icon, label] = items[tab];
            return (
              <button key={tab} onClick={() => setMobileTab(tab)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition ${mobileTab === tab ? "text-[#d4a05a]" : "text-[#5a3820]"}`}>
                <span className="text-lg">{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Desktop 3-column ───────────────────────────────────────────────── */}
      <div className="hidden flex-1 md:grid md:grid-cols-[220px_1fr_280px] md:overflow-hidden">
        {/* Left sidebar */}
        <aside className="flex flex-col border-r border-[#4c2c14] bg-[#261609] p-5">
          <p className="mb-4 text-sm font-medium text-[#c8a878]">章节</p>
          <div className="flex-1 space-y-1.5 overflow-y-auto">
            {bookChapters.map((ch) => (
              <button key={ch.id} onClick={() => handleSwitchChapter(ch.id)}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${ch.id === activeChapterId ? "bg-[#4c2c14] text-[#f0e6d3] shadow-sm" : "text-[#c8a878] hover:bg-[#311d0c]"}`}>
                <span className="block truncate">{ch.title || "未命名章节"}</span>
                <span className="mt-0.5 block text-xs text-[#8a6040]">{ch.content.replace(/\s/g, "").length} 字</span>
              </button>
            ))}
          </div>
          <button onClick={handleAddChapter}
            className="mt-4 w-full rounded-xl border border-dashed border-[#6a4020] px-4 py-2.5 text-sm text-[#c8a878] transition hover:bg-[#311d0c]">+ 新章节</button>
          <Link href={`/book-soul?bookId=${activeBookId}`}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-[#c8a878] transition hover:bg-[#311d0c]">
            <span>🪬</span><span>书籍灵魂卡</span>
          </Link>
        </aside>

        {/* Main editor */}
        <section className="flex flex-col overflow-hidden">
          {FindBar}
          <div className="flex-1 overflow-auto px-12 py-10">
            <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-[#4c2c14] bg-[#261609] p-8 shadow-sm">
              <textarea
                ref={editorRef}
                value={content}
                onChange={(e) => updateActiveChapter({ content: e.target.value })}
                className="min-h-[60vh] w-full resize-none bg-transparent text-lg leading-9 text-[#e8d5b7] outline-none placeholder:text-[#5a3820]"
                placeholder="从这里开始写吧。可以是一句话，一个场景，或者今天突然亮起来的那一幕……"
              />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-[#4c2c14] bg-[#261609]/60 px-6 py-2">
            <button
              onClick={() => { setShowFind((f) => !f); if (!showFind) setTimeout(() => findInputRef.current?.focus(), 50); }}
              className="rounded-full border border-[#6a4020] bg-[#311d0c] px-4 py-1.5 text-sm text-[#c8a878] shadow-sm transition hover:bg-[#4c2c14]">
              查找替换 <kbd className="ml-1 text-[10px] text-[#8a6040]">⌘F</kbd>
            </button>
            <button onClick={() => setAdvisorOpen((o) => !o)}
              className="rounded-full border border-[#6a4020] bg-[#311d0c] px-6 py-1.5 text-sm text-[#d4a05a] shadow-sm transition hover:bg-[#4c2c14]">
              {advisorOpen ? "收起军师 ↓" : "写作军师 ↑"}
            </button>
          </div>
          {advisorOpen && (
            <div className="h-96 shrink-0 border-t border-[#4c2c14]">
              <AdvisorPanel bookId={activeBookId} chapters={bookChapters} activeChapterId={activeChapterId} />
            </div>
          )}
        </section>

        {/* Right sidebar */}
        <aside className="flex flex-col gap-5 overflow-y-auto border-l border-[#4c2c14] bg-[#261609] p-5">
          {/* Quick note */}
          <section>
            <p className="mb-4 text-sm font-medium text-[#c8a878]">速记灵感</p>
            <div className="rounded-2xl border border-[#5a4010] bg-[#1e1500] p-4 shadow-sm">
              <textarea value={quickNote} onChange={(e) => setQuickNote(e.target.value)}
                className="min-h-24 w-full resize-none bg-transparent text-sm leading-6 text-[#e8d5b7] outline-none placeholder:text-[#5a3820]"
                placeholder="突然想到的台词、伏笔、梗、画面……先丢这里。" />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-[#8a6040]">{quickNote.trim().length} 字</span>
                <button onClick={saveQuickNote} className="rounded-full bg-[#6e4b2d] px-4 py-1.5 text-xs text-amber-50 transition hover:bg-[#58391f]">贴到灵感墙</button>
              </div>
              {noteSavedMessage && <p className="mt-3 text-xs text-[#c8a878]">{noteSavedMessage}</p>}
            </div>
            <Link href="/inspirations" className="mt-3 inline-block text-xs text-[#8a6040] underline underline-offset-4">查看全部灵感 →</Link>
          </section>

          {/* AI writing */}
          <section>
            <p className="mb-4 text-sm font-medium text-[#c8a878]">AI 扩写准备</p>
            <div className="space-y-3">
              <div className="rounded-2xl border border-[#4c2c14] bg-[#311d0c] p-4">
                <label className="mb-2 block text-xs font-medium text-[#c8a878]">本章大纲</label>
                <textarea rows={4} value={activeChapter?.outline ?? ""} onChange={(e) => updateActiveChapter({ outline: e.target.value })}
                  className="w-full resize-none bg-transparent text-sm leading-6 text-[#f0e6d3] outline-none placeholder:text-[#5a3820]"
                  placeholder="这一章要写什么？几个关键节拍或场景……" />
              </div>
              <div className="rounded-2xl border border-[#4c2c14] bg-[#311d0c] p-4">
                <label className="mb-2 block text-xs font-medium text-[#c8a878]">本次指令</label>
                <textarea rows={3} value={activeChapter?.aiInstruction ?? ""} onChange={(e) => updateActiveChapter({ aiInstruction: e.target.value })}
                  className="w-full resize-none bg-transparent text-sm leading-6 text-[#f0e6d3] outline-none placeholder:text-[#5a3820]"
                  placeholder="对 AI 的特别要求，比如：重点写眼神交流，不要推进剧情……" />
              </div>
            </div>
            {modelOptions.length > 0 && (
              <div className="mt-3 rounded-2xl border border-[#4c2c14] bg-[#311d0c] p-4">
                <label className="mb-2 block text-xs font-medium text-[#c8a878]">本次模型</label>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-xl border border-[#4c2c14] bg-[#261609] px-3 py-2 text-sm text-[#f0e6d3] outline-none">
                  {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}
            <button onClick={handleAIWrite}
              className={`mt-4 w-full rounded-xl px-4 py-3 text-sm text-amber-50 transition ${aiStreaming ? "bg-[#6a4020] hover:bg-[#4c2c14]" : "bg-[#6e4b2d] hover:bg-[#58391f]"}`}>
              {aiStreaming ? "⏹ 停止生成" : "✍️ AI 扩写"}
            </button>
            {aiDraft && (
              <div className="mt-3 rounded-2xl border border-[#4c2c14] bg-[#261609] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#c8a878]">草稿 · {aiDraft.replace(/\s/g, "").length} 字</span>
                  <button onClick={() => setAiDraft("")} className="text-xs text-[#8a6040] hover:text-[#c8a878] transition">清空</button>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-[#e8d5b7]">
                  {aiDraft}{aiStreaming && <span className="animate-pulse text-[#c8a878]">▍</span>}
                </p>
                {!aiStreaming && (
                  <button onClick={handleAppendDraft} className="mt-3 w-full rounded-xl bg-[#6e4b2d] px-4 py-2 text-xs text-amber-50 transition hover:bg-[#58391f]">追加到正文 →</button>
                )}
              </div>
            )}
          </section>

          {/* Text analysis */}
          <section>
            <p className="mb-3 text-sm font-medium text-[#c8a878]">文本检测</p>
            <div className="flex gap-2">
              <button onClick={handleRepeatAnalysis}
                className={`flex-1 rounded-xl border py-2 text-xs transition ${analysisMode === "repeat" ? "border-[#6e4b2d] bg-[#6e4b2d] text-amber-50" : "border-[#6a4020] text-[#c8a878] hover:bg-[#311d0c]"}`}>
                重复词
              </button>
              <button onClick={handleAIAnalysis}
                className={`flex-1 rounded-xl border py-2 text-xs transition ${analysisMode === "ai" ? "border-[#6e4b2d] bg-[#6e4b2d] text-amber-50" : "border-[#6a4020] text-[#c8a878] hover:bg-[#311d0c]"}`}>
                {aiAnalyzing ? "检测中…" : "AI 检测"}
              </button>
            </div>
            {AnalysisResults}
          </section>
        </aside>
      </div>

      {/* Footer */}
      <footer className="hidden items-center gap-6 border-t border-[#4c2c14] bg-[#261609]/90 px-8 py-3 text-xs text-[#c8a878] md:flex">
        <span>{wordCount} 字</span>
        <span>{characterCount} 字符</span>
        <span>{paragraphCount} 段</span>
        <span className="ml-auto text-[#8a6040]">共 {bookChapters.length} 章</span>
      </footer>
    </main>
  );
}
