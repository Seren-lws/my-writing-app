import Link from "next/link";

export default function CalendarPage() {
  return (
    <div className="max-w-xl mx-auto px-8 py-16 flex flex-col items-center text-center">
      <div className="text-4xl mb-6">📅</div>
      <h2 className="text-2xl font-semibold text-stone-800 mb-3">写作日历</h2>
      <p className="text-stone-400 leading-relaxed mb-10">
        在这里记录你每天的写作时光，追踪写作习惯，<br />让坚持变得可见。
      </p>
      <div className="w-full p-8 bg-amber-50 rounded-2xl border border-amber-100 text-amber-300 text-sm mb-10">
        日历功能即将上线
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
