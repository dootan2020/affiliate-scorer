import { TrendingUp, TrendingDown } from "lucide-react";
import { formatPercent } from "@/lib/utils/format";

interface LifecycleBadgeProps {
  stage: string;
  salesChange: number;
  kolChange: number;
  message: string;
}

const STAGES = ["new", "rising", "hot", "peak", "declining", "dead"] as const;

const STAGE_LABELS: Record<string, string> = {
  new: "Moi",
  rising: "Rising",
  hot: "Hot",
  peak: "Peak",
  declining: "Giam",
  dead: "Dead",
  unknown: "N/A",
};

const STAGE_COLORS: Record<string, { dot: string; text: string; bg: string }> = {
  new: { dot: "bg-gray-400", text: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-slate-800" },
  rising: { dot: "bg-emerald-500 animate-pulse", text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950" },
  hot: { dot: "bg-orange-500", text: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-950" },
  peak: { dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-950" },
  declining: { dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50 dark:bg-rose-950" },
  dead: { dot: "bg-gray-300 dark:bg-gray-600", text: "text-gray-500 dark:text-gray-500", bg: "bg-gray-50 dark:bg-slate-800" },
  unknown: { dot: "bg-gray-300", text: "text-gray-500", bg: "bg-gray-50 dark:bg-slate-800" },
};

function getColors(stage: string): { dot: string; text: string; bg: string } {
  return STAGE_COLORS[stage] ?? STAGE_COLORS.unknown;
}

export function LifecycleBadge({ stage, salesChange, kolChange, message }: LifecycleBadgeProps): React.ReactElement {
  const colors = getColors(stage);
  const activeIndex = STAGES.indexOf(stage as typeof STAGES[number]);

  return (
    <div className={`${colors.bg} rounded-2xl p-4 sm:p-5 space-y-4`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-500 dark:text-gray-400">Vong doi:</span>
        <span className={`text-sm font-semibold uppercase ${colors.text}`}>
          {STAGE_LABELS[stage] ?? stage}
        </span>
      </div>

      {/* Stage indicator */}
      <div className="flex items-center gap-0">
        {STAGES.map((s, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          const stageColor = getColors(s);
          return (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-3 h-3 rounded-full ${isActive ? stageColor.dot : isPast ? "bg-gray-400 dark:bg-gray-500" : "bg-gray-200 dark:bg-slate-700"}`} />
                <span className={`text-[10px] mt-1 ${isActive ? stageColor.text + " font-semibold" : "text-gray-400 dark:text-gray-500"}`}>
                  {STAGE_LABELS[s]}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`h-0.5 flex-1 ${isPast || isActive ? "bg-gray-400 dark:bg-gray-500" : "bg-gray-200 dark:bg-slate-700"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          {salesChange >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          )}
          <span className="text-gray-500 dark:text-gray-400">Ban hang:</span>
          <span className={salesChange >= 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-rose-600 dark:text-rose-400 font-medium"}>
            {salesChange >= 0 ? "+" : ""}{formatPercent(salesChange)}
          </span>
        </span>
        <span className="flex items-center gap-1">
          {kolChange >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          )}
          <span className="text-gray-500 dark:text-gray-400">KOL:</span>
          <span className={kolChange >= 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-rose-600 dark:text-rose-400 font-medium"}>
            {kolChange >= 0 ? "+" : ""}{formatPercent(kolChange)}
          </span>
        </span>
      </div>

      {/* Message */}
      {message && (
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{message}</p>
      )}
    </div>
  );
}
