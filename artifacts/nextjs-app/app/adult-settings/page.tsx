"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AdultSettings = {
  enabled: boolean;
  rating: "全年龄" | "16+" | "18+";
  writingStyle: string;
  relationBoundary: string;
  preferences: string;
  taboos: string;
};

const DEFAULTS: AdultSettings = {
  enabled: false,
  rating: "全年龄",
  writingStyle: "",
  relationBoundary:
    "所有角色均为成年人；只描写成年人之间自愿的亲密关系；不涉及未成年人、剥削、胁迫或现实人物。",
  preferences: "",
  taboos: "",
};

export default function AdultSettingsPage() {
  const [settings, setSettings] = useState<AdultSettings>(DEFAULTS);
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("adult-content-settings");
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  function set<K extends keyof AdultSettings>(key: K, value: AdultSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    localStorage.setItem("adult-content-settings", JSON.stringify(settings));
    const now = new Date();
    setSavedAt(
      now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    );
  }

  const textareaClass =
    "w-full resize-none bg-transparent text-sm leading-7 text-[#4f3524] outline-none placeholder:text-[#c7a984]";

  const cardClass =
    "rounded-2xl border border-[#e0c9a5] bg-[#fff8eb] p-6 shadow-sm";

  const labelClass = "block text-sm font-medium text-[#6e4b2d]";

  return (
    <main className="min-h-screen bg-[#f8f0df] text-[#4f3524]">
      <div className="mx-auto max-w-2xl px-8 py-12">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-block text-sm text-[#9b744d] transition hover:text-[#4f3524]"
            >
              ← 回到小屋
            </Link>
            <h1 className="text-3xl font-semibold text-[#4f3524]">
              成人创作设置
            </h1>
            <p className="mt-2 text-sm text-[#9b744d]">
              管理你的创作分级偏好与边界设定，仅保存在本地。
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 pt-8">
            {savedAt && (
              <span className="text-xs text-[#9b744d]">已保存 {savedAt}</span>
            )}
            <button
              onClick={handleSave}
              className="rounded-full bg-[#6e4b2d] px-6 py-2 text-sm text-amber-50 transition hover:bg-[#58391f]"
            >
              保存
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {/* Toggle */}
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <label className={labelClass}>成人创作模式</label>
              <button
                onClick={() => set("enabled", !settings.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enabled ? "bg-[#6e4b2d]" : "bg-[#d8b98f]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 translate-x-1 rounded-full bg-white shadow transition-transform ${
                    settings.enabled ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>
            <p className="mt-2 text-sm text-[#9b744d]">
              {settings.enabled
                ? "已开启成人向创作模式"
                : "开启成人向创作模式"}
            </p>
          </div>

          {/* Rating */}
          <div className={cardClass}>
            <label className={`${labelClass} mb-3 block`}>作品分级</label>
            <div className="flex gap-3">
              {(["全年龄", "16+", "18+"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => set("rating", r)}
                  className={`flex-1 rounded-xl border py-2 text-sm transition ${
                    settings.rating === r
                      ? "border-[#6e4b2d] bg-[#6e4b2d] text-amber-50"
                      : "border-[#d8b98f] text-[#9b744d] hover:border-[#6e4b2d] hover:text-[#6e4b2d]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Writing style */}
          <div className={cardClass}>
            <label className={`${labelClass} mb-3 block`}>描写风格</label>
            <textarea
              rows={3}
              value={settings.writingStyle}
              onChange={(e) => set("writingStyle", e.target.value)}
              placeholder="比如：暧昧拉扯、文学含蓄、感官氛围、明确但克制、重视情绪张力……"
              className={textareaClass}
            />
          </div>

          {/* Relation boundary */}
          <div className={cardClass}>
            <label className={`${labelClass} mb-3 block`}>关系边界</label>
            <textarea
              rows={3}
              value={settings.relationBoundary}
              onChange={(e) => set("relationBoundary", e.target.value)}
              className={textareaClass}
            />
          </div>

          {/* Preferences */}
          <div className={cardClass}>
            <label className={`${labelClass} mb-3 block`}>偏好说明</label>
            <textarea
              rows={3}
              value={settings.preferences}
              onChange={(e) => set("preferences", e.target.value)}
              placeholder="比如：多写身体语言和空气感，少解释心理；慢一点，不要太快戳破关系……"
              className={textareaClass}
            />
          </div>

          {/* Taboos */}
          <div className={cardClass}>
            <label className={`${labelClass} mb-3 block`}>禁忌清单</label>
            <textarea
              rows={3}
              value={settings.taboos}
              onChange={(e) => set("taboos", e.target.value)}
              placeholder="写下你不想出现的内容、词汇、关系类型或语气。"
              className={textareaClass}
            />
          </div>
        </div>

        {/* Bottom save */}
        <div className="mt-8 flex items-center justify-between">
          {savedAt ? (
            <span className="text-sm text-[#9b744d]">已保存 {savedAt}</span>
          ) : (
            <span />
          )}
          <button
            onClick={handleSave}
            className="rounded-full bg-[#6e4b2d] px-8 py-2.5 text-sm text-amber-50 transition hover:bg-[#58391f]"
          >
            保存设置
          </button>
        </div>
      </div>
    </main>
  );
}
