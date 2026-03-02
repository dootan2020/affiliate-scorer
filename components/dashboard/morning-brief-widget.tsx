"use client";

import { useEffect, useState, useRef } from "react";
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
  ChevronDown,
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
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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

  // --- Header bar (always visible) ---
  function renderHeader(): React.ReactElement {
    return (
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => { if (brief) setExpanded((e) => !e); }}
      >
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Bản tin sáng — {formatTodayString()}
          </h3>
          {loading && (
            <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">
              Đang tạo...
            </span>
          )}
          {error && !loading && (
            <span className="text-xs text-rose-500">Lỗi</span>
          )}
          {!brief && !loading && !error && (
            <span className="text-xs text-gray-400">Chưa có bản tin</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {brief && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:inline">
              Tạo lúc {formatTime(brief.generatedAt)}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              fetchBrief(true);
            }}
            disabled={refreshing || loading}
            aria-label="Tạo lại brief"
            title="Tạo lại brief"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          {brief && (
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </div>
    );
  }

  // --- Error inline ---
  if (error && !loading && !brief) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4">
        {renderHeader()}
        <div className="mt-3 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-gray-600 dark:text-gray-400">{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBrief(true)}
            disabled={refreshing}
            className="ml-auto"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  // --- No brief yet ---
  if (!brief && !loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4">
        {renderHeader()}
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Chưa có data — </span>
          <Link href="/sync" className="text-orange-600 dark:text-orange-400 hover:underline text-sm font-medium">
            Đồng bộ sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  const content = brief?.content;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4">
      {renderHeader()}

      {/* Collapsible content */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: expanded ? `${contentRef.current?.scrollHeight ?? 2000}px` : "0px",
          opacity: expanded ? 1 : 0,
        }}
      >
        {content && (
          <div className="pt-4 space-y-4 border-t border-gray-100 dark:border-slate-800 mt-3">
            {/* Greeting */}
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {content.greeting}
            </p>

            {/* Channel Tasks */}
            {content.channel_tasks && content.channel_tasks.length > 0 && (
              <BriefSection icon={Tv} title="Việc cần làm theo kênh">
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
              </BriefSection>
            )}

            {/* Produce Today */}
            {content.produce_today.length > 0 && (
              <BriefSection title="Hôm nay sản xuất">
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
              </BriefSection>
            )}

            {/* New Products Alert */}
            {content.new_products_alert.length > 0 && (
              <BriefSection icon={Package} title="Sản phẩm mới">
                {content.new_products_alert.map((item, i) => (
                  <div key={`new-${i}`} className="flex items-start gap-2 text-sm">
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
              </BriefSection>
            )}

            {/* Upcoming Events */}
            {content.upcoming_events && content.upcoming_events.length > 0 && (
              <BriefSection icon={Calendar} title="Sự kiện sắp tới">
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
              </BriefSection>
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
        )}
      </div>
    </div>
  );
}

function BriefSection({
  icon: Icon,
  title,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium flex items-center gap-1">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {title}
      </p>
      {children}
    </div>
  );
}
