"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PageHeader from "../components/PageHeader";

type Book = { id: string; title: string };
type Chapter = { id: string; bookId: string; title: string; content: string; updatedAt: string };
type Archetype = "cheerleader" | "urger" | "analyst" | "critic" | "buddy" | "custom";
type Zone = "encourage" | "urge" | "feedback";

type Reader = {
  id: string; bookId: string; name: string; avatar: string;
  archetype: Archetype; customPersonality: string; readingProgress: number; createdAt: string;
};
type Message = {
  id: string; readerId: string; readerName: string; readerAvatar: string;
  bookId: string; zone: Zone; content: string; createdAt: string;
};

const ARCHETYPE_META: Record<Archetype, { label: string; emoji: string; zone: Zone; pill: string }> = {
  cheerleader: { label: "夸夸迷妹",   emoji: "🌸", zone: "encourage", pill: "bg-pink-50 border-pink-200 text-rose-700" },
  buddy:       { label: "互吹搭子",   emoji: "✨", zone: "encourage", pill: "bg-amber-50 border-amber-200 text-amber-800" },
  urger:       { label: "急催党",     emoji: "⚡", zone: "urge",     pill: "bg-orange-50 border-orange-200 text-orange-700" },
  analyst:     { label: "细腻分析派", emoji: "🔍", zone: "feedback", pill: "bg-sky-50 border-sky-200 text-sky-700" },
  critic:      { label: "毒舌老读者", emoji: "🎯", zone: "feedback", pill: "bg-stone-100 border-stone-300 text-stone-600" },
  custom:      { label: "自定义",     emoji: "⭐", zone: "feedback", pill: "bg-violet-50 border-violet-200 text-violet-700" },
};

const ZONE_META: Record<Zone, { label: string; icon: string; hint: string }> = {
  encourage: { label: "鼓励区", icon: "🌸", hint: "召唤夸夸迷妹或互吹搭子给你打气～" },
  urge:      { label: "催更区", icon: "⚡", hint: "感受一下被读者追更的快乐～" },
  feedback:  { label: "反馈区", icon: "🔍", hint: "召唤分析派或毒舌读者听听他们的看法～" },
};

const AVATARS = ["🐰", "🦊", "🐼", "🌸", "⭐", "🎭", "🦋", "🌙", "☁️", "🍀", "🐸", "🦄"];

const PERSONALITY_PROMPTS: Record<Archetype, string> = {
  cheerleader: "你是一个超级热情的读者粉丝，对这本书爱得不行，习惯用大量感叹号和emoji，总是给作者最大的鼓励和正能量，像追星一样追更新。",
  buddy: "你是作者的互粉搭子，彼此欣赏，消息风格亲密随意，喜欢引用书里的细节来互夸，偶尔也聊写作心得。",
  urger: "你是一个急得要命的催更党，已经等了好多天了，发催更消息语气着急又可爱，带点撒娇，但骨子里是真的喜欢这本书。",
  analyst: "你是一个热爱深度阅读的读者，会针对读到的内容写出细腻的剧情分析和猜想，语气认真但充满热情。",
  critic: "你是一个老读者，眼光挑剔，会直接说出书里的问题和不足，但也真诚地指出亮点，语气毒舌但有料，不是恶意批评。",
  custom: "",
};

function safeParse<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}
function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) + 1;
}

export default function ReadersPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeBookId, setActiveBookId] = useState("");
  const [readers, setReaders] = useState<Reader[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeZone, setActiveZone] = useState<Zone>("encourage");
  const [showForm, setShowForm] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const streamRef = useRef("");

  const [fName, setFName] = useState("");
  const [fAvatar, setFAvatar] = useState("🐰");
  const [fArchetype, setFArchetype] = useState<Archetype>("cheerleader");
  const [fCustom, setFCustom] = useState("");
  const [fProgress, setFProgress] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlBookId = params.get("bookId") ?? "";
    const allBooks = safeParse<Book[]>("books", []);
    const allChapters = safeParse<Chapter[]>("chapters", []);
    setBooks(allBooks);
    setChapters(allChapters);
    const bid = urlBookId && allBooks.find(b => b.id === urlBookId) ? urlBookId : allBooks[0]?.id ?? "";
    setActiveBookId(bid);
    setReaders(safeParse<Reader[]>("readers", []));
    setMessages(safeParse<Message[]>("reader-messages", []));
  }, []);

  const activeBook = books.find(b => b.id === activeBookId);
  const bookChapters = chapters.filter(c => c.bookId === activeBookId);
  const bookReaders = readers.filter(r => r.bookId === activeBookId);
  const zoneMessages = messages
    .filter(m => m.bookId === activeBookId && m.zone === activeZone)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function persistAll(r: Reader[], m: Message[]) {
    localStorage.setItem("readers", JSON.stringify(r));
    localStorage.setItem("reader-messages", JSON.stringify(m));
  }

  function handleAddReader() {
    if (!fName.trim()) return;
    const r: Reader = {
      id: crypto.randomUUID(), bookId: activeBookId, name: fName.trim(),
      avatar: fAvatar, archetype: fArchetype, customPersonality: fCustom,
      readingProgress: fProgress, createdAt: new Date().toISOString(),
    };
    const nextR = [...readers, r];
    setReaders(nextR); persistAll(nextR, messages);
    setShowForm(false);
    setFName(""); setFAvatar("🐰"); setFArchetype("cheerleader"); setFCustom(""); setFProgress(0);
  }

  function handleDelete(id: string) {
    if (!confirm("删除这位读者？他们的留言也会一起删除。")) return;
    const nextR = readers.filter(r => r.id !== id);
    const nextM = messages.filter(m => m.readerId !== id);
    setReaders(nextR); setMessages(nextM); persistAll(nextR, nextM);
  }

  async function handleSummon(reader: Reader) {
    if (generatingId) return;
    const zone = ARCHETYPE_META[reader.archetype].zone;
    setActiveZone(zone); setGeneratingId(reader.id); streamRef.current = "";

    let ms: { baseUrl?: string; apiKey?: string; defaultModel?: string } = {};
    try { const raw = localStorage.getItem("ai-model-settings"); if (raw) ms = JSON.parse(raw); } catch {}
    const baseUrl = (ms.baseUrl ?? "").replace(/\/$/, "") || "https://api.openai.com";
    const apiKey = ms.apiKey ?? "";

    let soul = "";
    try {
      const raw = localStorage.getItem(`book-soul-${activeBookId}`);
      if (raw) {
        const s = JSON.parse(raw);
        soul = [s.tone && `基调：${s.tone}`, s.relationship && `主角关系：${s.relationship}`].filter(Boolean).join("，");
      }
    } catch {}

    const readChapters = bookChapters.slice(0, reader.readingProgress + 1);
    const lastRead = readChapters[readChapters.length - 1];
    const personality = reader.archetype === "custom" && reader.customPersonality
      ? reader.customPersonality : PERSONALITY_PROMPTS[reader.archetype];

    let system = `你正在扮演一个叫「${reader.name}」的读者，给正在写小说的作者发一条留言。\n`;
    system += `你的人格：${personality}\n`;
    if (soul) system += `这本书的风格：${soul}\n`;
    system += `你已经读到了第${reader.readingProgress + 1}章。\n`;
    if (lastRead?.content) system += `你最近读的内容片段：\n${lastRead.content.slice(0, 500)}\n`;
    system += `只输出留言正文，语气自然真实，100-200字以内，不加标题或解释。`;

    const userMsg = zone === "encourage"
      ? "发一条鼓励作者继续写作的留言。"
      : zone === "urge"
        ? `发一条催更留言。你已经连续等了${daysSince(reader.createdAt)}天没有新章节了。`
        : "针对你最近读到的章节，发一条剧情分析或读后感。";

    const msgId = crypto.randomUUID();
    const placeholder: Message = {
      id: msgId, readerId: reader.id, readerName: reader.name,
      readerAvatar: reader.avatar, bookId: activeBookId,
      zone, content: "", createdAt: new Date().toISOString(),
    };
    setMessages(prev => [placeholder, ...prev]);

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: ms.defaultModel || "", stream: true, messages: [{ role: "system", content: system }, { role: "user", content: userMsg }] }),
      });
      const rdr = res.body?.getReader();
      const dec = new TextDecoder();
      if (!rdr) throw new Error("no reader");
      while (true) {
        const { done, value } = await rdr.read();
        if (done) break;
        for (const line of dec.decode(value, { stream: true }).split("\n")) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const json = t.slice(5).trim();
          if (json === "[DONE]") break;
          try {
            const delta = JSON.parse(json).choices?.[0]?.delta?.content ?? "";
            if (delta) { streamRef.current += delta; setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: streamRef.current } : m)); }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: "（生成失败，请检查模型设置）" } : m));
    } finally {
      setMessages(prev => {
        const updated = prev.map(m => m.id === msgId ? { ...m, content: streamRef.current || "（生成失败）" } : m);
        localStorage.setItem("reader-messages", JSON.stringify(updated));
        return updated;
      });
      setGeneratingId(null);
    }
  }

  if (!activeBookId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f0e8] text-[#7c5038]">
        <p>还没有书籍，先去 <Link href="/" className="underline">首页</Link> 创建一本吧</p>
      </div>
    );
  }

  const inputClass = "w-full rounded-xl border border-[#e0d4c0] bg-[#f0ead8] px-3 py-2 text-sm text-[#3d2b1a] outline-none focus:border-[#c8a87a]";

  const headerActions = (
    <div className="flex items-center gap-3">
      {books.length > 1 && (
        <select value={activeBookId} onChange={e => setActiveBookId(e.target.value)}
          className="rounded-xl border border-[#e0d4c0] bg-[#f0ead8] px-3 py-1.5 text-sm text-[#3d2b1a] outline-none focus:border-[#c8a87a]">
          {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
      )}
      <button onClick={() => setShowForm(v => !v)}
        className="rounded-full bg-[#7c4f2a] px-4 py-2 text-sm text-amber-50 transition hover:bg-[#643e1f]">
        {showForm ? "取消" : "+ 添加读者"}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#3d2b1a]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <PageHeader
          title="读者来信"
          subtitle={activeBook ? `《${activeBook.title}》· ${bookReaders.length > 0 ? `${bookReaders.length} 位读者在陪你写` : "还没有读者，添加第一位吧"}` : (bookReaders.length > 0 ? `${bookReaders.length} 位读者在陪你写` : "还没有读者，添加第一位吧")}
          actions={headerActions}
        />

        {showForm && (
          <div className="mb-6 rounded-2xl border border-[#c8a87a] bg-[#faf7f2] p-5 shadow-sm">
            <p className="mb-4 text-sm font-medium text-[#a07030]">新读者档案</p>

            <div className="mb-3">
              <label className="mb-1.5 block text-xs text-[#7c5038]">头像</label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map(emoji => (
                  <button key={emoji} onClick={() => setFAvatar(emoji)}
                    className={`h-9 w-9 rounded-xl text-lg transition ${fAvatar === emoji ? "bg-[#7c4f2a] ring-2 ring-[#c8a87a]" : "bg-[#f0ead8] hover:bg-[#e8d8c0]"}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="mb-1.5 block text-xs text-[#7c5038]">昵称</label>
              <input value={fName} onChange={e => setFName(e.target.value)} placeholder="给这位读者起个名字" className={inputClass} />
            </div>

            <div className="mb-3">
              <label className="mb-1.5 block text-xs text-[#7c5038]">人格类型</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(ARCHETYPE_META) as Archetype[]).map(a => (
                  <button key={a} onClick={() => setFArchetype(a)}
                    className={`rounded-xl border px-2 py-2 text-xs transition ${fArchetype === a ? "border-[#7c4f2a] bg-[#7c4f2a] text-amber-50" : "border-[#e0d4c0] bg-[#f0ead8] text-[#7c5038] hover:border-[#c8a87a]"}`}>
                    {ARCHETYPE_META[a].emoji} {ARCHETYPE_META[a].label}
                  </button>
                ))}
              </div>
            </div>

            {fArchetype === "custom" && (
              <div className="mb-3">
                <label className="mb-1.5 block text-xs text-[#7c5038]">自定义人格描述</label>
                <textarea value={fCustom} onChange={e => setFCustom(e.target.value)} rows={2}
                  placeholder="描述这位读者的性格和留言风格……"
                  className="w-full resize-none rounded-xl border border-[#e0d4c0] bg-[#f0ead8] px-3 py-2 text-sm text-[#3d2b1a] outline-none focus:border-[#c8a87a] placeholder:text-[#c0a078]" />
              </div>
            )}

            {bookChapters.length > 0 && (
              <div className="mb-4">
                <label className="mb-1.5 block text-xs text-[#7c5038]">阅读进度（读到哪章）</label>
                <select value={fProgress} onChange={e => setFProgress(Number(e.target.value))} className={inputClass}>
                  {bookChapters.map((ch, i) => <option key={ch.id} value={i}>第{i + 1}章：{ch.title}</option>)}
                </select>
              </div>
            )}

            <button onClick={handleAddReader} disabled={!fName.trim()}
              className="w-full rounded-xl bg-[#7c4f2a] py-2.5 text-sm text-amber-50 transition hover:bg-[#643e1f] disabled:opacity-40">
              添加这位读者
            </button>
          </div>
        )}

        {bookReaders.length > 0 && (
          <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
            {bookReaders.map(reader => {
              const meta = ARCHETYPE_META[reader.archetype];
              return (
                <div key={reader.id} className="flex min-w-[158px] flex-col rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{reader.avatar}</span>
                    <button onClick={() => handleDelete(reader.id)} className="text-xs text-[#b8956a] transition hover:text-[#7c5038]">✕</button>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[#3d2b1a]">{reader.name}</p>
                  <span className={`mt-1 self-start rounded-full border px-2 py-0.5 text-xs ${meta.pill}`}>
                    {meta.emoji} {meta.label}
                  </span>
                  <p className="mt-1.5 text-xs text-[#9a7a58]">
                    {bookChapters[reader.readingProgress] ? `读到第${reader.readingProgress + 1}章` : "还没开始读"}
                  </p>
                  {reader.archetype === "urger" && (
                    <p className="mt-0.5 text-xs text-orange-600">连续催更 {daysSince(reader.createdAt)} 天</p>
                  )}
                  <button onClick={() => handleSummon(reader)} disabled={generatingId !== null}
                    className="mt-3 w-full rounded-xl bg-[#7c4f2a] py-1.5 text-xs text-amber-50 transition hover:bg-[#643e1f] disabled:opacity-50">
                    {generatingId === reader.id ? "生成中…" : "召唤留言"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mb-4 flex gap-1 rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-1">
          {(Object.keys(ZONE_META) as Zone[]).map(zone => (
            <button key={zone} onClick={() => setActiveZone(zone)}
              className={`flex-1 rounded-xl py-2 text-sm transition ${activeZone === zone ? "bg-[#7c4f2a] text-amber-50 shadow-sm" : "text-[#7c5038] hover:bg-[#f0ead8]"}`}>
              {ZONE_META[zone].icon} {ZONE_META[zone].label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {zoneMessages.length === 0 ? (
            <div className="rounded-2xl border border-[#e0d4c0] bg-[#faf7f2]/60 p-10 text-center">
              <p className="text-sm text-[#9a7a58]">{ZONE_META[activeZone].hint}</p>
            </div>
          ) : (
            zoneMessages.map((msg, idx) => (
              <div key={msg.id} className="rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-2xl">{msg.readerAvatar}</span>
                  <div>
                    <p className="text-sm font-medium text-[#3d2b1a]">{msg.readerName}</p>
                    <p className="text-xs text-[#9a7a58]">{timeAgo(msg.createdAt)}</p>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-[#4a3525]">
                  {msg.content}
                  {generatingId !== null && idx === 0 && <span className="animate-pulse text-[#7c5038]">▍</span>}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
