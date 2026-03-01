"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchBriefs = useCallback(async () => {
    setFetchError(null);
    try {
      const res = await fetch("/api/briefs?status=active&limit=50");
      if (!res.ok) {
        toast.error(`Lỗi tải briefs (${res.status})`);
        setFetchError("Không thể tải danh sách briefs");
        return;
      }
      const json = (await res.json()) as { data?: BriefWithProduct[] };
      setBriefs(json.data || []);
    } catch (e) {
      console.error("[production-in-progress-tab]", e);
      toast.error("Không thể tải danh sách briefs");
      setFetchError("Không thể tải danh sách briefs");
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
      toast.success("Đã tạo lại brief thành công");
      await fetchBriefs();
    } else {
      const json = (await res.json()) as { error?: string };
      const msg = json.error || "Lỗi tạo lại brief";
      toast.error(msg);
      throw new Error(msg);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-3 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-32 bg-gray-100 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="h-20 bg-gray-50 dark:bg-slate-800/50 rounded-xl" />
            </div>
          ))}
        </div>
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
        <Button variant="link" onClick={() => { setLoading(true); setFetchError(null); void fetchBriefs(); }}>Thử lại</Button>
      </div>
    );
  }

  if (briefs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <Inbox className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
          Chưa có brief nào
        </h3>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          Tạo brief mới từ tab &quot;Tạo mới&quot; để bắt đầu sản xuất video.
        </p>
        {onSwitchToCreate && (
          <Button
            onClick={onSwitchToCreate}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Tạo mới
          </Button>
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
                showExport
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
