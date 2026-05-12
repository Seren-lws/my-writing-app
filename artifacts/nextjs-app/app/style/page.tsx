export default function StylePage() {
  return (
    <div className="max-w-xl mx-auto px-8 py-12">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-stone-800">Writing Style</h2>
        <p className="text-sm text-stone-400 mt-0.5">Shape how your writing feels</p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="p-5 bg-white rounded-2xl border border-stone-200">
          <label className="block text-sm font-medium text-stone-700 mb-3">Tone</label>
          <div className="grid grid-cols-3 gap-2">
            {["Literary", "Conversational", "Minimalist"].map((t) => (
              <button
                key={t}
                className="py-2 text-sm rounded-lg border border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-700 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-stone-200">
          <label className="block text-sm font-medium text-stone-700 mb-3">Point of view</label>
          <div className="grid grid-cols-3 gap-2">
            {["First person", "Second person", "Third person"].map((p) => (
              <button
                key={p}
                className="py-2 text-sm rounded-lg border border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-700 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-stone-200">
          <label className="block text-sm font-medium text-stone-700 mb-2">Sentence length</label>
          <p className="text-xs text-stone-400 mb-3">Prefer shorter or longer sentences?</p>
          <input type="range" min="1" max="5" defaultValue="3" className="w-full accent-amber-400" />
          <div className="flex justify-between text-xs text-stone-400 mt-1">
            <span>Short &amp; punchy</span>
            <span>Long &amp; flowing</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-stone-200">
          <label className="block text-sm font-medium text-stone-700 mb-2">Custom style notes</label>
          <textarea
            rows={3}
            placeholder="e.g. Avoid adverbs. Use concrete details. Prefer active voice."
            className="w-full text-sm text-stone-600 bg-stone-50 rounded-lg px-3 py-2 outline-none border border-stone-200 focus:border-amber-400 resize-none placeholder:text-stone-300"
          />
        </div>

        <button className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-xl transition-colors">
          Save preferences
        </button>
      </div>
    </div>
  );
}
