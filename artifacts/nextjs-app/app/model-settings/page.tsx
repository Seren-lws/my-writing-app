"use client";

import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import DataBackup from "../components/DataBackup";

type ModelSettings = { baseUrl: string; apiKey: string; defaultModel: string; modelsText: string };
const DEFAULTS: ModelSettings = { baseUrl: "", apiKey: "", defaultModel: "", modelsText: "" };

export default function ModelSettingsPage() {
  const [settings, setSettings] = useState<ModelSettings>(DEFAULTS);
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    try { const raw = localStorage.getItem("ai-model-settings"); if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) }); } catch {}
  }, []);

  function set<K extends keyof ModelSettings>(key: K, value: ModelSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }
  function handleSave() {
    localStorage.setItem("ai-model-settings", JSON.stringify(settings));
    setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
  }

  /* ── 深夜书房风格 ── */
  const inputClass = "w-full rounded-xl border border-[#5a4a3a] bg-[#f5f0e6] px-4 py-2.5 text-sm text-[#2a1a0a] outline-none placeholder:text-[#a08a6a] focus:border-[#d4a050] focus:shadow-[0_0_12px_rgba(212,160,80,0.3)] transition";
  const cardClass = "rounded-2xl border border-[#4a3828]/60 bg-[#2a1e14]/80 p-6 shadow-[inset_0_1px_0_rgba(212,176,112,0.1),0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-sm";
  const labelClass = "mb-2 block text-sm font-medium text-[#d4a050]";

  const saveActions = (
    <div className="flex items-center gap-3">
      {savedAt && <span className="text-xs text-[#c0a878]">已保存 {savedAt}</span>}
      <button onClick={handleSave} className="rounded-full bg-[#d4a050] px-5 py-1.5 text-sm text-[#1a0e04] font-medium transition hover:bg-[#e0b060] hover:shadow-[0_0_16px_rgba(212,160,80,0.4)]">
        保存
      </button>
    </div>
  );

  return (
    <main className="relative min-h-screen bg-[#1a1008] text-[#e8dcc8]">
      {/* 背景氛围层：微妙的径向渐变模拟台灯光 */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_600px_400px_at_50%_20%,rgba(180,130,60,0.08),transparent)]" />
      
      <div className="relative mx-auto max-w-2xl px-8 py-10">
        <PageHeader
          title="模型设置"
          subtitle="配置 AI 中转站地址、密钥和使用的模型。所有内容仅保存在本地。"
          actions={saveActions}
          dark
        />

        <div className="space-y-5">
          {/* API URL */}
          <div className={cardClass}>
            <label className={labelClass}>API URL</label>
            <input type="url" value={settings.baseUrl} onChange={e => set("baseUrl", e.target.value)}
              placeholder="https://your-proxy.example.com/v1" className={inputClass} />
            <p className="mt-2 text-xs text-[#9a8a6a]">填入到 /v1 结尾的完整地址，例如：https://yunwu.ai/v1</p>
          </div>

          {/* API Key */}
          <div className={cardClass}>
            <label className={labelClass}>API Key</label>
            <input type="password" value={settings.apiKey} onChange={e => set("apiKey", e.target.value)}
              placeholder="sk-..." className={inputClass} />
            <p className="mt-2 text-xs text-[#9a8a6a]">密钥只存储在你的浏览器本地，不会上传到任何服务器。</p>
          </div>

          {/* 默认模型 */}
          <div className={cardClass}>
            <label className={labelClass}>默认模型</label>
            <input type="text" value={settings.defaultModel} onChange={e => set("defaultModel", e.target.value)}
              placeholder="claude-opus-4-1" className={inputClass} />
          </div>

          {/* 可选模型列表 */}
          <div className={cardClass}>
            <label className={labelClass}>可选模型列表</label>
            <textarea rows={6} value={settings.modelsText} onChange={e => set("modelsText", e.target.value)}
              placeholder={"一行一个模型名，例如：\nclaude-opus-4-1\nclaude-sonnet-4-5"}
              className="w-full resize-none rounded-xl border border-[#5a4a3a] bg-[#f5f0e6] px-4 py-2.5 text-sm leading-7 text-[#2a1a0a] outline-none placeholder:text-[#a08a6a] focus:border-[#d4a050] focus:shadow-[0_0_12px_rgba(212,160,80,0.3)] transition" />
          </div>
        </div>

        {/* 底部保存按钮 */}
        <div className="mt-8 flex items-center justify-between">
          {savedAt ? <span className="text-sm text-[#c0a878]">已保存 {savedAt}</span> : <span />}
          <button onClick={handleSave} className="rounded-full bg-[#d4a050] px-8 py-2.5 text-sm text-[#1a0e04] font-medium transition hover:bg-[#e0b060] hover:shadow-[0_0_16px_rgba(212,160,80,0.4)]">
            保存设置
          </button>
        </div>

        <div className="mt-8">
          <DataBackup dark />
        </div>
      </div>
    </main>
  );
}
