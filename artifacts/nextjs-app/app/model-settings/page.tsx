"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

  const inputClass = "w-full rounded-xl border border-[#4c2c14] bg-[#311d0c] px-4 py-2.5 text-sm text-[#f0e6d3] outline-none placeholder:text-[#5a3820] focus:border-[#c8a060] transition";
  const cardClass = "rounded-2xl border border-[#4c2c14] bg-[#261609] p-6 shadow-sm";
  const labelClass = "mb-2 block text-sm font-medium text-[#d4a05a]";

  return (
    <main className="min-h-screen bg-[#1c1108] text-[#f0e6d3]">
      <div className="mx-auto max-w-2xl px-8 py-12">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <Link href="/" className="mb-4 inline-block text-sm text-[#c8a878] transition hover:text-[#f0e6d3]">← 回到小屋</Link>
            <h1 className="text-3xl font-semibold text-[#f0e6d3]">模型设置</h1>
            <p className="mt-2 text-sm text-[#c8a878]">配置 AI 中转站地址、密钥和使用的模型。所有内容仅保存在本地。</p>
          </div>
          <div className="flex flex-col items-end gap-2 pt-8">
            {savedAt && <span className="text-xs text-[#8a6040]">已保存 {savedAt}</span>}
            <button onClick={handleSave} className="rounded-full bg-[#6e4b2d] px-6 py-2 text-sm text-amber-50 transition hover:bg-[#58391f]">保存</button>
          </div>
        </div>

        <div className="space-y-5">
          <div className={cardClass}>
            <label className={labelClass}>API URL</label>
            <input type="url" value={settings.baseUrl} onChange={e => set("baseUrl", e.target.value)}
              placeholder="https://your-proxy.example.com/v1" className={inputClass} />
          </div>
          <div className={cardClass}>
            <label className={labelClass}>API Key</label>
            <input type="password" value={settings.apiKey} onChange={e => set("apiKey", e.target.value)}
              placeholder="sk-..." className={inputClass} />
            <p className="mt-2 text-xs text-[#8a6040]">密钥只存储在你的浏览器本地，不会上传到任何服务器。</p>
          </div>
          <div className={cardClass}>
            <label className={labelClass}>默认模型</label>
            <input type="text" value={settings.defaultModel} onChange={e => set("defaultModel", e.target.value)}
              placeholder="claude-opus-4-1" className={inputClass} />
          </div>
          <div className={cardClass}>
            <label className={labelClass}>可选模型列表</label>
            <textarea rows={6} value={settings.modelsText} onChange={e => set("modelsText", e.target.value)}
              placeholder={"一行一个模型名，例如：\nclaude-opus-4-1\nclaude-sonnet-4-5"}
              className="w-full resize-none bg-transparent text-sm leading-7 text-[#f0e6d3] outline-none placeholder:text-[#5a3820]" />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          {savedAt ? <span className="text-sm text-[#8a6040]">已保存 {savedAt}</span> : <span />}
          <button onClick={handleSave} className="rounded-full bg-[#6e4b2d] px-8 py-2.5 text-sm text-amber-50 transition hover:bg-[#58391f]">保存设置</button>
        </div>
      </div>
    </main>
  );
}
