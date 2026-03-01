"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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

      window.location.reload();
    } catch {
      toast.error("Lỗi kết nối khi chạy learning cycle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleTrigger}
      disabled={loading}
      className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 w-full sm:w-auto"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {loading ? "Đang chạy..." : "Chạy Learning"}
    </Button>
  );
}
