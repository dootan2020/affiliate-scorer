"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Sparkles, CheckCircle, AlertTriangle } from "lucide-react";
import { useActiveImportBatch, type ActiveBatch } from "@/lib/hooks/use-active-import-batch";

/** Global floating widget showing import/scoring progress on all pages except /sync. */
export function ImportProgressWidget(): React.ReactElement | null {
  const pathname = usePathname();
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

  // Auto-hide completed state after 10s
  useEffect(() => {
    if (isDone && batch) {
      autoHideRef.current = setTimeout(() => setDismissed(batch.id), 10_000);
    }
    return () => {
      if (autoHideRef.current) clearTimeout(autoHideRef.current);
    };
  }, [isDone, batch?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // R3: Hide on /sync page
  if (pathname === "/sync") return null;
  if (!isActive) return null;

  const { icon, label, color } = getDisplay(batch!, {
    isImporting,
    isScoring,
    isDone,
    hasFailed,
    scoringFailed,
  });

  return (
    <button
      type="button"
      onClick={() => router.push("/sync")}
      className={`
        fixed z-50 cursor-pointer
        bottom-4 right-4 sm:bottom-6 sm:right-6
        max-sm:left-4 max-sm:right-4
        flex items-center gap-3 px-4 py-3
        bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl
        border border-gray-200/60 dark:border-slate-700/60
        rounded-xl shadow-lg hover:shadow-xl
        transition-all duration-200 hover:-translate-y-0.5
        ${color}
      `}
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
      {(isImporting || isScoring) && (
        <MiniProgress batch={batch!} isScoring={isScoring} />
      )}
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
): { icon: React.ReactElement; label: string; color: string } {
  if (state.hasFailed) {
    return {
      icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
      label: "Import thất bại",
      color: "",
    };
  }
  if (state.scoringFailed) {
    return {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      label: "Chấm điểm lỗi",
      color: "",
    };
  }
  if (state.isDone) {
    const total = batch.rowsCreated + batch.rowsUpdated;
    return {
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      label: `Hoàn thành ${total} SP`,
      color: "",
    };
  }
  if (state.isScoring) {
    return {
      icon: <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />,
      label: `Đang chấm điểm...`,
      color: "",
    };
  }
  // Importing
  const progress =
    batch.rowsProcessed > 0 && batch.recordCount > 0
      ? `${batch.rowsProcessed}/${batch.recordCount}`
      : "";
  return {
    icon: <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />,
    label: progress ? `Đang import ${progress}...` : "Đang import...",
    color: "",
  };
}

const RADIUS = 15;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~94.25

function MiniProgress({
  batch,
  isScoring,
}: {
  batch: ActiveBatch;
  isScoring: boolean;
}): React.ReactElement | null {
  if (batch.recordCount === 0) return null;

  const ratio = Math.min(batch.rowsProcessed / batch.recordCount, 1);
  const pct = isScoring
    ? 50 + Math.round(ratio * 50)
    : Math.round(ratio * 50);
  const dashLen = (pct / 100) * CIRCUMFERENCE;

  return (
    <div className="w-10 h-10 shrink-0 relative">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <circle
          cx="18" cy="18" r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-gray-100 dark:text-slate-800"
        />
        <circle
          cx="18" cy="18" r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={`${dashLen} ${CIRCUMFERENCE - dashLen}`}
          strokeLinecap="round"
          className={isScoring ? "text-purple-500" : "text-orange-500"}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-300">
        {pct}%
      </span>
    </div>
  );
}
