"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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
};

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const POV_OPTIONS = [
  { value: "third", label: "第三人称" },
  { value: "first_hero", label: "第一人称（主角视角）" },
  { value: "first_observer", label: "第一人称（旁观者）" },
];

const STYLE_OPTIONS = [
  { value: "emotional", label: "细腻情绪流" },
  { value: "restrained", label: "克制留白" },
  { value: "action", label: "动作推进" },
];

const DETAIL_OPTIONS = [
  { value: "concise", label: "精炼" },
  { value: "balanced", label: "适中" },
  { value: "expanded", label: "铺展" },
];

function buildSystemPrompt(params: {
  pov: string;
  style: string;
  detail: string;
  custom: string;
  writingDNA: WritingDNA;
}): string {
  const { pov, style, detail, custom, writingDNA } = params;

  const povLabel = POV_OPTIONS.find((o) => o.value === pov)?.label ?? pov;
  const styleLabel = STYLE_OPTIONS.find((o) => o.value === style)?.label ?? style;
  const detailLabel = DETAIL_OPTIONS.find((o) => o.value === detail)?.label ?? detail;

  const sections: string[] = [
    `你是一个擅长把对话、聊天记录或跑团剧本改写为小说正文的写手助手。你输出的内容永远是草稿，供作者修改参考，不会直接成为最终版本。`,

    `【改写设置】
叙述视角：${povLabel}
文体风格：${styleLabel}
详略程度：${detailLabel}${custom.trim() ? `\n特别要求：${custom.trim()}` : ""}`,
  ];

  const dnaLines = [
    writingDNA.languageStyle && `语言风格：${writingDNA.languageStyle}`,
    writingDNA.preferences && `写作偏好：${writingDNA.preferences}`,
    writingDNA.taboos && `禁忌：${writingDNA.taboos}`,
  ].filter(Boolean);

  if (dnaLines.length > 0) {
    sections.push(`【作者写作风格参考】\n${dnaLines.join("\n")}`);
  }

  sections.push(
    `请把用户提供的对话改写为小说正文草稿。保留原有的情感走向和事件，不要添加原文没有的情节。直接输出正文，不要加解释或说明。`,
  );

  return sections.join("\n\n");
}

export default function TransformPage() {
  const [dialogue, setDialogue] = useState("");
  const [pov, setPov] = useState("third");
  const [style, setStyle] = useState("emotional");
  const [detail, setDetail] = useState("balanced");
  const [custom, setCustom] = useState("");
  const [output, setOutput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ai-model-settings");
      if (raw) {
        const ms = JSON.parse(raw) as ModelSettings;
        const lines = (ms.modelsText ?? "")
          .split("\n")
          .map((l: string) => l.trim())
          .filter(Boolean);
        const def = ms.defaultModel?.trim() ?? "";
        const opts = def ? [def, ...lines.filter((l: string) => l !== def)] : lines;
        setModelOptions(opts);
        setSelectedModel(opts[0] ?? "");
      }
    } catch {}
  }, []);

  async function handleTransform() {
    const ms = safeParse<ModelSettings | null>("ai-model-settings", null);
    if (!ms?.baseUrl || !ms?.apiKey) {
      setError("请先在模型设置中配置 API URL 和密钥");
      return;
    }
    if (!dialogue.trim()) {
      setError("请先输入对话内容");
      return;
    }

    const writingDNA = safeParse<WritingDNA>("writing-dna", {});
    const systemPrompt = buildSystemPrompt({ pov, style, detail, custom, writingDNA });

    setOutput("");
    setError("");
    setIsStreaming(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${ms.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ms.apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel || ms.defaultModel,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `请将以下对话改写为小说正文草稿：\n\n${dialogue}`,
            },
          ],
          stream: true,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`请求失败：${res.status} ${res.statusText}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break outer;
          try {
            const json = JSON.parse(payload);
            const text = json.choices?.[0]?.delta?.content;
            if (text) setOutput((prev) => prev + text);
          } catch {}
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message || "请求失败，请检查配置");
      }
    } finally {
      setIsStreaming(false);
    }
  }

  const selectClass =
    "w-full rounded-xl border border-[#e0c9a5] bg-[#fff8eb] px-3 py-2 text-sm text-[#4f3524] outline-none focus:border-[#9b744d] transition cursor-pointer";

  return (
    <main className="min-h-screen bg-[#f8f0df] text-[#4f3524]">
      <div className="mx-auto max-w-3xl px-8 py-10">

        {/* Header */}
        <header className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-block text-sm text-[#9b744d] transition hover:text-[#4f3524]"
          >
            ← 回到小屋
          </Link>
          <h1 className="text-3xl font-semibold text-[#4f3524]">对话炼字</h1>
          <p className="mt-2 text-sm text-[#9b744d]">
            把角色的声音，炼成小说里的文字。
          </p>
        </header>

        {/* Input */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-[#6e4b2d]">原始对话</label>
            {dialogue.replace(/\s/g, "").length > 0 && (
              <span className="text-xs text-[#c7a984]">
                {dialogue.replace(/\s/g, "").length} 字
              </span>
            )}
          </div>
          <div className="rounded-2xl border border-[#d8b98f] bg-[#fff8eb] p-5 shadow-inner">
            <textarea
              value={dialogue}
              onChange={(e) => setDialogue(e.target.value)}
              rows={10}
              className="w-full resize-none bg-transparent text-sm leading-7 text-[#4f3524] outline-none placeholder:text-[#c7a984]"
              placeholder={"A：你昨晚为什么没回消息？\nB：……我看到了，只是不知道怎么回。\nA：（沉默片刻）那你现在知道了吗？\nB：还是不知道。但我想当面说。"}
            />
          </div>
        </section>

        {/* Settings */}
        <section className="my-5 rounded-2xl border border-[#e0c9a5] bg-[#fffaf0] p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#9b744d]">叙述视角</label>
              <select value={pov} onChange={(e) => setPov(e.target.value)} className={selectClass}>
                {POV_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#9b744d]">文体风格</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className={selectClass}>
                {STYLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#9b744d]">详略程度</label>
              <select value={detail} onChange={(e) => setDetail(e.target.value)} className={selectClass}>
                {DETAIL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#9b744d]">特别要求</label>
              <input
                type="text"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="重点写眼神，少写对白……"
                className="w-full rounded-xl border border-[#e0c9a5] bg-[#fff8eb] px-3 py-2 text-sm text-[#4f3524] outline-none placeholder:text-[#c7a984] focus:border-[#9b744d] transition"
              />
            </div>
          </div>

          {modelOptions.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <label className="shrink-0 text-xs text-[#9b744d]">模型</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className={selectClass}
              >
                {modelOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              onClick={isStreaming ? () => abortRef.current?.abort() : handleTransform}
              className={`rounded-full px-8 py-2.5 text-sm text-amber-50 transition ${
                isStreaming
                  ? "bg-[#9b744d] hover:bg-[#7a5a38]"
                  : "bg-[#6e4b2d] hover:bg-[#58391f]"
              }`}
            >
              {isStreaming ? "停止" : "开始炼字 🔥"}
            </button>
          </div>
        </section>

        {/* Output */}
        {(output || error || isStreaming) && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-[#6e4b2d]">
                炼成的正文（草稿）
              </label>
              {output && (
                <span className="text-xs text-[#c7a984]">
                  {output.replace(/\s/g, "").length} 字
                </span>
              )}
            </div>

            {error && (
              <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {(output || isStreaming) && (
              <div className="rounded-2xl border border-[#ead8b8] bg-[#fffaf0] p-6 shadow-sm">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-8 text-[#4f3524]">
                  {output}
                  {isStreaming && (
                    <span className="animate-pulse text-[#9b744d]">▋</span>
                  )}
                </pre>
              </div>
            )}

            {output && !isStreaming && (
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(output)}
                  className="rounded-full border border-[#d8b98f] px-5 py-2 text-sm text-[#6e4b2d] transition hover:bg-white"
                >
                  复制正文
                </button>
                <button
                  onClick={() => { setDialogue(""); setOutput(""); }}
                  className="rounded-full border border-[#d8b98f] px-5 py-2 text-sm text-[#9b744d] transition hover:bg-white"
                >
                  重新开始
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
