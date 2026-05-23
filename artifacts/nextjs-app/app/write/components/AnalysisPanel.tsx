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
              ? "border-[#6e4b2d] bg-[#6e4b2d] text-amber-50"
              : "border-[#6a4020] text-[#c8a878] hover:bg-[#311d0c]"
          }`}
        >
          重复词
        </button>
        <button
          onClick={onAIAnalysis}
          className={`flex-1 rounded-xl border py-2 text-xs transition ${
            analysisMode === "ai"
              ? "border-[#6e4b2d] bg-[#6e4b2d] text-amber-50"
              : "border-[#6a4020] text-[#c8a878] hover:bg-[#311d0c]"
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
              <p className="mb-2 text-xs text-[#8a6040]">点击词语可在编辑器中定位</p>
              <div className="flex flex-wrap gap-1.5">
                {repeatWords.map(({ word, count }) => (
                  <button
                    key={word}
                    onClick={() => onLocate(word)}
                    className="rounded-full border border-[#6a4020] bg-[#311d0c] px-2.5 py-1 text-xs text-[#d4a05a] transition hover:bg-[#4c2c14]"
                  >
                    {word} <span className="text-[#8a6040]">×{count}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-[#8a6040]">未发现明显重复词（≥3次）</p>
          )}
        </div>
      )}

      {/* AI analysis results */}
      {analysisMode === "ai" && (
        <div className="mt-3">
          {aiAnalyzing && (
            <p className="text-xs text-[#8a6040] animate-pulse">AI 正在分析…</p>
          )}
          {!aiAnalyzing && aiIssues.length === 0 && (
            <p className="text-xs text-[#8a6040]">未发现明显问题</p>
          )}
          {aiIssues.length > 0 && (
            <div className="space-y-2">
              {aiIssues.map((issue, i) => (
                <div key={i} className="rounded-xl border border-[#4c2c14] bg-[#311d0c] p-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        issue.type === "typo"
                          ? "bg-red-950/50 text-red-400"
                          : "bg-[#1e1500] text-[#c8a060]"
                      }`}
                    >
                      {issue.type === "typo" ? "错别字" : "AI味"}
                    </span>
                    <button
                      onClick={() => onLocate(issue.text.slice(0, 12))}
                      className="text-[10px] text-[#8a6040] underline underline-offset-2 hover:text-[#c8a878]"
                    >
                      定位
                    </button>
                  </div>
                  <p className="text-xs text-[#f0e6d3] leading-5">「{issue.text}」</p>
                  <p className="mt-1 text-xs text-[#8a6040] leading-5">{issue.suggestion}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
