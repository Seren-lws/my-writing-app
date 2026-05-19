"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type SoulCard = {
  bookId: string;
  tone: string;
  dynamics: string;
  worldbuilding: string;
  redlines: string;
  keywords: string;
  aiReminders: string;
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
  createdAt: string;
};

// ── Constants ──────────────────────────────────────────────────────────────

const EMPTY_CARD = {
  tone: "", dynamics: "", worldbuilding: "", redlines: "", keywords: "", aiReminders: "",
};

const SOUL_FIELDS: { key: keyof typeof EMPTY_CARD; label: string; placeholder: string }[] = [
  { key: "tone", label: "这本书的核心基调", placeholder: "比如：暧昧、潮湿、克制、危险、沉溺……" },
  { key: "dynamics", label: "主角关系与张力", placeholder: "比如：互相试探、权力差、欲望压抑、假装不在意……" },
  { key: "worldbuilding", label: "世界观 / 背景规则", placeholder: "比如：故事发生地点、时代、职业背景、组织规则……" },
  { key: "redlines", label: "绝对不能写崩的地方", placeholder: "比如：不要让角色突然变幼稚、不要把暧昧写得太直白……" },
  { key: "keywords", label: "本书关键词", placeholder: "比如：雨夜、钢琴、香水、失控、沉默、吻……" },
  { key: "aiReminders", label: "AI 写作时要记住的提醒", placeholder: "比如：多写身体语言，少解释心理；保持暧昧张力，不要急着戳破。" },
];

const CHAR_TEXT_FIELDS: { key: keyof Character; label: string; placeholder: string; rows: number }[] = [
  { key: "appearance", label: "外貌描述", placeholder: "身形、五官、气质、标志性特征……", rows: 3 },
  { key: "personality", label: "性格特点", placeholder: "核心性格、待人方式、在压力下的反应……", rows: 3 },
  { key: "personalityOrigin", label: "性格形成原因", placeholder: "是什么经历塑造了这个人？童年、创伤、选择……", rows: 3 },
  { key: "background", label: "成长背景 + 日常生活", placeholder: "家庭背景、成长经历、当下的日常状态……", rows: 3 },
  { key: "relationships", label: "与其他角色的关系", placeholder: "比如：对 A 是单向暗恋，对 B 是互相利用……", rows: 3 },
  { key: "speechPattern", label: "说话方式 / 口头禅", placeholder: "语气、习惯用词、惯用句式、沉默时的状态……", rows: 2 },
  { key: "aiNotes", label: "AI 写这个角色时要注意的", placeholder: "比如：不要让他主动示弱，情绪只在细节里透出来……", rows: 2 },
];

function emptyCharacter(bookId: string): Character {
  return {
    id: crypto.randomUUID(),
    bookId,
    name: "",
    alias: "",
    age: "",
    gender: "",
    role: "",
    appearance: "",
    personality: "",
    personalityOrigin: "",
    background: "",
    relationships: "",
    speechPattern: "",
    aiNotes: "",
    createdAt: new Date().toISOString(),
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function safeParse<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}

function persistCharacters(chars: Character[]) {
  localStorage.setItem("book-characters", JSON.stringify(chars));
}

// ── Component ──────────────────────────────────────────────────────────────

export default function BookSoulPage() {
  const [bookId, setBookId] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [card, setCard] = useState(EMPTY_CARD);
  const [savedAt, setSavedAt] = useState("");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bid = params.get("bookId") ?? "";
    setBookId(bid);

    try {
      const books = safeParse<{ id: string; title: string }[]>("books", []);
      const book = books.find((b) => b.id === bid);
      if (book) setBookTitle(book.title);
    } catch {}

    try {
      const souls = safeParse<SoulCard[]>("book-souls", []);
      const existing = souls.find((s) => s.bookId === bid);
      if (existing) {
        const { bookId: _bid, ...rest } = existing;
        void _bid;
        setCard({ ...EMPTY_CARD, ...rest });
      }
    } catch {}

    const allChars = safeParse<Character[]>("book-characters", []);
    setCharacters(allChars.filter((c) => c.bookId === bid));

    setReady(true);
  }, []);

  // ── Soul card ──────────────────────────────────────────────────────────

  function handleSoulChange(key: keyof typeof EMPTY_CARD, value: string) {
    setCard((prev) => ({ ...prev, [key]: value }));
  }

  function handleSoulSave() {
    const souls = safeParse<SoulCard[]>("book-souls", []);
    const idx = souls.findIndex((s) => s.bookId === bookId);
    const updated: SoulCard = { bookId, ...card };
    if (idx >= 0) souls[idx] = updated; else souls.push(updated);
    localStorage.setItem("book-souls", JSON.stringify(souls));
    setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
  }

  // ── Characters ─────────────────────────────────────────────────────────

  function saveCharacters(updated: Character[]) {
    setCharacters(updated);
    const all = safeParse<Character[]>("book-characters", []).filter((c) => c.bookId !== bookId);
    persistCharacters([...all, ...updated]);
  }

  function handleAddCharacter() {
    const c = emptyCharacter(bookId);
    const updated = [...characters, c];
    saveCharacters(updated);
    setExpandedId(c.id);
  }

  function handleCharChange(id: string, key: keyof Character, value: string) {
    const updated = characters.map((c) => c.id === id ? { ...c, [key]: value } : c);
    saveCharacters(updated);
  }

  function handleDeleteCharacter(id: string) {
    if (!confirm("确定删除这个角色吗？")) return;
    const updated = characters.filter((c) => c.id !== id);
    saveCharacters(updated);
    if (expandedId === id) setExpandedId(null);
  }

  const inputClass = "w-full bg-transparent text-sm text-[#4f3524] outline-none placeholder:text-[#c7a984]";
  const inlineInputClass = "flex-1 min-w-0 bg-[#fff8eb] rounded-lg border border-[#e0c9a5] px-3 py-1.5 text-sm text-[#4f3524] outline-none placeholder:text-[#c7a984] focus:border-[#9b744d] transition";

  if (!ready) return null;

  return (
    <main className="min-h-screen bg-[#f8f0df] text-[#4f3524]">
      <div className="mx-auto max-w-2xl px-4 py-12 md:px-8">

        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <Link href={`/write?bookId=${bookId}`} className="mb-4 inline-block text-sm text-[#9b744d] transition hover:text-[#4f3524]">
              ← 回到写作页
            </Link>
            <div className="mt-1 flex items-center gap-2">
              {bookTitle && <span className="text-sm text-[#a37a50]">{bookTitle}</span>}
              {bookTitle && <span className="text-[#d8b98f]">/</span>}
              <h1 className="text-3xl font-semibold text-[#4f3524]">书籍灵魂卡</h1>
            </div>
            <p className="mt-2 text-sm text-[#9b744d]">写下这本书的骨骼和气息，让每次创作都不迷失方向。</p>
          </div>
          <div className="flex flex-col items-end gap-2 pt-8">
            {savedAt && <span className="text-xs text-[#9b744d]">已保存 {savedAt}</span>}
            <button onClick={handleSoulSave} className="rounded-full bg-[#6e4b2d] px-6 py-2 text-sm text-amber-50 transition hover:bg-[#58391f]">
              保存
            </button>
          </div>
        </div>

        {/* Soul fields */}
        <div className="space-y-5">
          {SOUL_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="rounded-2xl border border-[#e0c9a5] bg-[#fff8eb] p-6 shadow-sm">
              <label className="mb-3 block text-sm font-medium text-[#6e4b2d]">{label}</label>
              <textarea rows={3} value={card[key]} onChange={(e) => handleSoulChange(key, e.target.value)}
                placeholder={placeholder}
                className="w-full resize-none bg-transparent text-sm leading-7 text-[#4f3524] outline-none placeholder:text-[#c7a984]" />
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          {savedAt ? <span className="text-sm text-[#9b744d]">已保存 {savedAt}</span> : <span />}
          <button onClick={handleSoulSave} className="rounded-full bg-[#6e4b2d] px-8 py-2.5 text-sm text-amber-50 transition hover:bg-[#58391f]">
            保存灵魂卡
          </button>
        </div>

        {/* ── 角色档案 ── */}
        <div className="mt-14">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#4f3524]">角色档案</h2>
              <p className="mt-1 text-sm text-[#9b744d]">为每个重要角色建立完整的人物卡，自动注入 AI 上下文。</p>
            </div>
            <button onClick={handleAddCharacter}
              className="rounded-full bg-[#6e4b2d] px-5 py-2 text-sm text-amber-50 transition hover:bg-[#58391f]">
              + 添加角色
            </button>
          </div>

          {characters.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#d8b98f] bg-[#fff8eb]/50 px-8 py-12 text-center">
              <p className="text-3xl mb-3">👤</p>
              <p className="text-sm text-[#9b744d]">还没有角色档案，点击「添加角色」开始创建。</p>
            </div>
          )}

          <div className="space-y-4">
            {characters.map((char) => {
              const isExpanded = expandedId === char.id;
              return (
                <div key={char.id} className="rounded-2xl border border-[#e0c9a5] bg-[#fff8eb] shadow-sm overflow-hidden">

                  {/* Card header — always visible */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : char.id)}
                    className="flex w-full items-center gap-3 px-6 py-4 text-left transition hover:bg-[#fff2e0]"
                  >
                    <span className="text-xl">👤</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-[#4f3524]">
                        {char.name || <span className="text-[#c7a984]">未命名角色</span>}
                      </span>
                      {char.role && (
                        <span className="ml-2 rounded-full bg-[#f0dfc0] px-2.5 py-0.5 text-xs text-[#8a6a4d]">
                          {char.role}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-sm text-[#c7a984]">{isExpanded ? "收起 ↑" : "展开 ↓"}</span>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-[#e0c9a5] px-6 pb-6 pt-5">

                      {/* Basic info row */}
                      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
                        <div className="col-span-2 md:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-[#9b744d]">姓名</label>
                          <input value={char.name} onChange={(e) => handleCharChange(char.id, "name", e.target.value)}
                            placeholder="角色姓名"
                            className={inlineInputClass + " w-full"} />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <label className="mb-1 block text-xs font-medium text-[#9b744d]">角色定位</label>
                          <input value={char.role} onChange={(e) => handleCharChange(char.id, "role", e.target.value)}
                            placeholder="男一、女主…"
                            className={inlineInputClass + " w-full"} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-[#9b744d]">年龄</label>
                          <input value={char.age} onChange={(e) => handleCharChange(char.id, "age", e.target.value)}
                            placeholder="28"
                            className={inlineInputClass + " w-full"} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-[#9b744d]">性别</label>
                          <input value={char.gender} onChange={(e) => handleCharChange(char.id, "gender", e.target.value)}
                            placeholder="男 / 女"
                            className={inlineInputClass + " w-full"} />
                        </div>
                      </div>

                      <div className="mb-5">
                        <label className="mb-1 block text-xs font-medium text-[#9b744d]">别名 / 称呼</label>
                        <input value={char.alias} onChange={(e) => handleCharChange(char.id, "alias", e.target.value)}
                          placeholder="外号、代号、其他角色对他的称呼……"
                          className={inlineInputClass + " w-full"} />
                      </div>

                      {/* Long text fields */}
                      {CHAR_TEXT_FIELDS.map(({ key, label, placeholder, rows }) => (
                        <div key={key} className="mb-5">
                          <label className="mb-2 block text-xs font-medium text-[#9b744d]">{label}</label>
                          <textarea
                            rows={rows}
                            value={char[key] as string}
                            onChange={(e) => handleCharChange(char.id, key, e.target.value)}
                            placeholder={placeholder}
                            className="w-full resize-none rounded-xl border border-[#e0c9a5] bg-white/60 px-4 py-3 text-sm leading-7 text-[#4f3524] outline-none placeholder:text-[#c7a984] focus:border-[#9b744d] transition"
                          />
                        </div>
                      ))}

                      {/* Delete */}
                      <div className="mt-2 flex justify-end">
                        <button onClick={() => handleDeleteCharacter(char.id)}
                          className="rounded-full border border-red-200 px-4 py-1.5 text-xs text-red-400 transition hover:bg-red-50">
                          删除角色
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </main>
  );
}
