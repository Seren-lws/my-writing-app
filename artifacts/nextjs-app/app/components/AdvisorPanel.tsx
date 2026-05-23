"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeBaseUrl, streamChat } from "../lib/aiClient";

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
          s.tone && `基调：${s.tone}`,
          s.dynamics && `人物动力：${s.dynamics}`,
          s.worldbuilding && `世界观：${s.worldbuilding}`,
          s.redlines && `红线：${s.redlines}`,
          s.keywords && `关键词：${s.keywords}`,
          s.aiReminders && `AI提醒：${s.aiReminders}`,
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
    <div className="flex h-full flex-col bg-[#261609]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[#4c2c14] px-4 py-2">
        <span className="text-sm font-medium text-[#d4a05a]">写作军师</span>
        <div className="flex items-center gap-3">
          {modelOptions.length > 0 && (
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                try { localStorage.setItem(modelKey, e.target.value); } catch {}
              }}
              className="rounded-lg border border-[#6a4020] bg-[#311d0c] px-2 py-1 text-xs text-[#c8a878] outline-none"
            >
              {modelOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowContext((v) => !v)}
            title="查看本次注入的上下文"
            className={`text-xs transition ${showContext ? "text-[#d4a05a]" : "text-[#8a6040] hover:text-[#c8a878]"}`}
          >
            {showContext ? "收起上下文 ↑" : "上下文预览"}
          </button>
          <button
            onClick={handleClear}
            className="text-xs text-[#8a6040] transition hover:text-[#c8a878]"
          >
            清空
          </button>
        </div>
      </div>

      {/* Context preview panel */}
      {showContext && (
        <div className="shrink-0 overflow-y-auto border-b border-[#4c2c14] bg-[#1c1006]" style={{ maxHeight: "55%" }}>
          <div className="px-4 py-3 space-y-1.5">
            <p className="mb-2 text-[10px] tracking-widest text-[#6a4020] uppercase">AI 读取的上下文（与实际发送一致）</p>
            {contextSections.map(({ label, icon, content }) => {
              const isOpen = !!openSections[label];
              const isEmpty = !content.trim();
              return (
                <div key={label} className="rounded-xl border border-[#3a2010] bg-[#261609] overflow-hidden">
                  <button
                    onClick={() => !isEmpty && toggleSection(label)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left transition ${isEmpty ? "cursor-default" : "hover:bg-[#311d0c]"}`}
                  >
                    <span className="text-sm">{icon}</span>
                    <span className="flex-1 text-xs font-medium text-[#c8a878]">{label}</span>
                    {isEmpty ? (
                      <span className="text-[10px] text-[#4a2c10] rounded-full border border-[#3a2010] px-2 py-0.5">未填写</span>
                    ) : (
                      <span className="text-[10px] text-[#6a8040] rounded-full border border-[#3a4010] px-2 py-0.5">已注入</span>
                    )}
                    {!isEmpty && (
                      <span className="text-[#6a4020] text-xs ml-1">{isOpen ? "▲" : "▼"}</span>
                    )}
                  </button>
                  {isOpen && !isEmpty && (
                    <div className="border-t border-[#3a2010] px-3 py-2.5">
                      <pre className="whitespace-pre-wrap font-sans text-xs leading-5 text-[#b89060]">{content}</pre>
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
          <p className="pt-4 text-center text-sm text-[#8a6040]">
            有什么剧情想聊？军师随时在线。
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                m.role === "user"
                  ? "bg-[#6e4b2d] text-amber-50"
                  : "border border-[#4c2c14] bg-[#311d0c] text-[#f0e6d3]"
              }`}
            >
              {m.content ||
                (streaming && i === messages.length - 1 ? "▍" : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#4c2c14] p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-[#6a4020] bg-[#311d0c] px-4 py-2">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="跟军师说…（Enter 发送，Shift+Enter 换行）"
            className="flex-1 resize-none bg-transparent text-sm leading-6 text-[#f0e6d3] outline-none placeholder:text-[#5a3820]"
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
