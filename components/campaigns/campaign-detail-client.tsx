"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Stub imports for child tab components (to be built in Phase 3A UI components)
// import { DailyResultForm } from "./daily-result-form";
// import { DailyResultsTable } from "./daily-results-table";
// import { CampaignChecklist } from "./campaign-checklist";
// import { CampaignContentList } from "./campaign-content-list";
// import { CampaignConclusion } from "./campaign-conclusion";

const TABS = [
  { key: "daily", label: "Kết quả hàng ngày" },
  { key: "checklist", label: "Checklist" },
  { key: "content", label: "Content" },
  { key: "conclusion", label: "Kết luận" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** Serialized daily result row from JSON column */
export interface DailyResultRow {
  date: string;
  spend: number;
  revenue: number;
  orders: number;
  roas: number;
  notes: string;
}

/** Serialized checklist item from JSON column */
export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

/** Serialized content post */
export interface ContentPostItem {
  id: string;
  url: string;
  platform: string;
  contentType: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  notes: string | null;
  postedAt: string | null;
}

export interface CampaignDetailClientProps {
  campaignId: string;
  status: string;
  dailyResults: DailyResultRow[];
  checklist: ChecklistItem[];
  contentPosts: ContentPostItem[];
  verdict: string | null;
  lessonsLearned: string | null;
}

function TabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}): React.ReactElement {
  return (
    <nav className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1 overflow-x-auto scrollbar-none">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
            activeTab === tab.key
              ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50",
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function CampaignDetailClientInner(
  props: CampaignDetailClientProps,
): React.ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as TabKey) || "daily";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const handleTabChange = (tab: TabKey): void => {
    setActiveTab(tab);
    router.replace(`/campaigns/${props.campaignId}?tab=${tab}`, {
      scroll: false,
    });
  };

  return (
    <div className="space-y-6">
      <TabNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Daily Results tab */}
      {activeTab === "daily" && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
            Kết quả hàng ngày
          </h2>
          {/* DailyResultForm and DailyResultsTable will be rendered here */}
          {props.dailyResults.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800">
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-4">
                        Ngay
                      </th>
                      <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-4">
                        Chi phi
                      </th>
                      <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-4">
                        Doanh thu
                      </th>
                      <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-4">
                        Don hang
                      </th>
                      <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-4">
                        ROAS
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-4 hidden sm:table-cell">
                        Ghi chu
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {props.dailyResults.map((row, idx) => (
                      <tr
                        key={`${row.date}-${idx}`}
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-50">
                          {row.date}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600 dark:text-gray-300">
                          {row.spend.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600 dark:text-gray-300">
                          {row.revenue.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600 dark:text-gray-300">
                          {row.orders}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-gray-900 dark:text-gray-50">
                          {row.roas.toFixed(2)}x
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell max-w-[200px] truncate">
                          {row.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
              Chưa có dữ liệu hàng ngày. Thêm kết quả để theo dõi hiệu quả
              chiến dịch.
            </p>
          )}
        </section>
      )}

      {/* Checklist tab */}
      {activeTab === "checklist" && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
            Checklist
          </h2>
          {props.checklist.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
              <ul className="space-y-3">
                {props.checklist.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                        item.done
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-gray-300 dark:border-slate-600",
                      )}
                    >
                      {item.done && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        item.done
                          ? "text-gray-400 dark:text-gray-500 line-through"
                          : "text-gray-900 dark:text-gray-50",
                      )}
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
              Chưa có checklist nào.
            </p>
          )}
        </section>
      )}

      {/* Content tab */}
      {activeTab === "content" && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
            Content ({props.contentPosts.length})
          </h2>
          {props.contentPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {props.contentPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                      {post.platform}
                    </span>
                    {post.contentType && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {post.contentType}
                      </span>
                    )}
                  </div>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block mb-2"
                  >
                    {post.url}
                  </a>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {post.views !== null && <span>{post.views.toLocaleString("vi-VN")} views</span>}
                    {post.likes !== null && <span>{post.likes.toLocaleString("vi-VN")} likes</span>}
                    {post.comments !== null && <span>{post.comments} comments</span>}
                    {post.shares !== null && <span>{post.shares} shares</span>}
                  </div>
                  {post.notes && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {post.notes}
                    </p>
                  )}
                  {post.postedAt && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Dang ngay:{" "}
                      {new Date(post.postedAt).toLocaleDateString("vi-VN")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
              Chưa có content nào.
            </p>
          )}
        </section>
      )}

      {/* Conclusion tab */}
      {activeTab === "conclusion" && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
            Kết luận
          </h2>
          {props.status !== "planning" ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
              {props.verdict ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Ket qua:
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                        props.verdict === "profitable"
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : props.verdict === "break_even"
                            ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                            : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300",
                      )}
                    >
                      {props.verdict === "profitable"
                        ? "Co lai"
                        : props.verdict === "break_even"
                          ? "Hoa von"
                          : "Lo"}
                    </span>
                  </div>
                  {props.lessonsLearned && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Bai hoc rut ra:
                      </p>
                      <p className="text-sm text-gray-900 dark:text-gray-50 whitespace-pre-wrap">
                        {props.lessonsLearned}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                  Chưa có kết luận. Hoàn thành chiến dịch để thêm kết luận.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
              Chiến dịch đang ở trạng thái Planning. Bắt đầu chạy để xem kết
              luận.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

export function CampaignDetailClient(
  props: CampaignDetailClientProps,
): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="h-10 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      }
    >
      <CampaignDetailClientInner {...props} />
    </Suspense>
  );
}
