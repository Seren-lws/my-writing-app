export default function TransformPage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-stone-800">Transform</h2>
        <p className="text-sm text-stone-400 mt-0.5">Turn raw dialogue into narrative prose</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-stone-600">Dialogue input</label>
          <textarea
            rows={14}
            placeholder={`A: Did you see what happened last night?\nB: I don't want to talk about it.\nA: We have to. It changes everything.`}
            className="w-full text-sm text-stone-700 bg-white rounded-2xl px-4 py-3 outline-none border border-stone-200 focus:border-amber-400 resize-none placeholder:text-stone-300 leading-relaxed"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-stone-600">Narrative output</label>
          <div className="flex-1 bg-amber-50 rounded-2xl border border-amber-100 px-4 py-3 min-h-[14rem]">
            <p className="text-sm text-stone-400 italic">Your transformed prose will appear here…</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">Style:</span>
          <select className="text-xs text-stone-600 bg-white border border-stone-200 rounded-lg px-2 py-1.5 outline-none focus:border-amber-400">
            <option>Literary</option>
            <option>Conversational</option>
            <option>Minimalist</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">POV:</span>
          <select className="text-xs text-stone-600 bg-white border border-stone-200 rounded-lg px-2 py-1.5 outline-none focus:border-amber-400">
            <option>Third person</option>
            <option>First person</option>
            <option>Second person</option>
          </select>
        </div>
        <button className="ml-auto px-5 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-xl transition-colors">
          Transform
        </button>
      </div>
    </div>
  );
}
