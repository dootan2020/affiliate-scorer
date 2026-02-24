"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export function ScoreButton(): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleScore(): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi chấm điểm");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleScore}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all w-full sm:w-auto text-center disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
    >
      <Sparkles className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Đang chấm điểm..." : "Chạy phân tích AI"}
    </button>
  );
}
