"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sun,
  AlertCircle,
  TrendingUp,
  Loader2,
  Target,
  BarChart3,
} from "lucide-react";
import { formatVND } from "@/lib/utils/format";

interface ActionItem {
  type: string;
  priority: "high" | "medium" | "low";
  message: string;
  link?: string;
}

interface MorningBriefData {
  date: string;
  actions: ActionItem[];
  summary: {
    activeCampaigns: number;
    pausedCampaigns: number;
    weeklySpend: number;
    weeklyRevenue: number;
    weeklyProfit: number;
  };
  goal: {
    type: string;
    targetAmount: number;
    currentAmount: number;
    month: string;
  } | null;
}

function getPriorityIcon(
  priority: string
): React.ReactElement {
  switch (priority) {
    case "high":
      return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
    case "medium":
      return <TrendingUp className="w-4 h-4 text-amber-500 shrink-0" />;
    default:
      return <BarChart3 className="w-4 h-4 text-blue-500 shrink-0" />;
  }
}

function formatTodayString(): string {
  return new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function MorningBriefWidget(): React.ReactElement {
  const [data, setData] = useState<MorningBriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBrief(): Promise<void> {
      try {
        const res = await fetch("/api/morning-brief");
        if (!res.ok) throw new Error("Khong the tai morning brief");
        const json = (await res.json()) as MorningBriefData;
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Loi khong xac dinh");
      } finally {
        setLoading(false);
      }
    }

    fetchBrief();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center mb-3">
            <Sun className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
            Chua co campaigns
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
            Xem Top 10 SP va chon SP dau tien!
          </p>
          <Link
            href="/products"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Xem san pham →
          </Link>
        </div>
      </div>
    );
  }

  const goalProgress =
    data.goal && data.goal.targetAmount > 0
      ? Math.min(
          100,
          Math.round((data.goal.currentAmount / data.goal.targetAmount) * 100)
        )
      : null;

  const sortedActions = [...data.actions].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Sun className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50">
          Morning Brief — {formatTodayString()}
        </h3>
      </div>

      {sortedActions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
            Viec can lam
          </p>
          {sortedActions.map((action, i) => (
            <div
              key={`action-${i}`}
              className="flex items-start gap-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 px-3 py-2.5"
            >
              {getPriorityIcon(action.priority)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-50">
                  {action.message}
                </p>
                {action.link && (
                  <Link
                    href={action.link}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Xem chi tiet →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Active
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {data.summary.activeCampaigns}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tam dung
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {data.summary.pausedCampaigns}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Chi (tuan)
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {formatVND(data.summary.weeklySpend)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Lai (tuan)
          </p>
          <p
            className={`text-lg font-semibold ${
              data.summary.weeklyProfit >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {data.summary.weeklyProfit >= 0 ? "+" : ""}
            {formatVND(data.summary.weeklyProfit)}
          </p>
        </div>
      </div>

      {data.goal && goalProgress !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Target className="w-3.5 h-3.5" />
              Muc tieu thang
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-50">
              {formatVND(data.goal.currentAmount)} /{" "}
              {formatVND(data.goal.targetAmount)}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-slate-800">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <p className="text-xs text-right text-gray-400 dark:text-gray-500">
            {goalProgress}%
          </p>
        </div>
      )}
    </div>
  );
}
