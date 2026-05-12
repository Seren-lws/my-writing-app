"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Book = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
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

type Inspiration = {
  id: string;
  content: string;
  createdAt: string;
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

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#ead8b8] bg-[#fffaf0] p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-medium text-[#9b744d]">{title}</h2>
      <div className="whitespace-pre-wrap text-sm leading-7 text-[#4f3524]">
        {children}
      </div>
    </section>
  );
}

export default function PromptPreviewPage() {
  const [ready, setReady] = useState(false);
  const [bookId, setBookId] = useState("");
  const [chapterId, setChapterId] = useState("");

  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [writingDNA, setWritingDNA] = useState<WritingDNA>({});
  const [bookSouls, setBookSouls] = useState<BookSoul[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setBookId(params.get("bookId") ?? "");
    setChapterId(params.get("chapterId") ?? "");

    setBooks(safeParse<Book[]>("books", []));
    setChapters(safeParse<Chapter[]>("chapters", []));
    setInspirations(safeParse<Inspiration[]>("inspirations", []));
    setWritingDNA(safeParse<WritingDNA>("writing-dna", {}));
    setBookSouls(safeParse<BookSoul[]>("book-souls", []));

    setReady(true);
  }, []);

  const book = books.find((item) => item.id === bookId);
  const chapter = chapters.find((item) => item.id === chapterId);
  const soul = bookSouls.find((item) => item.bookId === bookId);

  const recentInspirations = inspirations.slice(0, 5);

  const promptText = useMemo(() => {
    return `【第一层：我的写作 DNA】

语言风格：
${writingDNA.languageStyle || "暂无"}

写作偏好：
${writingDNA.preferences || "暂无"}

禁忌清单：
${writingDNA.taboos || "暂无"}

参考作品 / 参考作者：
${writingDNA.references || "暂无"}

常用人物关系与张力：
${writingDNA.relationshipTension || "暂无"}


【第二层：这本书的灵魂】

书名：
${book?.title || "未知作品"}

核心基调：
${soul?.tone || "暂无"}

主角关系与张力：
${soul?.relationship || "暂无"}

世界观 / 背景规则：
${soul?.worldRules || "暂无"}

绝对不能写崩的地方：
${soul?.mustNotBreak || "暂无"}

本书关键词：
${soul?.keywords || "暂无"}

AI 写作时要记住的提醒：
${soul?.aiReminder || "暂无"}


【第三层：当前章节】

章节标题：
${chapter?.title || "未知章节"}

章节正文：
${chapter?.content || "暂无正文"}


【第四层：当次任务层：本章大纲与本次指令】

本章大纲：
${chapter?.outline || "暂无"}

本次指令：
${chapter?.aiInstruction || "暂无"}


【第五层：最近灵感】

${
  recentInspirations.length > 0
    ? recentInspirations
        .map((item, index) => `${index + 1}. ${item.content}`)
        .join("\n\n")
    : "暂无灵感"
}`;
  }, [writingDNA, book, soul, chapter, recentInspirations]); // eslint-disable-line react-hooks/exhaustive-deps

  function copyPrompt() {
    navigator.clipboard.writeText(promptText);
  }

  if (!ready) return null;

  return (
    <main className="min-h-screen bg-[#f8f0df] px-8 py-10 text-[#4f3524]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm tracking-[0.25em] text-[#9b744d]">
              PROMPT PREVIEW
            </p>
            <h1 className="mt-3 text-4xl font-semibold">
              本次 AI 会读到什么
            </h1>
            <p className="mt-3 text-[#8a6a4d]">
              这里先不调用 AI，只把之后要喂给 AI 的上下文透明展示出来。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={copyPrompt}
              className="rounded-full bg-[#6e4b2d] px-5 py-2 text-sm text-amber-50 transition hover:bg-[#58391f]"
            >
              复制 Prompt
            </button>

            <Link
              href={`/write?bookId=${bookId}`}
              className="rounded-full border border-[#d8b98f] bg-[#fff8eb]/70 px-5 py-2 text-sm text-[#6e4b2d] shadow-sm transition hover:bg-white"
            >
              ← 回到写作页
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-[1fr_1.15fr] gap-6">
          <div className="space-y-5">
            <SectionCard title="第一层：我的写作 DNA">
              <p>语言风格：{writingDNA.languageStyle || "暂无"}</p>
              <p>写作偏好：{writingDNA.preferences || "暂无"}</p>
              <p>禁忌清单：{writingDNA.taboos || "暂无"}</p>
              <p>参考作品 / 参考作者：{writingDNA.references || "暂无"}</p>
              <p>
                常用人物关系与张力：
                {writingDNA.relationshipTension || "暂无"}
              </p>
            </SectionCard>

            <SectionCard title="第二层：这本书的灵魂">
              <p>书名：{book?.title || "未知作品"}</p>
              <p>核心基调：{soul?.tone || "暂无"}</p>
              <p>主角关系与张力：{soul?.relationship || "暂无"}</p>
              <p>世界观 / 背景规则：{soul?.worldRules || "暂无"}</p>
              <p>绝对不能写崩的地方：{soul?.mustNotBreak || "暂无"}</p>
              <p>本书关键词：{soul?.keywords || "暂无"}</p>
              <p>AI 写作时要记住的提醒：{soul?.aiReminder || "暂无"}</p>
            </SectionCard>

            <SectionCard title="第四层：当次任务层">
              <p>本章大纲：{chapter?.outline || "暂无"}</p>
              <p>本次指令：{chapter?.aiInstruction || "暂无"}</p>
            </SectionCard>

            <SectionCard title="第五层：最近灵感">
              {recentInspirations.length > 0 ? (
                <ol className="list-decimal space-y-3 pl-5">
                  {recentInspirations.map((item) => (
                    <li key={item.id}>{item.content}</li>
                  ))}
                </ol>
              ) : (
                <p>暂无灵感</p>
              )}
            </SectionCard>
          </div>

          <section className="rounded-[1.5rem] border border-[#ead8b8] bg-[#fffaf0] p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-[#9b744d]">
                拼装后的完整 Prompt
              </h2>
              <span className="text-xs text-[#c7a984]">
                {promptText.replace(/\s/g, "").length} 字
              </span>
            </div>

            <pre className="max-h-[72vh] overflow-auto whitespace-pre-wrap rounded-2xl border border-[#ead8b8] bg-white/70 p-5 text-sm leading-7 text-[#4f3524]">
              {promptText}
            </pre>
          </section>
        </div>
      </div>
    </main>
  );
}