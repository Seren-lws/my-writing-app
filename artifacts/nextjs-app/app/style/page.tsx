"use client";

import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";

type DNA = { languageStyle: string; writingPrefs: string; taboos: string; references: string; dynamics: string };
const EMPTY: DNA = { languageStyle: "", writingPrefs: "", taboos: "", references: "", dynamics: "" };

const fields: { key: keyof DNA; label: string; placeholder: string }[] = [
  { key: "languageStyle", label: "语言风格", placeholder: "比如：细腻、暧昧、克制、情绪流动强、对白自然……" },
  { key: "writingPrefs",  label: "写作偏好", placeholder: "比如：喜欢慢热、拉扯、细节、身体语言、留白……" },
  { key: "taboos",        label: "禁忌清单", placeholder: "比如：不要网感太重、不要说教、不要过度解释、不要AI味……" },
  { key: "references",    label: "参考作品 / 参考作者", placeholder: "比如：可以写你喜欢的文风、作品、影视氛围……" },
  { key: "dynamics",      label: "常用人物关系与张力", placeholder: "比如：暧昧拉扯、权力差、互相试探、克制失控……" },
];

export default function StylePage() {
  const [dna, setDna] = useState<DNA>(EMPTY);
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    try { const raw = localStorage.getItem("writing-dna"); if (raw) setDna({ ...EMPTY, ...JSON.parse(raw) }); } catch {}
  }, []);

  function handleChange(key: keyof DNA, value: string) {
    setDna(prev => ({ ...prev, [key]: value }));
  }
  function handleSave() {
    localStorage.setItem("writing-dna", JSON.stringify(dna));
    setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
  }

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
          title="我的写作 DNA"
          subtitle="记下你独有的语感、偏好和禁区，让每一次创作都更像你。"
          actions={saveActions}
        />

        <div className="space-y-6">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key} className="rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-6 shadow-sm">
              <label className="mb-3 block text-sm font-medium text-[#a07030]">{label}</label>
              <textarea rows={3} value={dna[key]} onChange={e => handleChange(key, e.target.value)} placeholder={placeholder}
                className="w-full resize-none bg-transparent text-sm leading-7 text-[#3d2b1a] outline-none placeholder:text-[#c0a078]" />
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          {savedAt ? <span className="text-sm text-[#9a7a58]">已保存 {savedAt}</span> : <span />}
          <button onClick={handleSave} className="rounded-full bg-[#7c4f2a] px-8 py-2.5 text-sm text-amber-50 transition hover:bg-[#643e1f]">
            保存写作 DNA
          </button>
        </div>
      </div>
    </main>
  );
}
