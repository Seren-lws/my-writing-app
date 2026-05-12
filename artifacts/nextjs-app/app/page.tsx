import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-8 py-16">
      <div className="mb-12">
        <h2 className="text-3xl font-semibold text-stone-800 mb-2">Good evening.</h2>
        <p className="text-stone-500 text-lg">What would you like to work on today?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/write"
          className="group p-6 bg-white rounded-2xl border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-3">✍️</div>
          <h3 className="font-medium text-stone-800 mb-1">Write</h3>
          <p className="text-sm text-stone-400">Open the editor and start writing</p>
        </Link>

        <Link
          href="/inspirations"
          className="group p-6 bg-white rounded-2xl border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-3">💡</div>
          <h3 className="font-medium text-stone-800 mb-1">Inspirations</h3>
          <p className="text-sm text-stone-400">Browse your saved ideas and notes</p>
        </Link>

        <Link
          href="/transform"
          className="group p-6 bg-white rounded-2xl border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-3">🔄</div>
          <h3 className="font-medium text-stone-800 mb-1">Transform</h3>
          <p className="text-sm text-stone-400">Turn dialogue into narrative prose</p>
        </Link>

        <Link
          href="/style"
          className="group p-6 bg-white rounded-2xl border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-3">🎨</div>
          <h3 className="font-medium text-stone-800 mb-1">Style</h3>
          <p className="text-sm text-stone-400">Configure your writing style</p>
        </Link>
      </div>

      <div className="mt-12 p-5 bg-amber-50 rounded-2xl border border-amber-100">
        <p className="text-sm text-amber-700 italic">
          "A writer only begins a book. A reader finishes it." — Samuel Johnson
        </p>
      </div>
    </div>
  );
}
