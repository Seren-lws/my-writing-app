"use client";

import { useState } from "react";

type Props = {
  dark?: boolean;
};

export default function DataBackup({ dark = false }: Props) {
  const [importStatus, setImportStatus] = useState<string>("");

  // 导出所有 localStorage 数据
  function handleExport() {
    const allData: Record<string, unknown> = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      try {
        allData[key] = JSON.parse(localStorage.getItem(key) || "null");
      } catch {
        allData[key] = localStorage.getItem(key);
      }
    }

    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    const filename = `writing-backup-${ts}.json`;

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    setImportStatus("✅ 已导出备份文件！");
    setTimeout(() => setImportStatus(""), 3000);
  }

  // 导入数据
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (typeof data !== "object" || data === null) {
          setImportStatus("❌ 文件格式不对哦");
          return;
        }

        // 写入 localStorage
        let count = 0;
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
          count++;
        }

        setImportStatus(`✅ 成功恢复 ${count} 条数据！刷新页面即可看到~`);
      } catch {
        setImportStatus("❌ 导入失败，文件可能损坏了");
      }
    };
    reader.readAsText(file);

    // 清空 input 以便重复选择同一文件
    e.target.value = "";
  }

  const wrapperClass = dark
    ? "rounded-2xl border border-[#4a3828]/60 bg-[#2a1e14]/80 p-6 shadow-[inset_0_1px_0_rgba(212,176,112,0.1),0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-sm"
    : "rounded-2xl border border-[#e0d4c0] bg-[#faf7f2] p-6 shadow-sm";

  const titleClass = dark
    ? "mb-1 text-sm font-medium text-[#d4a050]"
    : "mb-1 text-sm font-medium text-[#a07030]";

  const descClass = dark
    ? "mb-4 text-xs text-[#9a8a6a]"
    : "mb-4 text-xs text-[#9a7a58]";

  const btnClass = dark
    ? "rounded-full border border-[#4a3828]/60 bg-[#3a2a1a] px-4 py-2 text-sm text-[#c0a878] transition hover:bg-[#4a3520] hover:border-[#d4a050]/60"
    : "rounded-full border border-[#e0d4c0] bg-[#f0ead8] px-4 py-2 text-sm text-[#7c5038] transition hover:bg-[#ede5d5] hover:border-[#c8a87a]";

  const statusClass = dark
    ? "mt-3 text-sm text-[#c0a878]"
    : "mt-3 text-sm text-[#7c5038]";

  return (
    <div className={wrapperClass}>
      <h3 className={titleClass}>数据备份</h3>
      <p className={descClass}>
        你的所有数据都存在浏览器本地。定期备份，换电脑或清缓存时可以恢复~
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={handleExport} className={btnClass}>
          📦 导出全部数据
        </button>

        <label className={`cursor-pointer ${btnClass}`}>
          📥 导入备份
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {importStatus && (
        <p className={statusClass}>{importStatus}</p>
      )}
    </div>
  );
}
