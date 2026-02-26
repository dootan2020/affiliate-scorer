import { Tv, CheckCircle2, HelpCircle } from "lucide-react";
import { formatVND } from "@/lib/utils/format";

interface ChannelRecommendation {
  channel: string;
  reason: string;
  contentSuggestion: string;
  budgetSuggestion: number | null;
  confidence: string;
}

interface ChannelRecommendationsProps {
  recommendations: ChannelRecommendation[];
}

const CHANNEL_COLORS: Record<string, { icon: string; bg: string; border: string }> = {
  tiktok_organic: { icon: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-100 dark:border-pink-900/50" },
  tiktok_ads: { icon: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-100 dark:border-pink-900/50" },
  facebook_ads: { icon: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-100 dark:border-blue-900/50" },
  youtube: { icon: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-100 dark:border-red-900/50" },
  shopee: { icon: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-100 dark:border-orange-900/50" },
};

function getChannelStyle(channel: string): { icon: string; bg: string; border: string } {
  const key = channel.toLowerCase().replace(/\s+/g, "_");
  return CHANNEL_COLORS[key] ?? { icon: "text-gray-500", bg: "bg-gray-50 dark:bg-slate-800", border: "border-gray-100 dark:border-slate-700" };
}

function formatChannelName(channel: string): string {
  const names: Record<string, string> = {
    tiktok_organic: "TikTok Organic",
    tiktok_ads: "TikTok Ads",
    facebook_ads: "Facebook Ads",
    youtube: "YouTube",
    shopee: "Shopee",
  };
  return names[channel.toLowerCase().replace(/\s+/g, "_")] ?? channel;
}

export function ChannelRecommendations({ recommendations }: ChannelRecommendationsProps): React.ReactElement {
  if (recommendations.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Chưa có gợi ý kênh phân phối.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
        <Tv className="w-5 h-5 text-indigo-500" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Gợi ý kênh phân phối</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recommendations.map((rec, i) => {
          const style = getChannelStyle(rec.channel);
          const isDataBased = rec.confidence === "data";
          return (
            <div key={i} className={`rounded-xl border ${style.border} ${style.bg} p-4 space-y-2.5`}>
              {/* Channel name */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tv className={`w-4 h-4 ${style.icon}`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {formatChannelName(rec.channel)}
                  </span>
                </div>
                {/* Confidence badge */}
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 ${
                  isDataBased
                    ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
                }`}>
                  {isDataBased ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <HelpCircle className="w-3 h-3" />
                  )}
                  {isDataBased ? "dựa trên data" : "gợi ý chung"}
                </span>
              </div>

              {/* Reason */}
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{rec.reason}</p>

              {/* Content suggestion */}
              <div className="text-xs">
                <span className="text-gray-500 dark:text-gray-400">Content: </span>
                <span className="text-gray-700 dark:text-gray-300">{rec.contentSuggestion}</span>
              </div>

              {/* Budget */}
              {rec.budgetSuggestion !== null && rec.budgetSuggestion > 0 && (
                <div className="text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Budget: </span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {formatVND(rec.budgetSuggestion)}/ngày
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
