"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface LearningResult {
  accuracy: number;
  previousAccuracy: number;
  patterns: string[];
  insights: string;
  weightsAdjusted: boolean;
  weekNumber: number;
}

export function TriggerLearningButton() {
  const [loading, setLoading] = useState(false);

  async function handleTrigger() {
    setLoading(true);
    try {
      const res = await fetch("/api/learning/trigger", { method: "POST" });
      const json = (await res.json()) as { data?: LearningResult; error?: string };

      if (!res.ok) {
        toast.error(json.error ?? "Lỗi khi chạy learning");
        return;
      }

      const result = json.data;
      toast.success(
        `Learning tuần ${result?.weekNumber ?? "?"} hoàn thành — độ chính xác ${Math.round((result?.accuracy ?? 0) * 100)}%`
      );

      // Reload to show updated data
      window.location.reload();
    } catch {
      toast.error("Lỗi kết nối khi chạy learning cycle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleTrigger} disabled={loading} size="sm">
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      {loading ? "Đang chạy..." : "Chạy Learning"}
    </Button>
  );
}
