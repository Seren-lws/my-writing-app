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

  const inputClass = "w-full rounded-xl border border-[#e0d4c0] bg-[#f0ead8] px-4 py-2.5 text-sm text-[#3d2b1a] outline-none placeholder:text-[#c0a078] focus:border-[#c8a87a] transition";
  const cardClass = "rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-6 shadow-sm";
  const labelClass = "mb-2 block text-sm font-medium text-[#a07030]";

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
          title="模型设置"
          subtitle="配置 AI 中转站地址、密钥和使用的模型。所有内容仅保存在本地。"
          actions={saveActions}
        />

        <div className="space-y-5">
          <div className={cardClass}>
            <label className={labelClass}>API URL</label>
            <input type="url" value={settings.baseUrl} onChange={e => set("baseUrl", e.target.value)}
              placeholder="https://your-proxy.example.com/v1" className={inputClass} />
            <p className="mt-2 text-xs text-[#9a7a58]">填入到 /v1 结尾的完整地址，例如：https://yunwu.ai/v1</p>
          </div>
          <div className={cardClass}>
            <label className={labelClass}>API Key</label>
            <input type="password" value={settings.apiKey} onChange={e => set("apiKey", e.target.value)}
              placeholder="sk-..." className={inputClass} />
            <p className="mt-2 text-xs text-[#9a7a58]">密钥只存储在你的浏览器本地，不会上传到任何服务器。</p>
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
              className="w-full resize-none bg-transparent text-sm leading-7 text-[#3d2b1a] outline-none placeholder:text-[#c0a078]" />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          {savedAt ? <span className="text-sm text-[#9a7a58]">已保存 {savedAt}</span> : <span />}
          <button onClick={handleSave} className="rounded-full bg-[#7c4f2a] px-8 py-2.5 text-sm text-amber-50 transition hover:bg-[#643e1f]">
            保存设置
          </button>
        </div>

        <div className="mt-8">
          <DataBackup />
        </div>
      </div>
    </main>
  );
}
