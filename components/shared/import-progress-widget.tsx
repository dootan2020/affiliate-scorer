"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, CheckCircle, AlertTriangle } from "lucide-react";
import { useActiveImportBatch, type ActiveBatch } from "@/lib/hooks/use-active-import-batch";
import { dispatchSuggestionEvent } from "@/lib/events/suggestion-events";

/** Global floating widget showing import/scoring status on ALL pages. */
export function ImportProgressWidget(): React.ReactElement | null {
  const router = useRouter();
  const { batch } = useActiveImportBatch();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const autoHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive state
  const isActive = batch != null && batch.id !== dismissed;
  const isImporting = batch?.status === "pending" || batch?.status === "processing";
  const isScoring = !isImporting && (batch?.scoringStatus === "pending" || batch?.scoringStatus === "processing");
  const isCompleted = batch?.status === "completed" || batch?.status === "partial";
  const isDone = isCompleted && batch?.scoringStatus === "completed";
  const hasFailed = batch?.status === "failed";
  const scoringFailed = !hasFailed && isCompleted && batch?.scoringStatus === "failed";

  // Dispatch suggestion refresh when import+scoring completes
  const didDispatchRef = useRef<string | null>(null);
  useEffect(() => {
    if (isDone && batch && didDispatchRef.current !== batch.id) {
      didDispatchRef.current = batch.id;
      dispatchSuggestionEvent("import-completed");
    }
  }, [isDone, batch?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-hide completed/failed state after 10s
  useEffect(() => {
    if ((isDone || hasFailed || scoringFailed) && batch) {
      autoHideRef.current = setTimeout(() => setDismissed(batch.id), 10_000);
    }
    return () => {
      if (autoHideRef.current) clearTimeout(autoHideRef.current);
    };
  }, [isDone, hasFailed, scoringFailed, batch?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isActive) return null;

  const { icon, label } = getDisplay(batch!, {
    isImporting, isScoring, isDone, hasFailed, scoringFailed,
  });

  return (
    <button
      type="button"
      onClick={() => router.push("/sync")}
      className="
        fixed z-50 cursor-pointer
        bottom-4 right-4 sm:bottom-6 sm:right-6
        max-sm:left-4 max-sm:right-4
        flex items-center gap-3 px-4 py-3
        bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl
        border border-gray-200/60 dark:border-slate-700/60
        rounded-xl shadow-lg hover:shadow-xl
        transition-all duration-200 hover:-translate-y-0.5
      "
    >
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium truncate">{label}</p>
        {batch!.fileName && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {batch!.fileName}
          </p>
        )}
      </div>
    </button>
  );
}

interface DisplayState {
  isImporting: boolean;
  isScoring: boolean;
  isDone: boolean;
  hasFailed: boolean;
  scoringFailed: boolean;
}

function getDisplay(
  batch: ActiveBatch,
  state: DisplayState,
): { icon: React.ReactElement; label: string } {
  if (state.hasFailed) {
    return {
      icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
      label: "Import thất bại",
    };
  }
  if (state.scoringFailed) {
    return {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      label: "Chấm điểm lỗi",
    };
  }
  if (state.isDone) {
    const total = batch.rowsCreated + batch.rowsUpdated;
    return {
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      label: `Hoàn thành ${total} SP`,
    };
  }
  if (state.isScoring) {
    return {
      icon: <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />,
      label: "Đang chấm điểm...",
    };
  }
  return {
    icon: <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />,
    label: "Đang import...",
  };
}
