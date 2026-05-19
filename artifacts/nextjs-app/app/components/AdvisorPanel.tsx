"use client";

import { useEffect, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

type Chapter = {
  id: string;
  bookId: string;
  title: string;
  content: string;
  outline: string;
  aiInstruction: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ModelSettings = {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  modelsText: string;
};

type WritingDNA = {
  languageStyle?: string;
  preferences?: string;
  taboos?: string;
  references?: string;
  relationshipTension?: string;
};

type BookSoul = {
  bookId: string;
  tone?: string;
  relationship?: string;
  worldRules?: string;
  mustNotBreak?: string;
  keywords?: string;
  aiReminder?: string;
};

type Character = {
  id: string;
  bookId: string;
  name: string;
  alias: string;
  age: string;
  gender: string;
  role: string;
  appearance: string;
  personality: string;
  personalityOrigin: string;
  background: string;
  relationships: string;
  speechPattern: string;
  aiNotes: string;
};

type AdultSettings = {
  enabled: boolean;
  rating: string;
  writingStyle: string;
  relationBoundary: string;
};

type Props = {
  bookId: string;
  bookTitle: string;
  chapters: Chapter[];
  activeChapterId: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function safeParse<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}

// ── System prompt ──────────────────────────────────────────────────────────

function buildAdvisorPrompt(params: {
  bookTitle: string;
  writingDNA: WritingDNA;
  soul: BookSoul | undefined;
  characters: Character[];
  chapters: Chapter[];
  activeChapterId: string;
  adultSettings: AdultSettings | null;
}): string {
  const { bookTitle, writingDNA, soul, characters, chapters, activeChapterId, adultSettings } = params;
  const sections: string[] = [];

  sections.push(
    `你是《${bookTitle || "这本书"}》的写作军师。` +
    `帮助作者从宏观视角把握全书，提供剧情策略、结构分析、人物洞察、灵感触发等创作智慧。` +
    `你不替作者写正文，而是分析、提问、给可能性、指出问题。` +
    `语气像一个懂创作的直接朋友：有料、不废话、敢直说。`
  );

  // Writing DNA
  const dnaLines = [
    writingDNA.languageStyle && `语言风格：${writingDNA.languageStyle}`,
    writingDNA.preferences && `写作偏好：${writingDNA.preferences}`,
    writingDNA.taboos && `禁忌：${writingDNA.taboos}`,
    writingDNA.references && `参考作品：${writingDNA.references}`,
    writingDNA.relationshipTension && `人物关系偏好：${writingDNA.relationshipTension}`,
  ].filter(Boolean);
  if (dnaLines.length > 0) sections.push(`【作者写作 DNA】\n${dnaLines.join("\n")}`);

  // Book soul
  if (soul) {
    const lines = [
      `书名：${bookTitle}`,
      soul.tone && `核心基调：${soul.tone}`,
      soul.relationship && `主角关系与张力：${soul.relationship}`,
      soul.worldRules && `世界观规则：${soul.worldRules}`,
      soul.mustNotBreak && `绝对不能崩的地方：${soul.mustNotBreak}`,
      soul.keywords && `本书关键词：${soul.keywords}`,
      soul.aiReminder && `创作提醒：${soul.aiReminder}`,
    ].filter(Boolean);
    sections.push(`【书籍灵魂】\n${lines.join("\n")}`);
  }

  // Characters
  if (characters.length > 0) {
    const charText = characters.map((c) => {
      const lines: string[] = [`${c.role ? `[${c.role}] ` : ""}${c.name || "未命名"}`];
      if (c.alias) lines.push(`  别名：${c.alias}`);
      if (c.age || c.gender) lines.push(`  ${[c.age && `${c.age}岁`, c.gender].filter(Boolean).join("，")}`);
      if (c.appearance) lines.push(`  外貌：${c.appearance}`);
      if (c.personality) lines.push(`  性格：${c.personality}`);
      if (c.personalityOrigin) lines.push(`  性格成因：${c.personalityOrigin}`);
      if (c.background) lines.push(`  背景：${c.background}`);
      if (c.relationships) lines.push(`  关系网：${c.relationships}`);
      if (c.speechPattern) lines.push(`  说话方式：${c.speechPattern}`);
      if (c.aiNotes) lines.push(`  ⚠️ 注意：${c.aiNotes}`);
      return lines.join("\n");
    }).join("\n\n");
    sections.push(`【角色档案】\n${charText}`);
  }

  // Chapter map — all outlines
  const chapterMap = chapters.map((c, i) => {
    const wc = c.content.replace(/\s/g, "").length;
    const isCurrent = c.id === activeChapterId;
    const header = `第${i + 1}章《${c.title}》（${wc > 0 ? `${wc}字` : "未写"}${isCurrent ? "，✍️ 当前" : ""}）`;
    return c.outline ? `${header}\n  大纲：${c.outline}` : header;
  }).join("\n");
  sections.push(`【全书章节地图】\n${chapterMap}`);

  // Recent chapters full text (up to 2 chapters before current)
  const currentIdx = chapters.findIndex((c) => c.id === activeChapterId);
  const recentFull = chapters
    .slice(Math.max(0, currentIdx - 2), currentIdx)
    .filter((c) => c.content.trim());
  if (recentFull.length > 0) {
    const recentText = recentFull.map((c) => {
      const idx = chapters.indexOf(c);
      return `第${idx + 1}章《${c.title}》\n${c.content}`;
    }).join("\n\n---\n\n");
    sections.push(`【最近章节正文】\n${recentText}`);
  }

  // Current chapter
  const activeCh = chapters.find((c) => c.id === activeChapterId);
  if (activeCh) {
    const lines = [`标题：${activeCh.title}`];
    if (activeCh.outline) lines.push(`本章大纲：${activeCh.outline}`);
    if (activeCh.content) lines.push(`已有正文：\n${activeCh.content}`);
    sections.push(`【当前章节】\n${lines.join("\n")}`);
  }

  // Adult settings
  if (adultSettings?.enabled) {
    sections.push(
      `【成人向创作设置】\n作品分级：${adultSettings.rating}\n` +
      `关系边界：${adultSettings.relationBoundary}\n描写风格：${adultSettings.writingStyle}`
    );
  }

  return sections.join("\n\n");
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AdvisorPanel({ bookId, bookTitle, chapters, activeChapterId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const historyKey = `writing-advisor-${bookId}`;
  const modelKey = `writing-advisor-model-${bookId}`;

  useEffect(() => {
    if (!bookId) return;
    setMessages(safeParse<Message[]>(historyKey, []));

    const ms = safeParse<ModelSettings | null>("ai-model-settings", null);
    if (ms) {
      const lines = (ms.modelsText ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
      const opts = lines.length > 0 ? lines : ms.defaultModel ? [ms.defaultModel] : [];
      setModelOptions(opts);
      const saved = localStorage.getItem(modelKey);
      setSelectedModel(saved || ms.defaultModel || opts[0] || "");
    }
  }, [bookId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleModelChange(model: string) {
    setSelectedModel(model);
    if (bookId) localStorage.setItem(modelKey, model);
  }

  function saveHistory(msgs: Message[]) {
    if (bookId) localStorage.setItem(historyKey, JSON.stringify(msgs));
  }

  function handleClear() {
    if (!confirm("清空和军师的对话历史？书的档案不会丢失。")) return;
    setMessages([]);
    saveHistory([]);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;

    const ms = safeParse<ModelSettings | null>("ai-model-settings", null);
    if (!ms?.baseUrl || !ms?.apiKey) {
      const err: Message = { role: "assistant", content: "⚠️ 请先在模型设置中配置 API URL 和密钥。" };
      setMessages((p) => [...p, err]);
      return;
    }

    const userMsg: Message = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    // Build system prompt fresh (captures latest edits)
    const systemPrompt = buildAdvisorPrompt({
      bookTitle,
      writingDNA: safeParse<WritingDNA>("writing-dna", {}),
      soul: safeParse<BookSoul[]>("book-souls", []).find((s) => s.bookId === bookId),
      characters: safeParse<Character[]>("book-characters", []).filter((c) => c.bookId === bookId),
      chapters,
      activeChapterId,
      adultSettings: safeParse<AdultSettings | null>("adult-content-settings", null),
    });

    abortRef.current = new AbortController();
    let accumulated = "";

    try {
      const res = await fetch(`${ms.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ms.apiKey}` },
        body: JSON.stringify({
          model: selectedModel || ms.defaultModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...history.map((m) => ({ role: m.role, content: m.content })),
          ],
          stream: true,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break outer;
          try {
            const t = JSON.parse(payload).choices?.[0]?.delta?.content;
            if (t) {
              accumulated += t;
              setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "assistant", content: accumulated },
              ]);
            }
          } catch {}
        }
      }

      const final = [...history, { role: "assistant" as const, content: accumulated }];
      saveHistory(final);
      setMessages(final);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        const errMsg: Message = { role: "assistant", content: `⚠️ 请求失败：${err.message}` };
        const final = [...history, errMsg];
        setMessages(final);
        saveHistory(final);
      }
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#fffdf8]">

      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[#e0c9a5] px-4 py-2">
        <span className="text-sm font-medium text-[#4f3524]">🎯 写作军师</span>
        <span className="text-xs text-[#c7a984]">— 聊剧情、谋结构、出主意</span>
        <div className="ml-auto flex items-center gap-2">
          {modelOptions.length > 0 && (
            <select value={selectedModel} onChange={(e) => handleModelChange(e.target.value)}
              className="rounded-lg border border-[#e0c9a5] bg-[#fff8eb] px-2 py-1 text-xs text-[#4f3524] outline-none">
              {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
          <button onClick={handleClear}
            className="rounded-lg px-2 py-1 text-xs text-[#c7a984] transition hover:text-[#9b744d]">
            清空对话
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm leading-8 text-[#c7a984]">
              军师已就位，随时准备好了。<br />
              可以问剧情走向、人物动机、结构问题——什么都行。
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-7 ${
              msg.role === "user"
                ? "rounded-br-sm bg-[#6e4b2d] text-amber-50"
                : "rounded-bl-sm border border-[#e0c9a5] bg-white text-[#4f3524] shadow-sm"
            }`}>
              <span className="whitespace-pre-wrap">{msg.content}</span>
              {isStreaming && i === messages.length - 1 && (
                <span className="animate-pulse text-[#9b744d]">▋</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[#e0c9a5] bg-[#fff8eb]/80 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="问军师点什么……（Enter 发送，Shift+Enter 换行）"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-[#e0c9a5] bg-white px-4 py-2.5 text-sm leading-6 text-[#4f3524] outline-none placeholder:text-[#c7a984] focus:border-[#9b744d] transition"
          />
          <button
            onClick={isStreaming ? () => abortRef.current?.abort() : handleSend}
            disabled={!input.trim() && !isStreaming}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm text-amber-50 transition ${
              isStreaming ? "bg-[#9b744d]" : "bg-[#6e4b2d] hover:bg-[#58391f] disabled:opacity-40"
            }`}
          >
            {isStreaming ? "停" : "发"}
          </button>
        </div>
      </div>
    </div>
  );
}
