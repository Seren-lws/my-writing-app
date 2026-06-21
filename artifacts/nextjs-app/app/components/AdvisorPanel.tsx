"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { normalizeBaseUrl, streamChat } from "../lib/aiClient";

const mdComponents: Components = {
  p: ({ children }) => <p className="mb-2 leading-6 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-6">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-[#3a2516]">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => <h1 className="mb-2 mt-1 text-base font-semibold text-[#3a2516] first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-1 text-sm font-semibold text-[#3a2516] first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1 mt-1 text-sm font-semibold text-[#5a3f28] first:mt-0">{children}</h3>,
  blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-[#d8b98f] pl-3 italic text-[#6e5038]">{children}</blockquote>,
  a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="text-[#9b6a3a] underline">{children}</a>,
  code: ({ children }) => <code className="rounded bg-[#f0e6d3] px-1 py-0.5 text-[13px] text-[#6e4b2d]">{children}</code>,
  pre: ({ children }) => <pre className="my-2 overflow-x-auto rounded-lg bg-[#f0e6d3] p-3 text-[13px] leading-5 text-[#5a3f28]">{children}</pre>,
  hr: () => <hr className="my-2 border-[#e0c9a5]" />,
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

type Message = { role: "user" | "assistant"; content: string };

// ── Context sections (for preview + prompt building) ──────────────────────

type ContextSection = { label: string; icon: string; content: string };

function buildContextSections(
  bookId: string,
  chapters: Chapter[],
  activeChapterId: string,
): ContextSection[] {
  // 1. Writing DNA
  let dnaText = "";
  try {
    const raw = localStorage.getItem("writing-dna");
    if (raw) {
      const d = JSON.parse(raw);
      dnaText = [
        d.languageStyle && `语言风格：${d.languageStyle}`,
        d.writingPrefs && `写作偏好：${d.writingPrefs}`,
        d.taboos && `禁忌：${d.taboos}`,
        d.references && `参考作品：${d.references}`,
        d.dynamics && `人物关系与张力：${d.dynamics}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
  } catch {}

  // 2. Soul card
  let soulText = "";
  try {
    const raw = localStorage.getItem("book-souls");
    if (raw) {
      const souls = JSON.parse(raw);
      const s = Array.isArray(souls)
        ? souls.find((x: Record<string, string>) => x.bookId === bookId)
        : null;
      if (s) {
        soulText = [
          s.worldview && `世界观：${s.worldview}`,
          s.styleGuide && `文风参考与指导：${s.styleGuide}`,
          s.materials && `写作素材参考：${s.materials}`,
          s.highlights && `主要梗点和看点：${s.highlights}`,
          s.forbidden && `禁区：${s.forbidden}`,
          s.notes && `其他补充：${s.notes}`,
          s.relationsOverview && `角色关系概况：${s.relationsOverview}`,
        ]
          .filter(Boolean)
          .join("\n");
      }
    }
  } catch {}

  // 3. Characters
  let characters: Record<string, string>[] = [];
  try {
    const raw = localStorage.getItem("book-characters");
    if (raw) {
      const all = JSON.parse(raw);
      characters = all.filter((c: Record<string, string>) => c.bookId === bookId);
    }
  } catch {}
  const charText = characters.length > 0
    ? characters
        .map((c) =>
          [
            `• ${c.name}${c.alias ? `（${c.alias}）` : ""}${c.role ? ` ［${c.role}］` : ""}`,
            c.age || c.gender
              ? `  ${[c.age && `${c.age}岁`, c.gender].filter(Boolean).join("·")}`
              : "",
            c.personality ? `  性格：${c.personality}` : "",
            c.speechPattern ? `  说话方式：${c.speechPattern}` : "",
            c.aiNotes ? `  AI备注：${c.aiNotes}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n")
    : "";

  // 4. Current chapter
  const bookChapters = chapters.filter((c) => c.bookId === bookId);
  const activeIdx = bookChapters.findIndex((c) => c.id === activeChapterId);
  const cur = bookChapters[activeIdx];
  let curText = "";
  if (cur) {
    curText = `标题：${cur.title || "（未命名）"}`;
    if (cur.outline) curText += `\n大纲：${cur.outline}`;
    if (cur.content) {
      const preview = cur.content.slice(0, 200);
      curText += `\n正文前 200 字：\n${preview}${cur.content.length > 200 ? "…（共 " + cur.content.replace(/\s/g, "").length + " 字）" : ""}`;
    } else {
      curText += "\n正文：（暂无）";
    }
  }

  // 5. Recent chapters (up to 2 before current)
  const recentList = bookChapters.slice(Math.max(0, activeIdx - 2), activeIdx);
  const recentText = recentList.length > 0
    ? recentList
        .map((c) => {
          const preview = c.content.slice(0, 120);
          return `【${c.title || "未命名"}】\n${preview}${c.content.length > 120 ? "…（共 " + c.content.replace(/\s/g, "").length + " 字）" : "（共 " + c.content.replace(/\s/g, "").length + " 字）"}`;
        })
        .join("\n\n")
    : "";

  return [
    { label: "写作 DNA", icon: "🧬", content: dnaText },
    { label: "书籍灵魂卡", icon: "🪬", content: soulText },
    { label: "人物档案", icon: "👥", content: charText },
    { label: "当前章节", icon: "📄", content: curText },
    { label: "近期章节（传入上文）", icon: "📜", content: recentText },
  ];
}

function buildAdvisorPrompt(
  bookId: string,
  chapters: Chapter[],
  activeChapterId: string,
): string {
  const sections = buildContextSections(bookId, chapters, activeChapterId);
  const [dna, soul, chars, cur, recent] = sections.map((s) => s.content);

  let adultSettings = "";
  try {
    const raw = localStorage.getItem(`adult-settings-${bookId}`);
    if (raw) {
      const a = JSON.parse(raw);
      adultSettings = [
        a.rating && `作品分级：${a.rating}`,
        a.preferences && `描写偏好：${a.preferences}`,
        a.boundaries && `边界设定：${a.boundaries}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
  } catch {}

  const bookChapters = chapters.filter((c) => c.bookId === bookId);
  const activeIdx = bookChapters.findIndex((c) => c.id === activeChapterId);
  const currentChapter = bookChapters[activeIdx];

  const chapterMap = bookChapters
    .map(
      (c, i) =>
        `第${i + 1}章《${c.title || "未命名"}》${c.outline ? `\n  大纲：${c.outline}` : ""}`,
    )
    .join("\n");

  let prompt =
    `你是这本书的写作军师，深度了解这本书的一切，帮助作者策划剧情、构建结构、分析人物、触发灵感。` +
    `你的风格是：直接、有洞察力、像一个真正懂创作的编辑朋友。`;

  if (soul) prompt += `\n\n## 书籍灵魂\n${soul}`;
  if (dna) prompt += `\n\n## 作者写作风格\n${dna}`;
  if (adultSettings) prompt += `\n\n## 作品设定\n${adultSettings}`;

  if (chars) {
    // Re-read full character data for the complete prompt
    let fullChars: Record<string, string>[] = [];
    try {
      const raw = localStorage.getItem("book-characters");
      if (raw) {
        const all = JSON.parse(raw);
        fullChars = all.filter((c: Record<string, string>) => c.bookId === bookId);
      }
    } catch {}
    if (fullChars.length > 0) {
      prompt += `\n\n## 人物档案`;
      for (const ch of fullChars) {
        prompt += `\n\n### ${ch.name}${ch.alias ? `（${ch.alias}）` : ""}`;
        if (ch.role) prompt += `\n角色定位：${ch.role}`;
        if (ch.age || ch.gender)
          prompt += `\n基本信息：${[ch.age && `${ch.age}岁`, ch.gender].filter(Boolean).join("，")}`;
        if (ch.appearance) prompt += `\n外貌：${ch.appearance}`;
        if (ch.personality) prompt += `\n性格：${ch.personality}`;
        if (ch.personalityOrigin) prompt += `\n性格形成原因：${ch.personalityOrigin}`;
        if (ch.background) prompt += `\n成长背景：${ch.background}`;
        if (ch.relationships) prompt += `\n关系网络：${ch.relationships}`;
        if (ch.speechPattern) prompt += `\n说话方式：${ch.speechPattern}`;
        if (ch.aiNotes) prompt += `\n给AI的特别说明：${ch.aiNotes}`;
      }
    }
  }

  if (chapterMap) prompt += `\n\n## 全书章节目录\n${chapterMap}`;
  if (recent) prompt += `\n\n## 近期章节正文\n${recent}`;
  if (currentChapter) {
    prompt += `\n\n## 当前章节《${currentChapter.title}》`;
    if (currentChapter.outline) prompt += `\n大纲：${currentChapter.outline}`;
    if (currentChapter.content)
      prompt += `\n\n正文：\n${currentChapter.content}`;
  }

  return prompt;
}

type Props = {
  bookId: string;
  chapters: Chapter[];
  activeChapterId: string;
};

export default function AdvisorPanel({
  bookId,
  chapters,
  activeChapterId,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const historyKey = `writing-advisor-${bookId}`;
  const modelKey = `writing-advisor-model-${bookId}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(historyKey);
      if (raw) setMessages(JSON.parse(raw));
    } catch {}
    try {
      const raw = localStorage.getItem("ai-model-settings");
      if (raw) {
        const ms = JSON.parse(raw);
        const lines = (ms.modelsText ?? "")
          .split("\n")
          .map((l: string) => l.trim())
          .filter(Boolean);
        const def = ms.defaultModel?.trim() ?? "";
        // 默认模型始终排第一，可选模型列表去重追加在后面
        const opts = def
          ? [def, ...lines.filter((l: string) => l !== def)]
          : lines;
        setModelOptions(opts);
        const saved = localStorage.getItem(modelKey);
        // 优先用上次保存的，但要确保它在列表里
        setSelectedModel(saved && opts.includes(saved) ? saved : opts[0] ?? "");
      }
    } catch {}
  }, [historyKey, modelKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function saveMessages(msgs: Message[]) {
    setMessages(msgs);
    try {
      localStorage.setItem(historyKey, JSON.stringify(msgs));
    } catch {}
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text };
    const nextMsgs = [...messages, userMsg];
    saveMessages(nextMsgs);
    setStreaming(true);

    const abort = new AbortController();
    abortRef.current = abort;
    let accumulated = "";
    setMessages([...nextMsgs, { role: "assistant", content: "" }]);

    try {
      const raw = localStorage.getItem("ai-model-settings");
      const ms = raw ? JSON.parse(raw) : {};
      const systemPrompt = buildAdvisorPrompt(bookId, chapters, activeChapterId);

      await streamChat({
        baseUrl: normalizeBaseUrl(ms.baseUrl ?? "https://api.openai.com/v1"),
        apiKey: ms.apiKey ?? "",
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...nextMsgs.map((m) => ({ role: m.role, content: m.content })),
        ],
        signal: abort.signal,
        onDelta: (delta) => {
          accumulated += delta;
          setMessages([...nextMsgs, { role: "assistant", content: accumulated }]);
        },
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        accumulated = accumulated || "（请求出错，请检查模型设置）";
        setMessages([...nextMsgs, { role: "assistant", content: accumulated }]);
      }
    } finally {
      saveMessages([
        ...nextMsgs,
        { role: "assistant", content: accumulated },
      ]);
      setStreaming(false);
    }
  }

  function handleClear() {
    if (!confirm("清空聊天记录？书的档案不会丢失。")) return;
    saveMessages([]);
  }

  const contextSections = buildContextSections(bookId, chapters, activeChapterId);

  function toggleSection(label: string) {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <div className="flex h-full flex-col bg-[#f8f0df]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[#e0c9a5] px-4 py-2">
        <span className="text-sm font-medium text-[#6e4b2d]">写作军师</span>
        <div className="flex items-center gap-3">
          {modelOptions.length > 0 && (
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                try { localStorage.setItem(modelKey, e.target.value); } catch {}
              }}
              className="rounded-lg border border-[#d8b98f] bg-[#fff8eb] px-2 py-1 text-xs text-[#6e4b2d] outline-none"
            >
              {modelOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowContext((v) => !v)}
            title="查看本次注入的上下文"
            className={`text-xs transition ${showContext ? "text-[#6e4b2d]" : "text-[#a98a68] hover:text-[#6e4b2d]"}`}
          >
            {showContext ? "收起上下文 ↑" : "上下文预览"}
          </button>
          <button
            onClick={handleClear}
            className="text-xs text-[#a98a68] transition hover:text-[#6e4b2d]"
          >
            清空
          </button>
        </div>
      </div>

      {/* Context preview panel */}
      {showContext && (
        <div className="shrink-0 overflow-y-auto border-b border-[#e0c9a5] bg-[#fbf3e2]" style={{ maxHeight: "55%" }}>
          <div className="px-4 py-3 space-y-1.5">
            <p className="mb-2 text-[10px] tracking-widest text-[#a98a68] uppercase">AI 读取的上下文（与实际发送一致）</p>
            {contextSections.map(({ label, icon, content }) => {
              const isOpen = !!openSections[label];
              const isEmpty = !content.trim();
              return (
                <div key={label} className="rounded-xl border border-[#e0c9a5] bg-[#fff8eb] overflow-hidden">
                  <button
                    onClick={() => !isEmpty && toggleSection(label)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left transition ${isEmpty ? "cursor-default" : "hover:bg-[#fff2e0]"}`}
                  >
                    <span className="text-sm">{icon}</span>
                    <span className="flex-1 text-xs font-medium text-[#6e4b2d]">{label}</span>
                    {isEmpty ? (
                      <span className="text-[10px] text-[#b89a78] rounded-full border border-[#e0c9a5] px-2 py-0.5">未填写</span>
                    ) : (
                      <span className="text-[10px] text-[#5d7a3a] rounded-full border border-[#cfdcb5] px-2 py-0.5">已注入</span>
                    )}
                    {!isEmpty && (
                      <span className="text-[#a98a68] text-xs ml-1">{isOpen ? "▲" : "▼"}</span>
                    )}
                  </button>
                  {isOpen && !isEmpty && (
                    <div className="border-t border-[#ecdcc0] px-3 py-2.5">
                      <pre className="whitespace-pre-wrap font-sans text-xs leading-5 text-[#6e5038]">{content}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="pt-4 text-center text-sm text-[#a98a68]">
            有什么剧情想聊？军师随时在线。
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                m.role === "user"
                  ? "whitespace-pre-wrap bg-[#6e4b2d] text-amber-50"
                  : "border border-[#e0c9a5] bg-[#fff8eb] text-[#4f3524]"
              }`}
            >
              {m.role === "user" ? (
                m.content
              ) : m.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={mdComponents}>
                  {m.content}
                </ReactMarkdown>
              ) : streaming && i === messages.length - 1 ? (
                "▍"
              ) : null}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#e0c9a5] p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-[#d8b98f] bg-[#fff8eb] px-4 py-2">
          <textarea
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="跟军师说…（Enter 发送，Shift+Enter 换行）"
            className="flex-1 resize-none bg-transparent text-sm leading-6 text-[#4f3524] outline-none placeholder:text-[#c7a984]"
          />
          <button
            onClick={sendMessage}
            disabled={streaming}
            className="shrink-0 rounded-full bg-[#6e4b2d] px-4 py-1.5 text-xs text-amber-50 transition hover:bg-[#58391f] disabled:opacity-50"
          >
            {streaming ? "…" : "发送"}
          </button>
        </div>
      </div>
    </div>
  );
}
