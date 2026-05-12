export default function WritePage() {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-8 py-4 border-b border-stone-200 bg-white">
        <div>
          <input
            type="text"
            placeholder="Untitled"
            className="text-xl font-semibold text-stone-800 bg-transparent outline-none placeholder:text-stone-300 w-80"
          />
        </div>
        <button className="px-4 py-1.5 text-sm bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors">
          Save
        </button>
      </div>

      <div className="flex-1 px-12 py-10 overflow-auto">
        <textarea
          className="w-full max-w-2xl mx-auto block h-full min-h-[60vh] text-stone-700 text-lg leading-relaxed bg-transparent resize-none outline-none placeholder:text-stone-300"
          placeholder="Start writing…"
        />
      </div>

      <div className="px-8 py-3 border-t border-stone-100 bg-white flex items-center gap-6 text-xs text-stone-400">
        <span>0 words</span>
        <span>0 characters</span>
      </div>
    </div>
  );
}
