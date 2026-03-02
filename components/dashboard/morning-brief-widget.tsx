"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sun,
  RefreshCw,
  Sparkles,
  Lightbulb,
  BarChart3,
  Package,
  Tv,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry";
import { Button } from "@/components/ui/button";

interface ProduceItem {
  product: string;
  productId?: string;
  reason: string;
  videos: number;
  priority: number;
}

interface NewProductAlert {
  product: string;
  productId?: string;
  why: string;
}

interface ChannelTask {
  channel: string;
  channelId?: string;
  action: string;
  priority: number;
}

interface UpcomingEvent {
  title: string;
  date: string;
}

interface BriefContent {
  greeting: string;
  channel_tasks?: ChannelTask[];
  produce_today: ProduceItem[];
  new_products_alert: NewProductAlert[];
  upcoming_events?: UpcomingEvent[];
  yesterday_recap: string;
  tip: string;
  weekly_progress: string;
}

interface DailyBriefRecord {
  id: string;
  briefDate: string;
  content: BriefContent;
  generatedAt: string;
}

function formatTodayString(): string {
  return new Date().toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MorningBriefWidget(): React.ReactElement {
  const [brief, setBrief] = useState<DailyBriefRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchBrief(refresh = false): Promise<void> {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const url = refresh ? "/api/brief/today?refresh=true" : "/api/brief/today";
      const res = await fetchWithRetry(url);
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Không tạo được brief");
      }
      const json = (await res.json()) as { data: DailyBriefRecord };
      setBrief(json.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchBrief();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
          <Sun className="w-5 h-5 text-amber-500 animate-pulse" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Bản tin sáng — {formatTodayString()}
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center mb-3 animate-pulse">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Đang tạo bản tin với AI...
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Phân tích dữ liệu kênh, sản phẩm, hiệu suất
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
          <Sun className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Bản tin sáng — {formatTodayString()}
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
            Không tạo được bản tin
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
            {error}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBrief(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center mb-3">
            <Sun className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
            Chào mừng đến PASTR!
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
            Chưa có data — bắt đầu bằng cách thêm sản phẩm vào Inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/sync"
              className="text-sm text-orange-600 dark:text-orange-400 hover:underline font-medium"
            >
              Đồng bộ sản phẩm
            </Link>
            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
            <Link
              href="/production"
              className="text-sm text-orange-600 dark:text-orange-400 hover:underline font-medium"
            >
              Sản xuất video
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const content = brief.content;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Bản tin sáng — {formatTodayString()}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            Tạo lúc {formatTime(brief.generatedAt)}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => fetchBrief(true)}
            disabled={refreshing}
            aria-label="Tạo lại brief"
            title="Tạo lại brief"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Greeting */}
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {content.greeting}
      </p>

      {/* Channel Tasks */}
      {content.channel_tasks && content.channel_tasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium flex items-center gap-1">
            <Tv className="w-3.5 h-3.5" />
            Việc cần làm theo kênh
          </p>
          {content.channel_tasks
            .sort((a, b) => a.priority - b.priority)
            .map((task, i) => (
              <div
                key={`channel-task-${i}`}
                className="flex items-start gap-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 px-3 py-2.5"
              >
                <span className="text-sm font-medium text-gray-400 dark:text-gray-500 mt-0.5 w-5 shrink-0">
                  {task.priority}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {task.channelId ? (
                      <Link
                        href={`/channels/${task.channelId}`}
                        className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                      >
                        {task.channel}
                      </Link>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                        {task.channel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {task.action}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Produce Today */}
      {content.produce_today.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
            Hôm nay sản xuất
          </p>
          {content.produce_today
            .sort((a, b) => a.priority - b.priority)
            .map((item, i) => (
              <div
                key={`produce-${i}`}
                className="flex items-start gap-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 px-3 py-2.5"
              >
                <span className="text-sm font-medium text-gray-400 dark:text-gray-500 mt-0.5 w-5 shrink-0">
                  {item.priority}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.productId ? (
                      <Link
                        href={`/inbox/${item.productId}`}
                        className="text-sm font-medium text-gray-900 dark:text-gray-50 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                      >
                        {item.product}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {item.product}
                      </p>
                    )}
                    <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 px-1.5 py-0.5 rounded-full">
                      {item.videos} video
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {item.reason}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* New Products Alert */}
      {content.new_products_alert.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            Sản phẩm mới
          </p>
          {content.new_products_alert.map((item, i) => (
            <div
              key={`new-${i}`}
              className="flex items-start gap-2 text-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                {item.productId ? (
                  <Link
                    href={`/inbox/${item.productId}`}
                    className="font-medium text-gray-900 dark:text-gray-50 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    {item.product}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-900 dark:text-gray-50">
                    {item.product}
                  </span>
                )}
                <span className="text-gray-500 dark:text-gray-400"> — {item.why}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Events */}
      {content.upcoming_events && content.upcoming_events.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Sự kiện sắp tới
          </p>
          {content.upcoming_events.map((evt, i) => (
            <div
              key={`event-${i}`}
              className="flex items-center gap-2 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 px-3 py-2"
            >
              <Calendar className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span className="text-sm text-gray-900 dark:text-gray-50 font-medium">{evt.title}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{evt.date}</span>
            </div>
          ))}
        </div>
      )}

      {/* Yesterday Recap */}
      {content.yesterday_recap && (
        <div className="flex items-start gap-2 rounded-xl bg-gray-50 dark:bg-slate-800/50 px-3 py-2.5">
          <BarChart3 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {content.yesterday_recap}
          </p>
        </div>
      )}

      {/* Tip */}
      {content.tip && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5">
          <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {content.tip}
          </p>
        </div>
      )}

      {/* Weekly Progress */}
      {content.weekly_progress && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
          {content.weekly_progress}
        </p>
      )}
    </div>
  );
}
