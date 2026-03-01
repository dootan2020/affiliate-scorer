"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { BriefPreviewCard } from "./brief-preview-card";
import type { BriefWithProduct } from "@/lib/types/production";

function groupByDay(briefs: BriefWithProduct[]): Map<string, BriefWithProduct[]> {
  const groups = new Map<string, BriefWithProduct[]>();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const brief of briefs) {
    const dateStr = new Date(brief.createdAt).toDateString();
    let label: string;
    if (dateStr === today) label = "Hôm nay";
    else if (dateStr === yesterday) label = "Hôm qua";
    else label = new Date(brief.createdAt).toLocaleDateString("vi-VN", { day: "numeric", month: "long" });

    const existing = groups.get(label) || [];
    existing.push(brief);
    groups.set(label, existing);
  }
  return groups;
}

export function ProductionCompletedTab(): React.ReactElement {
  const [briefs, setBriefs] = useState<BriefWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setFetchError(null);
    try {
      const res = await fetch("/api/briefs?status=completed&limit=50");
      const json = (await res.json()) as { data?: BriefWithProduct[] };
      setBriefs(json.data || []);
    } catch (e) {
      setFetchError("Lỗi tải danh sách brief");
      console.error("[production-completed-tab]", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{fetchError}</p>
        <button onClick={() => { setLoading(true); void load(); }} className="text-sm text-blue-600 hover:underline">Thử lại</button>
      </div>
    );
  }

  if (briefs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
          Chưa có brief hoàn thành
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Khi tất cả video trong brief đã đăng hoặc bỏ, brief sẽ tự chuyển sang đây.
        </p>
      </div>
    );
  }

  const grouped = groupByDay(briefs);

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([dayLabel, dayBriefs]) => (
        <div key={dayLabel}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {dayLabel}
          </h3>
          <div className="space-y-4">
            {dayBriefs.map((brief) => (
              <BriefPreviewCard
                key={brief.id}
                brief={brief}
                collapsed
                showReplacedBadge
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
