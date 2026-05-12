import Link from "next/link";

export default function ReadersPage() {
  return (
    <div className="max-w-xl mx-auto px-8 py-16 flex flex-col items-center text-center">
      <div className="text-4xl mb-6">💌</div>
      <h2 className="text-2xl font-semibold text-stone-800 mb-3">读者来信</h2>
      <p className="text-stone-400 leading-relaxed mb-10">
        收藏来自读者的留言与反馈，<br />每一封信都是写作路上的温暖陪伴。
      </p>
      <div className="w-full p-8 bg-amber-50 rounded-2xl border border-amber-100 text-amber-300 text-sm mb-10">
        还没有收到来信，继续写下去吧
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
