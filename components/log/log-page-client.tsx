"use client";

import { useState } from "react";
import { LogQuickMode } from "./log-quick-mode";
import { LogBatchMode } from "./log-batch-mode";

export function LogPageClient(): React.ReactElement {
  const [mode, setMode] = useState<"quick" | "batch">("quick");

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1 w-fit">
        <button
          onClick={() => setMode("quick")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "quick"
              ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Quick (1 video)
        </button>
        <button
          onClick={() => setMode("batch")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "batch"
              ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Batch (nhiều video)
        </button>
      </div>

      {mode === "quick" ? <LogQuickMode /> : <LogBatchMode />}
    </div>
  );
}
