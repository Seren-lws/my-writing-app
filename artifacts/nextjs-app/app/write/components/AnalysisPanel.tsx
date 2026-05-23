"use client";

type AIIssue = { type: "typo" | "ai"; text: string; suggestion: string };

type Props = {
  analysisMode: "none" | "repeat" | "ai";
  repeatWords: { word: string; count: number }[];
  aiIssues: AIIssue[];
  aiAnalyzing: boolean;
  onRepeatAnalysis: () => void;
  onAIAnalysis: () => void;
  onLocate: (word: string) => void;
};

export default function AnalysisPanel({
  analysisMode,
  repeatWords,
  aiIssues,
  aiAnalyzing,
  onRepeatAnalysis,
  onAIAnalysis,
  onLocate,
}: Props) {
  return (
    <>
      {/* Toggle buttons */}
      <div className="flex gap-2">
        <button
          onClick={onRepeatAnalysis}
          className={`flex-1 rounded-xl border py-2 text-xs transition ${
            analysisMode === "repeat"
              ? "border-[#7c4f2a] bg-[#7c4f2a] text-amber-50"
              : "border-[#e0d4c0] text-[#7c5038] hover:bg-[#f0ead8]"
          }`}
        >
          重复词
        </button>
        <button
          onClick={onAIAnalysis}
          className={`flex-1 rounded-xl border py-2 text-xs transition ${
            analysisMode === "ai"
              ? "border-[#7c4f2a] bg-[#7c4f2a] text-amber-50"
              : "border-[#e0d4c0] text-[#7c5038] hover:bg-[#f0ead8]"
          }`}
        >
          {aiAnalyzing ? "检测中…" : "AI 检测"}
        </button>
      </div>

      {/* Repeat words results */}
      {analysisMode === "repeat" && (
        <div className="mt-3">
          {repeatWords.length > 0 ? (
            <>
              <p className="mb-2 text-xs text-[#9a7a58]">点击词语可在编辑器中定位</p>
              <div className="flex flex-wrap gap-1.5">
                {repeatWords.map(({ word, count }) => (
                  <button
                    key={word}
                    onClick={() => onLocate(word)}
                    className="rounded-full border border-[#e0d4c0] bg-[#f0ead8] px-2.5 py-1 text-xs text-[#a07030] transition hover:bg-[#e8d8c0]"
                  >
                    {word} <span className="text-[#9a7a58]">×{count}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-[#9a7a58]">未发现明显重复词（≥3次）</p>
          )}
        </div>
      )}

      {/* AI analysis results */}
      {analysisMode === "ai" && (
        <div className="mt-3">
          {aiAnalyzing && (
            <p className="text-xs text-[#9a7a58] animate-pulse">AI 正在分析…</p>
          )}
          {!aiAnalyzing && aiIssues.length === 0 && (
            <p className="text-xs text-[#9a7a58]">未发现明显问题</p>
          )}
          {aiIssues.length > 0 && (
            <div className="space-y-2">
              {aiIssues.map((issue, i) => (
                <div key={i} className="rounded-xl border border-[#e0d4c0] bg-[#f0ead8] p-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        issue.type === "typo"
                          ? "bg-red-50 text-red-600"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {issue.type === "typo" ? "错别字" : "AI味"}
                    </span>
                    <button
                      onClick={() => onLocate(issue.text.slice(0, 12))}
                      className="text-[10px] text-[#9a7a58] underline underline-offset-2 hover:text-[#7c5038]"
                    >
                      定位
                    </button>
                  </div>
                  <p className="text-xs text-[#3d2b1a] leading-5">「{issue.text}」</p>
                  <p className="mt-1 text-xs text-[#9a7a58] leading-5">{issue.suggestion}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
