"use client";

import { useEffect, useRef, useState } from "react";

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

function buildAdvisorPrompt(
  bookId: string,
  chapters: Chapter[],
  activeChapterId: string,
): string {
  let dna = "";
  let soul = "";
  let characters: Record<string, string>[] = [];
  let adultSettings = "";

  try {
    const raw = localStorage.getItem("writing-dna");
    if (raw) {
      const d = JSON.parse(raw);
      dna = [
        d.writingStyle && `写作风格：${d.writingStyle}`,
        d.narrativePov && `叙事视角：${d.narrativePov}`,
        d.toneVoice && `语调：${d.toneVoice}`,
        d.avoidWords && `避免用词：${d.avoidWords}`,
        d.taboos && `禁忌：${d.taboos}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
  } catch {}

  try {
    const raw = localStorage.getItem(`book-soul-${bookId}`);
    if (raw) {
      const s = JSON.parse(raw);
      soul = [
        s.genre && `类型：${s.genre}`,
        s.theme && `主题：${s.theme}`,
        s.worldview && `世界观：${s.worldview}`,
        s.coreConflict && `核心冲突：${s.coreConflict}`,
        s.emotionalCore && `情感内核：${s.emotionalCore}`,
        s.targetReader && `目标读者：${s.targetReader}`,
        s.extraNotes && `备注：${s.extraNotes}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
  } catch {}

  try {
    const raw = localStorage.getItem("book-characters");
    if (raw) {
      const all = JSON.parse(raw);
      characters = all.filter(
        (c: Record<string, string>) => c.bookId === bookId,
      );
    }
  } catch {}

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

  const chapterMap = bookChapters
    .map(
      (c, i) =>
        `第${i + 1}章《${c.title || "未命名"}》${c.outline ? `\n  大纲：${c.outline}` : ""}`,
    )
    .join("\n");

  const recentChapters = bookChapters
    .slice(Math.max(0, activeIdx - 2), activeIdx)
    .map((c) => `【${c.title}】\n${c.content}`)
    .join("\n\n---\n\n");

  const currentChapter = bookChapters[activeIdx];

  let prompt =
    `你是这本书的写作军师，深度了解这本书的一切，帮助作者策划剧情、构建结构、分析人物、触发灵感。` +
    `你的风格是：直接、有洞察力、像一个真正懂创作的编辑朋友。`;

  if (soul) prompt += `\n\n## 书籍灵魂\n${soul}`;
  if (dna) prompt += `\n\n## 作者写作风格\n${dna}`;
  if (adultSettings) prompt += `\n\n## 作品设定\n${adultSettings}`;

  if (characters.length > 0) {
    prompt += `\n\n## 人物档案`;
    for (const ch of characters) {
      prompt += `\n\n### ${ch.name}${ch.alias ? `（${ch.alias}）` : ""}`;
      if (ch.role) prompt += `\n角色定位：${ch.role}`;
      if (ch.age || ch.gender)
        prompt += `\n基本信息：${[ch.age && `${ch.age}岁`, ch.gender].filter(Boolean).join("，")}`;
      if (ch.appearance) prompt += `\n外貌：${ch.appearance}`;
      if (ch.personality) prompt += `\n性格：${ch.personality}`;
      if (ch.personalityOrigin)
        prompt += `\n性格形成原因：${ch.personalityOrigin}`;
      if (ch.background) prompt += `\n成长背景：${ch.background}`;
      if (ch.relationships) prompt += `\n关系网络：${ch.relationships}`;
      if (ch.speechPattern) prompt += `\n说话方式：${ch.speechPattern}`;
      if (ch.aiNotes) prompt += `\n给AI的特别说明：${ch.aiNotes}`;
    }
  }

  if (chapterMap) prompt += `\n\n## 全书章节目录\n${chapterMap}`;
  if (recentChapters) prompt += `\n\n## 近期章节正文\n${recentChapters}`;
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
      const baseUrl =
        (ms.baseUrl ?? "").replace(/\/$/, "") || "https://api.openai.com";
      const apiKey = ms.apiKey ?? "";
      const systemPrompt = buildAdvisorPrompt(bookId, chapters, activeChapterId);

      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: abort.signal,
        body: JSON.stringify({
          model: selectedModel,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...nextMsgs.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("no reader");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              accumulated += delta;
              setMessages([
                ...nextMsgs,
                { role: "assistant", content: accumulated },
              ]);
            }
          } catch {}
        }
      }
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
                try {
                  localStorage.setItem(modelKey, e.target.value);
                } catch {}
              }}
              className="rounded-lg border border-[#6a4020] bg-[#311d0c] px-2 py-1 text-xs text-[#c8a878] outline-none"
            >
              {modelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleClear}
            className="text-xs text-[#8a6040] transition hover:text-[#c8a878]"
          >
            清空
          </button>
        </div>
      </div>

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
