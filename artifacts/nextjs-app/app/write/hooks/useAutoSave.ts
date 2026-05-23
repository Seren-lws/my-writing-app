"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

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

type SaveStatus = "idle" | "writing" | "saving" | "saved";

// ── Helpers ────────────────────────────────────────────────────────────────

function ts() { return new Date().toISOString(); }
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}
function persistChapters(c: Chapter[]) {
  localStorage.setItem("chapters", JSON.stringify(c));
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAutoSave(chapters: Chapter[]) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [savedTime, setSavedTime] = useState("");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always-fresh reference so handleSave never closes over stale chapters
  const chaptersRef = useRef(chapters);
  chaptersRef.current = chapters;

  const performSave = useCallback((updatedChapters: Chapter[]) => {
    setSaveStatus("saving");
    setTimeout(() => {
      persistChapters(updatedChapters);
      setSavedTime(formatTime(ts()));
      setSaveStatus("saved");
    }, 400);
  }, []);

  const scheduleAutoSave = useCallback(
    (updatedChapters: Chapter[]) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => performSave(updatedChapters), 30000);
    },
    [performSave]
  );

  function cancelPendingSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = null;
  }

  function handleSave() {
    cancelPendingSave();
    performSave(chaptersRef.current);
  }

  function statusLabel() {
    if (saveStatus === "writing") return "正在写作";
    if (saveStatus === "saving") return "自动保存中…";
    if (saveStatus === "saved") return `已自动保存 ${savedTime}`;
    return "";
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  return {
    saveStatus,
    setSaveStatus,
    savedTime,
    scheduleAutoSave,
    handleSave,
    cancelPendingSave,
    statusLabel,
  };
}
