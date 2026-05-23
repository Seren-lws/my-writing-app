"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { normalizeBaseUrl, streamChat } from "../lib/aiClient";

// ── Types ──────────────────────────────────────────────────────────────────

type ModelSettings = { baseUrl: string; apiKey: string; defaultModel: string; modelsText: string };
type WritingDNA = { languageStyle?: string; writingPrefs?: string; taboos?: string; references?: string; dynamics?: string };

type TransformFavorite = {
  id: string;
  createdAt: string;
  sourceDialogue: string;
  output: string;
  pov: string;
  style: string;
  detail: string;
  custom: string;
  model?: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

const FAVORITES_KEY = "dialogue-transform-favorites";

function safeParse<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}

function loadFavorites(): TransformFavorite[] {
  return safeParse<TransformFavorite[]>(FAVORITES_KEY, []);
}

function saveFavorites(favs: TransformFavorite[]) {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs)); } catch {}
}

async function copyText(text: string): Promise<boolean> {
  // Primary: Clipboard API
  if (navigator?.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
  }
  // Fallback: execCommand
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch { return false; }
}

// ── Options ────────────────────────────────────────────────────────────────

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

function labelOf(opts: { value: string; label: string }[], val: string) {
  return opts.find(o => o.value === val)?.label ?? val;
}

// ── Prompt builder ─────────────────────────────────────────────────────────

function buildSystemPrompt(params: { pov: string; style: string; detail: string; custom: string; writingDNA: WritingDNA }): string {
  const { pov, style, detail, custom, writingDNA } = params;
  const sections = [
    `你是一个擅长把对话、聊天记录或跑团剧本改写为小说正文的写手助手。你输出的内容永远是草稿，供作者修改参考，不会直接成为最终版本。`,
    `【改写设置】\n叙述视角：${labelOf(POV_OPTIONS, pov)}\n文体风格：${labelOf(STYLE_OPTIONS, style)}\n详略程度：${labelOf(DETAIL_OPTIONS, detail)}${custom.trim() ? `\n特别要求：${custom.trim()}` : ""}`,
  ];
  const dnaLines = [
    writingDNA.languageStyle && `语言风格：${writingDNA.languageStyle}`,
    writingDNA.writingPrefs && `写作偏好：${writingDNA.writingPrefs}`,
    writingDNA.taboos && `禁忌：${writingDNA.taboos}`,
    writingDNA.references && `参考作品：${writingDNA.references}`,
    writingDNA.dynamics && `人物张力：${writingDNA.dynamics}`,
  ].filter(Boolean);
  if (dnaLines.length > 0) sections.push(`【作者写作风格参考】\n${dnaLines.join("\n")}`);
  sections.push(`请把用户提供的对话改写为小说正文草稿。保留原有的情感走向和事件，不要添加原文没有的情节。直接输出正文，不要加解释或说明。`);
  return sections.join("\n\n");
}

// ── Sub-components ─────────────────────────────────────────────────────────

function FavoriteCard({ fav, onDelete }: { fav: TransformFavorite; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");

  async function handleCopy() {
    const ok = await copyText(fav.output);
    setCopyMsg(ok ? "已复制" : "复制失败，请手动选择文本");
    setTimeout(() => setCopyMsg(""), 2000);
  }

  function handleDelete() {
    if (!confirm("确认删除这条收藏？")) return;
    onDelete(fav.id);
  }

  const preview = fav.output.slice(0, 160);
  const wordCount = fav.output.replace(/\s/g, "").length;

  return (
    <div className="rounded-2xl border border-[#4c2c14] bg-[#261609] overflow-hidden">
      {/* Card header */}
      <div className="px-5 pt-4 pb-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#8a6040]">{fav.createdAt}</span>
          <span className="text-xs text-[#5a3820]">·</span>
          <span className="text-xs text-[#8a6040]">{wordCount} 字</span>
          <span className="text-xs text-[#5a3820]">·</span>
          <span className="rounded-full border border-[#3a2010] bg-[#311d0c] px-2 py-0.5 text-[10px] text-[#9a7050]">
            {labelOf(POV_OPTIONS, fav.pov)}
          </span>
          <span className="rounded-full border border-[#3a2010] bg-[#311d0c] px-2 py-0.5 text-[10px] text-[#9a7050]">
            {labelOf(STYLE_OPTIONS, fav.style)}
          </span>
          <span className="rounded-full border border-[#3a2010] bg-[#311d0c] px-2 py-0.5 text-[10px] text-[#9a7050]">
            {labelOf(DETAIL_OPTIONS, fav.detail)}
          </span>
          {fav.custom && (
            <span className="rounded-full border border-[#3a2010] bg-[#311d0c] px-2 py-0.5 text-[10px] text-[#9a7050]">
              {fav.custom.slice(0, 20)}{fav.custom.length > 20 ? "…" : ""}
            </span>
          )}
        </div>

        {/* Output preview / full */}
        <div className="rounded-xl bg-[#1e1200] px-4 py-3">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[#d4b890]">
            {expanded ? fav.output : preview}
            {!expanded && fav.output.length > 160 && (
              <span className="text-[#6a4020]">…</span>
            )}
          </pre>
        </div>
      </div>

      {/* Card actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-[#3a2010] px-5 py-3">
        <button
          onClick={() => setExpanded(v => !v)}
          className="rounded-full border border-[#6a4020] px-4 py-1.5 text-xs text-[#c8a878] transition hover:bg-[#311d0c]"
        >
          {expanded ? "收起" : "查看全文"}
        </button>
        <button
          onClick={handleCopy}
          className="rounded-full border border-[#6a4020] px-4 py-1.5 text-xs text-[#d4a05a] transition hover:bg-[#311d0c]"
        >
          {copyMsg || "复制全文"}
        </button>
        <button
          onClick={handleDelete}
          className="ml-auto rounded-full border border-[#3a1010] px-4 py-1.5 text-xs text-[#8a5040] transition hover:border-red-900 hover:text-red-400"
        >
          删除
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

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
  const [copyMsg, setCopyMsg] = useState("");
  const [favMsg, setFavMsg] = useState("");
  const [favorites, setFavorites] = useState<TransformFavorite[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ai-model-settings");
      if (raw) {
        const ms = JSON.parse(raw) as ModelSettings;
        const lines = (ms.modelsText ?? "").split("\n").map((l: string) => l.trim()).filter(Boolean);
        const def = ms.defaultModel?.trim() ?? "";
        const opts = def ? [def, ...lines.filter((l: string) => l !== def)] : lines;
        setModelOptions(opts);
        setSelectedModel(opts[0] ?? "");
      }
    } catch {}
    setFavorites(loadFavorites());
  }, []);

  // ── Generate ──

  async function handleTransform() {
    const ms = safeParse<ModelSettings | null>("ai-model-settings", null);
    if (!ms?.baseUrl || !ms?.apiKey) { setError("请先在模型设置中配置 API URL 和密钥"); return; }
    if (!dialogue.trim()) { setError("请先输入对话内容"); return; }
    const writingDNA = safeParse<WritingDNA>("writing-dna", {});
    const systemPrompt = buildSystemPrompt({ pov, style, detail, custom, writingDNA });
    setOutput(""); setError(""); setCopyMsg(""); setFavMsg(""); setIsStreaming(true);
    abortRef.current = new AbortController();
    try {
      await streamChat({
        baseUrl: normalizeBaseUrl(ms.baseUrl),
        apiKey: ms.apiKey,
        model: selectedModel || ms.defaultModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `请将以下对话改写为小说正文草稿：\n\n${dialogue}` },
        ],
        signal: abortRef.current.signal,
        onDelta: (delta) => setOutput(p => p + delta),
      });
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") setError(err.message || "请求失败，请检查配置");
    } finally { setIsStreaming(false); }
  }

  // ── Copy ──

  async function handleCopyOutput() {
    const ok = await copyText(output);
    setCopyMsg(ok ? "已复制 ✓" : "复制失败，请手动选择文本");
    setTimeout(() => setCopyMsg(""), 2500);
  }

  // ── Favorites ──

  function handleFavorite() {
    const fav: TransformFavorite = {
      id: crypto.randomUUID(),
      createdAt: new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
      sourceDialogue: dialogue,
      output,
      pov,
      style,
      detail,
      custom,
      model: selectedModel || undefined,
    };
    const updated = [fav, ...favorites];
    setFavorites(updated);
    saveFavorites(updated);
    setFavMsg("已收藏到炼字收藏 ✓");
    setTimeout(() => setFavMsg(""), 2500);
  }

  function handleDeleteFavorite(id: string) {
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    saveFavorites(updated);
  }

  // ── UI ──

  const selectClass = "w-full rounded-xl border border-[#4c2c14] bg-[#311d0c] px-3 py-2 text-sm text-[#f0e6d3] outline-none focus:border-[#c8a060] transition cursor-pointer";

  return (
    <main className="min-h-screen bg-[#1c1108] text-[#f0e6d3]">
      <div className="mx-auto max-w-3xl px-6 py-10 md:px-8">

        <header className="mb-8">
          <Link href="/" className="mb-4 inline-block text-sm text-[#c8a878] transition hover:text-[#f0e6d3]">← 回到小屋</Link>
          <h1 className="text-3xl font-semibold text-[#f0e6d3]">对话炼字</h1>
          <p className="mt-2 text-sm text-[#c8a878]">把角色的声音，炼成小说里的文字。</p>
        </header>

        {/* Input */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-[#d4a05a]">原始对话</label>
            {dialogue.replace(/\s/g, "").length > 0 && (
              <span className="text-xs text-[#8a6040]">{dialogue.replace(/\s/g, "").length} 字</span>
            )}
          </div>
          <div className="rounded-2xl border border-[#6a4020] bg-[#261609] p-5 shadow-inner">
            <textarea
              value={dialogue}
              onChange={e => setDialogue(e.target.value)}
              rows={10}
              className="w-full resize-none bg-transparent text-sm leading-7 text-[#f0e6d3] outline-none placeholder:text-[#5a3820]"
              placeholder={"A：你昨晚为什么没回消息？\nB：……我看到了，只是不知道怎么回。\nA：（沉默片刻）那你现在知道了吗？\nB：还是不知道。但我想当面说。"}
            />
          </div>
        </section>

        {/* Settings */}
        <section className="my-5 rounded-2xl border border-[#4c2c14] bg-[#261609] p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#c8a878]">叙述视角</label>
              <select value={pov} onChange={e => setPov(e.target.value)} className={selectClass}>
                {POV_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#c8a878]">文体风格</label>
              <select value={style} onChange={e => setStyle(e.target.value)} className={selectClass}>
                {STYLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#c8a878]">详略程度</label>
              <select value={detail} onChange={e => setDetail(e.target.value)} className={selectClass}>
                {DETAIL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#c8a878]">特别要求</label>
              <input
                type="text"
                value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder="重点写眼神，少写对白……"
                className="w-full rounded-xl border border-[#4c2c14] bg-[#311d0c] px-3 py-2 text-sm text-[#f0e6d3] outline-none placeholder:text-[#5a3820] focus:border-[#c8a060] transition"
              />
            </div>
          </div>

          {modelOptions.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <label className="shrink-0 text-xs text-[#c8a878]">模型</label>
              <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className={selectClass}>
                {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              onClick={isStreaming ? () => abortRef.current?.abort() : handleTransform}
              className={`rounded-full px-8 py-2.5 text-sm text-amber-50 transition ${isStreaming ? "bg-[#6a4020] hover:bg-[#4c2c14]" : "bg-[#6e4b2d] hover:bg-[#58391f]"}`}
            >
              {isStreaming ? "停止" : "开始炼字 🔥"}
            </button>
          </div>
        </section>

        {/* Output */}
        {(output || error || isStreaming) && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-[#d4a05a]">炼成的正文（草稿）</label>
              {output && <span className="text-xs text-[#8a6040]">{output.replace(/\s/g, "").length} 字</span>}
            </div>
            {error && (
              <div className="mb-3 rounded-xl border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
            {(output || isStreaming) && (
              <div className="rounded-2xl border border-[#4c2c14] bg-[#261609] p-6 shadow-sm">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-8 text-[#e8d5b7]">
                  {output}
                  {isStreaming && <span className="animate-pulse text-[#c8a878]">▋</span>}
                </pre>
              </div>
            )}
            {output && !isStreaming && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleCopyOutput}
                  className="rounded-full border border-[#6a4020] px-5 py-2 text-sm text-[#d4a05a] transition hover:bg-[#311d0c]"
                >
                  {copyMsg || "复制正文"}
                </button>
                <button
                  onClick={handleFavorite}
                  className="rounded-full border border-[#6a4020] px-5 py-2 text-sm text-[#c8a878] transition hover:bg-[#311d0c]"
                >
                  {favMsg || "收藏本次炼字 ☆"}
                </button>
                <button
                  onClick={() => { setDialogue(""); setOutput(""); setCopyMsg(""); setFavMsg(""); }}
                  className="rounded-full border border-[#6a4020] px-5 py-2 text-sm text-[#8a6040] transition hover:bg-[#311d0c]"
                >
                  重新开始
                </button>
              </div>
            )}
          </section>
        )}

        {/* Favorites list */}
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#d4a05a]">炼字收藏</h2>
            {favorites.length > 0 && (
              <span className="text-xs text-[#8a6040]">共 {favorites.length} 条</span>
            )}
          </div>

          {favorites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#4c2c14] py-14 text-center text-[#5a3820]">
              <p className="text-3xl mb-3">✨</p>
              <p className="text-sm">还没有收藏，遇到喜欢的炼字结果就先收起来。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {favorites.map(fav => (
                <FavoriteCard key={fav.id} fav={fav} onDelete={handleDeleteFavorite} />
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
