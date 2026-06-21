"use client";

import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";

type AdultSettings = {
  enabled: boolean;
  rating: "全年龄" | "16+" | "18+";
  writingStyle: string;
  relationBoundary: string;
  preferences: string;
  taboos: string;
  reference: string;
  xpMaterial: string;
};

const DEFAULTS: AdultSettings = {
  enabled: false,
  rating: "全年龄",
  writingStyle: "",
  relationBoundary: "所有角色均为成年人；只描写成年人之间自愿的亲密关系；不涉及未成年人、剥削、胁迫或现实人物。",
  preferences: "",
  taboos: "",
  reference: "",
  xpMaterial: "",
};

export default function AdultSettingsPage() {
  const [settings, setSettings] = useState<AdultSettings>(DEFAULTS);
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    try { const raw = localStorage.getItem("adult-content-settings"); if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) }); } catch {}
  }, []);

  function set<K extends keyof AdultSettings>(key: K, value: AdultSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }
  function handleSave() {
    localStorage.setItem("adult-content-settings", JSON.stringify(settings));
    setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
  }

  const textareaClass = "w-full resize-none bg-transparent text-sm leading-7 text-[#3d2b1a] outline-none placeholder:text-[#c0a078]";
  const cardClass = "rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-6 shadow-sm";
  const labelClass = "block text-sm font-medium text-[#a07030]";

  const saveActions = (
    <div className="flex items-center gap-3">
      {savedAt && <span className="text-xs text-[#9a7a58]">已保存 {savedAt}</span>}
      <button onClick={handleSave} className="rounded-full bg-[#7c4f2a] px-5 py-1.5 text-sm text-amber-50 transition hover:bg-[#643e1f]">
        保存
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f5f0e8] text-[#3d2b1a]">
      <div className="mx-auto max-w-2xl px-8 py-10">
        <PageHeader
          title="成人创作设置"
          subtitle="管理你的创作分级偏好与边界设定，仅保存在本地。"
          actions={saveActions}
        />

        <div className="space-y-5">
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <label className={labelClass}>成人创作模式</label>
              <button onClick={() => set("enabled", !settings.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enabled ? "bg-[#7c4f2a]" : "bg-[#d8c8a8]"}`}>
                <span className={`inline-block h-4 w-4 translate-x-1 rounded-full bg-white shadow transition-transform ${settings.enabled ? "translate-x-6" : ""}`} />
              </button>
            </div>
            <p className="mt-2 text-sm text-[#9a7a58]">{settings.enabled ? "已开启成人向创作模式" : "开启成人向创作模式"}</p>
          </div>

          <div className={cardClass}>
            <label className={`${labelClass} mb-3 block`}>作品分级</label>
            <div className="flex gap-3">
              {(["全年龄", "16+", "18+"] as const).map(r => (
                <button key={r} onClick={() => set("rating", r)}
                  className={`flex-1 rounded-xl border py-2 text-sm transition ${settings.rating === r ? "border-[#7c4f2a] bg-[#7c4f2a] text-amber-50" : "border-[#e0d4c0] text-[#7c5038] hover:border-[#c8a87a]"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className={cardClass}>
            <label className={`${labelClass} mb-3 block`}>描写风格</label>
            <textarea rows={3} value={settings.writingStyle} onChange={e => set("writingStyle", e.target.value)}
              placeholder="比如：暧昧拉扯、文学含蓄、感官氛围、明确但克制、重视情绪张力……" className={textareaClass} />
          </div>

          <div className={cardClass}>
            <label className={`${labelClass} mb-3 block`}>关系边界</label>
            <textarea rows={3} value={settings.relationBoundary} onChange={e => set("relationBoundary", e.target.value)} className={textareaClass} />
          </div>

          <div className={cardClass}>
            <label className={`${labelClass} mb-3 block`}>偏好说明</label>
            <textarea rows={3} value={settings.preferences} onChange={e => set("preferences", e.target.value)}
              placeholder="比如：多写身体语言和空气感，少解释心理；慢一点，不要太快戳破关系……" className={textareaClass} />
          </div>

          <div className={cardClass}>
            <label className={`${labelClass} mb-3 block`}>禁忌清单</label>
            <textarea rows={3} value={settings.taboos} onChange={e => set("taboos", e.target.value)}
              placeholder="写下你不想出现的内容、词汇、关系类型或语气。" className={textareaClass} />
          </div>

          <div className={cardClass}>
            <label className={`${labelClass} mb-3 block`}>描写参考 / 风格示范</label>
            <textarea rows={5} value={settings.reference} onChange={e => set("reference", e.target.value)}
              placeholder="放你喜欢的成人描写片段、具体写法、尺度示范，AI 会照着这个感觉来写。" className={textareaClass} />
          </div>

          <div className={cardClass}>
            <label className={`${labelClass} mb-3 block`}>XP 素材参考</label>
            <textarea rows={5} value={settings.xpMaterial} onChange={e => set("xpMaterial", e.target.value)}
              placeholder="你的 XP / 性癖相关的素材、设定、想用上的点……" className={textareaClass} />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          {savedAt ? <span className="text-sm text-[#9a7a58]">已保存 {savedAt}</span> : <span />}
          <button onClick={handleSave} className="rounded-full bg-[#7c4f2a] px-8 py-2.5 text-sm text-amber-50 transition hover:bg-[#643e1f]">保存设置</button>
        </div>
      </div>
    </main>
  );
}
