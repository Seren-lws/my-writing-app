"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DNA = { languageStyle: string; writingPrefs: string; taboos: string; references: string; dynamics: string };
const EMPTY: DNA = { languageStyle: "", writingPrefs: "", taboos: "", references: "", dynamics: "" };

const fields: { key: keyof DNA; label: string; placeholder: string }[] = [
  { key: "languageStyle", label: "语言风格", placeholder: "比如：细腻、暧昧、克制、情绪流动强、对白自然……" },
  { key: "writingPrefs", label: "写作偏好", placeholder: "比如：喜欢慢热、拉扯、细节、身体语言、留白……" },
  { key: "taboos", label: "禁忌清单", placeholder: "比如：不要网感太重、不要说教、不要过度解释、不要AI味……" },
  { key: "references", label: "参考作品 / 参考作者", placeholder: "比如：可以写你喜欢的文风、作品、影视氛围……" },
  { key: "dynamics", label: "常用人物关系与张力", placeholder: "比如：暧昧拉扯、权力差、互相试探、克制失控……" },
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

  return (
    <main className="min-h-screen bg-[#140c05] text-[#f0e6d3]">
      <div className="mx-auto max-w-2xl px-8 py-12">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <Link href="/" className="mb-4 inline-block text-sm text-[#c8a878] hover:text-[#f0e6d3] transition-colors">← 回到小屋</Link>
            <h1 className="text-3xl font-semibold text-[#f0e6d3]">我的写作 DNA</h1>
            <p className="mt-2 text-sm text-[#c8a878]">记下你独有的语感、偏好和禁区，让每一次创作都更像你。</p>
          </div>
          <div className="flex flex-col items-end gap-2 pt-8">
            {savedAt && <span className="text-xs text-[#8a6040]">已保存 {savedAt}</span>}
            <button onClick={handleSave} className="rounded-full bg-[#6e4b2d] px-6 py-2 text-sm text-amber-50 transition hover:bg-[#58391f]">保存</button>
          </div>
        </div>

        <div className="space-y-6">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key} className="rounded-2xl border border-[#3a2010] bg-[#1e1008] p-6 shadow-sm">
              <label className="mb-3 block text-sm font-medium text-[#d4a05a]">{label}</label>
              <textarea rows={3} value={dna[key]} onChange={e => handleChange(key, e.target.value)} placeholder={placeholder}
                className="w-full resize-none bg-transparent text-sm leading-7 text-[#f0e6d3] outline-none placeholder:text-[#5a3820]" />
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          {savedAt ? <span className="text-sm text-[#8a6040]">已保存 {savedAt}</span> : <span />}
          <button onClick={handleSave} className="rounded-full bg-[#6e4b2d] px-8 py-2.5 text-sm text-amber-50 transition hover:bg-[#58391f]">保存写作 DNA</button>
        </div>
      </div>
    </main>
  );
}
