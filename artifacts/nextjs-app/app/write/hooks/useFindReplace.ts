"use client";

import { useRef, useState } from "react";
import { RefObject } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

type Match = { start: number; end: number };

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

type Options = {
  content: string;
  editorRef: RefObject<HTMLTextAreaElement | null>;
  updateActiveChapter: (
    patch: Partial<Pick<Chapter, "title" | "content" | "outline" | "aiInstruction">>
  ) => void;
};

// ── Helper ─────────────────────────────────────────────────────────────────

function computeMatches(
  query: string,
  text: string,
  caseSensitive: boolean,
  useRegex: boolean
): Match[] {
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
  } catch {
    return [];
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useFindReplace({ content, editorRef, updateActiveChapter }: Options) {
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [findCaseSensitive, setFindCaseSensitive] = useState(false);
  const [findUseRegex, setFindUseRegex] = useState(false);
  const [findMatches, setFindMatches] = useState<Match[]>([]);
  const [findMatchIdx, setFindMatchIdx] = useState(0);

  const findInputRef = useRef<HTMLInputElement>(null);

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

  function handleToggleCaseSensitive(v: boolean) {
    setFindCaseSensitive(v);
    handleFindOption(v, findUseRegex);
  }

  function handleToggleRegex(v: boolean) {
    setFindUseRegex(v);
    handleFindOption(findCaseSensitive, v);
  }

  return {
    showFind,
    setShowFind,
    findQuery,
    replaceQuery,
    setReplaceQuery,
    findCaseSensitive,
    findUseRegex,
    findMatches,
    findMatchIdx,
    findInputRef,
    handleFindQueryChange,
    handleFindNext,
    handleFindPrev,
    handleReplace,
    handleReplaceAll,
    openFindWith,
    handleToggleCaseSensitive,
    handleToggleRegex,
  };
}
