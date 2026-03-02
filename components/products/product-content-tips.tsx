import { Lightbulb, Globe, TrendingUp } from "lucide-react";
import { formatPlatform } from "@/lib/utils/format";
import type { ContentTip, PlatformStrategy } from "@/lib/utils/content-suggestions";

interface ProductContentTipsProps {
  contentTips: ContentTip;
  strategy: PlatformStrategy;
}

export function ProductContentTips({ contentTips, strategy }: ProductContentTipsProps): React.ReactElement {
  return (
    <>
      {/* Content Tips */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Gợi ý nội dung</p>
        </div>
        <div className="space-y-3 text-sm">
          <TipRow label="Dạng video phù hợp" value={contentTips.videoTypes.join(" / ")} bold />
          <TipRow label="Góc quay" value={contentTips.angles.join("; ")} />
          <TipRow label="Hook gợi ý" value={contentTips.hooks.join(", ")} />
          <TipRow label="Độ dài" value={contentTips.duration} />
          {contentTips.opportunity && (
            <p className="text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> {contentTips.opportunity}
            </p>
          )}
        </div>
      </div>

      {/* Platform Strategy */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-orange-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chiến lược nền tảng: {formatPlatform(strategy.platform)}
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <TipRow label="Lý do" value={strategy.reason} />
          <TipRow label="Kênh ưu tiên" value={strategy.priorityChannel} bold />
          {strategy.videoOpportunity && (
            <p className="text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> {strategy.videoOpportunity}
            </p>
          )}
          <TipRow label="Cạnh tranh" value={strategy.competition} />
          <TipRow label="Budget gợi ý" value={strategy.budgetSuggestion} />
        </div>
      </div>
    </>
  );
}

function TipRow({ label, value, bold }: { label: string; value: string; bold?: boolean }): React.ReactElement {
  return (
    <div>
      <span className="text-gray-500 dark:text-gray-400">{label}: </span>
      <span className={bold ? "text-gray-900 dark:text-gray-50 font-medium" : "text-gray-600 dark:text-gray-300"}>
        {value}
      </span>
    </div>
  );
}
