import Link from "next/link";

export default function StatsPage() {
  return (
    <div className="max-w-xl mx-auto px-8 py-16 flex flex-col items-center text-center">
      <div className="text-4xl mb-6">📊</div>
      <h2 className="text-2xl font-semibold text-stone-800 mb-3">成绩看板</h2>
      <p className="text-stone-400 leading-relaxed mb-10">
        查看你的写作成果——字数、作品数量、<br />完成率，把每一份努力都算数。
      </p>
      <div className="w-full grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "累计字数", value: "—" },
          { label: "完成作品", value: "—" },
          { label: "连续天数", value: "—" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="p-5 bg-white rounded-2xl border border-stone-200 flex flex-col items-center gap-1"
          >
            <span className="text-2xl font-semibold text-amber-400">{value}</span>
            <span className="text-xs text-stone-400">{label}</span>
          </div>
        ))}
      </div>
      <Link
        href="/"
        className="text-sm text-amber-600 hover:text-amber-800 transition-colors"
      >
        ← 返回首页
      </Link>
    </div>
  );
}
