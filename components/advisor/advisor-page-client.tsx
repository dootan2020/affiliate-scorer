"use client";

import { useState, useCallback, useRef } from "react";
import {
  Send,
  Loader2,
  History,
  ChevronDown,
  ChevronUp,
  Crown,
  BarChart3,
  Megaphone,
  DollarSign,
  Wrench,
  Brain,
  MessageSquarePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CRoleId } from "@/lib/advisor/c-level-roles";

// ─── Types ───

interface CLevelResponse {
  roleId: CRoleId;
  name: string;
  title: string;
  content: string;
  modelUsed: string;
  error?: boolean;
}

interface PipelineResult {
  ceoDecision: CLevelResponse;
  cLevelResponses: CLevelResponse[];
  analystBriefing: CLevelResponse;
  question: string;
  timestamp: string;
}

interface HistoryEntry {
  question: string;
  timestamp: string;
}

// ─── Loading step labels ───

type LoadingStep = "analyst" | "clevel" | "ceo" | null;

const LOADING_LABELS: Record<string, string> = {
  analyst: "Đang thu thập data...",
  clevel: "Đang phân tích...",
  ceo: "CEO đang tổng hợp...",
};

// ─── Role visual config ───

const ROLE_STYLE: Record<CRoleId, {
  icon: React.ElementType;
  bg: string;
  border: string;
  iconBg: string;
  iconColor: string;
  titleColor: string;
}> = {
  analyst: {
    icon: BarChart3,
    bg: "bg-slate-50 dark:bg-slate-950/30",
    border: "border-slate-200 dark:border-slate-700",
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-400",
    titleColor: "text-slate-800 dark:text-slate-200",
  },
  cmo: {
    icon: Megaphone,
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800",
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    iconColor: "text-violet-600 dark:text-violet-400",
    titleColor: "text-violet-900 dark:text-violet-200",
  },
  cfo: {
    icon: DollarSign,
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    titleColor: "text-emerald-900 dark:text-emerald-200",
  },
  cto: {
    icon: Wrench,
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    titleColor: "text-blue-900 dark:text-blue-200",
  },
  ceo: {
    icon: Crown,
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    titleColor: "text-amber-900 dark:text-amber-200",
  },
};

// ─── Components ───

function CLevelCard({
  response,
  defaultOpen = false,
}: {
  response: CLevelResponse;
  defaultOpen?: boolean;
}): React.ReactElement {
  const [open, setOpen] = useState(defaultOpen);
  const style = ROLE_STYLE[response.roleId];
  const Icon = style.icon;

  return (
    <div className={cn("rounded-xl border transition-shadow", style.bg, style.border)}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", style.iconBg)}>
            <Icon className={cn("w-4 h-4", style.iconColor)} />
          </div>
          <div>
            <span className={cn("font-medium text-sm", style.titleColor)}>{response.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{response.title}</span>
          </div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0">
          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {response.content}
          </div>
        </div>
      )}
    </div>
  );
}

function CEODecisionCard({ response }: { response: CLevelResponse }): React.ReactElement {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-900 dark:text-amber-200">Quyết định CEO</h3>
          <p className="text-xs text-amber-600 dark:text-amber-400">Tổng hợp từ ban lãnh đạo</p>
        </div>
      </div>
      <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
        {response.content}
      </div>
    </div>
  );
}

function LoadingIndicator({ step }: { step: LoadingStep }): React.ReactElement {
  const steps: LoadingStep[] = ["analyst", "clevel", "ceo"];
  const currentIdx = step ? steps.indexOf(step) : -1;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {step ? LOADING_LABELS[step] : "Đang xử lý..."}
        </span>
      </div>
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i < currentIdx ? "bg-blue-500" :
                i === currentIdx ? "bg-blue-400 animate-pulse" :
                "bg-gray-200 dark:bg-slate-700"
              )}
            />
            <p className={cn(
              "text-[10px] mt-1 text-center",
              i <= currentIdx ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
            )}>
              {s === "analyst" ? "Thu thập" : s === "clevel" ? "Phân tích" : "Tổng hợp"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistorySidebar({
  entries,
  onSelect,
}: {
  entries: HistoryEntry[];
  onSelect: (question: string) => void;
}): React.ReactElement | null {
  if (entries.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Lịch sử</h3>
      </div>
      <div className="space-y-1">
        {entries.map((entry, i) => (
          <button
            key={`${entry.timestamp}-${i}`}
            onClick={() => onSelect(entry.question)}
            className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors truncate"
            title={entry.question}
          >
            {entry.question}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ───

export function AdvisorPageClient(): React.ReactElement {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [followUpMode, setFollowUpMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const buildContext = useCallback((): string | undefined => {
    if (!result) return undefined;
    const parts = [
      `[CEO]: ${result.ceoDecision.content}`,
      ...result.cLevelResponses.map((r) => `[${r.name}]: ${r.content}`),
    ];
    return parts.join("\n\n");
  }, [result]);

  const handleAnalyze = useCallback(async () => {
    const q = question.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    // Simulate step progression — real steps happen server-side
    setLoadingStep("analyst");
    const stepTimer1 = setTimeout(() => setLoadingStep("clevel"), 3000);
    const stepTimer2 = setTimeout(() => setLoadingStep("ceo"), 8000);

    try {
      const endpoint = followUpMode ? "/api/advisor/followup" : "/api/advisor/analyze";
      const body: Record<string, string | undefined> = { question: q };
      if (followUpMode) body.context = buildContext();

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as { data?: PipelineResult; error?: string };
      if (!res.ok || !json.data) {
        throw new Error(json.error ?? "Lỗi phân tích");
      }

      setResult(json.data);
      setFollowUpMode(true);

      setHistory((prev) => {
        const next = [{ question: q, timestamp: new Date().toISOString() }, ...prev];
        return next.slice(0, 10);
      });

      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể phân tích. Kiểm tra API key trong Settings.");
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setLoading(false);
      setLoadingStep(null);
    }
  }, [question, loading, followUpMode, buildContext]);

  const handleNewQuestion = useCallback(() => {
    setResult(null);
    setError(null);
    setFollowUpMode(false);
    setQuestion("");
    textareaRef.current?.focus();
  }, []);

  const handleHistorySelect = useCallback((q: string) => {
    setQuestion(q);
    setResult(null);
    setError(null);
    setFollowUpMode(false);
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleAnalyze();
    }
  }, [handleAnalyze]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          Cố vấn AI
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Ban lãnh đạo AI phân tích và ra quyết định chiến lược
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Input area */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
            <label htmlFor="advisor-question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {followUpMode ? "Câu hỏi tiếp theo" : "Câu hỏi chiến lược"}
            </label>
            <textarea
              ref={textareaRef}
              id="advisor-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ví dụ: Nên chọn ngách X hay Y? Chiến lược content tuần này? Video nào nên làm hôm nay?"
              rows={3}
              maxLength={2000}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                {followUpMode && (
                  <button
                    onClick={handleNewQuestion}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    Câu hỏi mới
                  </button>
                )}
                <span className="text-xs text-gray-400">{question.length}/2000</span>
              </div>
              <button
                onClick={() => void handleAnalyze()}
                disabled={!question.trim() || loading}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm transition-all",
                  question.trim() && !loading
                    ? "bg-blue-600 hover:bg-blue-700 text-white hover:shadow"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Phân tích
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Loading state */}
          {loading && <LoadingIndicator step={loadingStep} />}

          {/* Error */}
          {error && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
              <p className="text-sm text-amber-800 dark:text-amber-300">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Câu hỏi: &ldquo;{result.question}&rdquo;
              </p>

              {/* CEO Decision — prominent on top */}
              <CEODecisionCard response={result.ceoDecision} />

              {/* C-level details — accordion */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Chi tiết phân tích
                </p>
                {result.cLevelResponses.map((r) => (
                  <CLevelCard key={r.roleId} response={r} />
                ))}
                <CLevelCard response={result.analystBriefing} />
              </div>
            </div>
          )}
        </div>

        {/* History sidebar */}
        <div className="lg:col-span-1">
          <HistorySidebar entries={history} onSelect={handleHistorySelect} />
          {history.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Đặt câu hỏi để nhận quyết định từ ban lãnh đạo AI
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
