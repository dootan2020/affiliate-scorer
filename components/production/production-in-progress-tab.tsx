"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Inbox } from "lucide-react";
import { BriefPreviewCard } from "./brief-preview-card";
import type { BriefWithProduct } from "@/lib/types/production";

interface Props {
  onSwitchToCreate?: () => void;
}

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

export function ProductionInProgressTab({ onSwitchToCreate }: Props): React.ReactElement {
  const [briefs, setBriefs] = useState<BriefWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBriefs = useCallback(async () => {
    try {
      const res = await fetch("/api/briefs?status=active&limit=50");
      const json = (await res.json()) as { data?: BriefWithProduct[] };
      setBriefs(json.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBriefs();
  }, [fetchBriefs]);

  async function handleRegenerate(briefId: string): Promise<void> {
    const res = await fetch(`/api/briefs/${briefId}/regenerate`, { method: "POST" });
    if (res.ok) {
      await fetchBriefs();
    } else {
      const json = (await res.json()) as { error?: string };
      throw new Error(json.error || "Lỗi tạo lại brief");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (briefs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
          Chưa có brief nào
        </h3>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          Tạo brief mới từ tab &quot;Tạo mới&quot; để bắt đầu sản xuất video.
        </p>
        {onSwitchToCreate && (
          <button
            onClick={onSwitchToCreate}
            className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all"
          >
            Tạo mới
          </button>
        )}
      </div>
    );
  }

  const grouped = groupByDay(briefs);

  // Count briefs per product today for daily limit display
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCounts = new Map<string, number>();
  for (const brief of briefs) {
    if (new Date(brief.createdAt) >= todayStart) {
      const pid = brief.productIdentity.id;
      todayCounts.set(pid, (todayCounts.get(pid) || 0) + 1);
    }
  }

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
                onRegenerate={() => handleRegenerate(brief.id)}
                todayBriefCount={todayCounts.get(brief.productIdentity.id) || 0}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
