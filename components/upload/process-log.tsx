"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ImportStatus } from "@/lib/hooks/use-import-polling";
import type { UploadResult } from "./upload-progress";

interface LogEntry {
  time: string;
  icon: string;
  message: string;
}

function formatTime(): string {
  return new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function getSourceLabel(result: UploadResult): string {
  if (result.format === "fastmoss") return "FastMoss";
  if (result.format === "kalodata") return "KaloData";
  return result.source ?? result.format;
}

interface ProcessLogProps {
  result: UploadResult | null;
  status: ImportStatus;
  isPolling: boolean;
}

export function ProcessLog({
  result,
  status,
  isPolling,
}: ProcessLogProps): React.ReactElement | null {
  const [isExpanded, setIsExpanded] = useState(true);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const loggedRef = useRef<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries appear
  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length, isExpanded]);

  const addIfNew = useCallback(
    (key: string, icon: string, message: string) => {
      if (loggedRef.current.has(key)) return false;
      loggedRef.current.add(key);
      setEntries((prev) => [...prev, { time: formatTime(), icon, message }]);
      return true;
    },
    [],
  );

  // Derive log entries from state transitions
  useEffect(() => {
    // File loaded
    if (result) {
      addIfNew("file-loaded", "\u{1F4C4}", `Đã tải file: ${status.fileName}`);
    }

    // Source analysis
    if (result?.source || result?.format) {
      const label = getSourceLabel(result);
      addIfNew(
        "source-analysis",
        "\u{1F50D}",
        `Phân tích: ${label}, ${result.totalParsed} sản phẩm`,
      );
    }

    // Dedup
    if (result && result.afterDedup < result.totalParsed) {
      addIfNew(
        "dedup",
        "\u{1F504}",
        `Loại trùng: ${result.afterDedup} sản phẩm duy nhất`,
      );
    }

    // Import request sent
    if (isPolling || status.status !== "pending") {
      addIfNew("import-request", "\u{1F4E4}", "Gửi yêu cầu import...");
    }

    // Server processing
    if (
      status.status === "processing" ||
      status.status === "completed" ||
      status.status === "partial" ||
      status.status === "failed"
    ) {
      addIfNew("server-processing", "\u2699\uFE0F", "Server đang xử lý...");
    }

    // Rows being processed — log each chunk progress update
    if (
      status.rowsProcessed > 0 &&
      (status.status === "processing" || status.status === "pending")
    ) {
      addIfNew(
        `rows-${status.rowsProcessed}`,
        "\u{1F4CA}",
        `Đang import: ${status.rowsProcessed}/${status.recordCount}`,
      );
    }

    // Import complete
    if (status.status === "completed" || status.status === "partial") {
      addIfNew(
        "import-done",
        "\u2705",
        `Import hoàn tất: ${status.rowsCreated} mới, ${status.rowsUpdated} cập nhật, ${status.rowsError} lỗi`,
      );
    }

    // Import failed
    if (status.status === "failed") {
      addIfNew("import-failed", "\u274C", "Import thất bại");
    }

    // Scoring processing
    if (status.scoringStatus === "processing") {
      addIfNew("scoring-start", "\u{1F916}", "Đang chấm điểm AI...");
    }

    // Scoring completed
    if (status.scoringStatus === "completed") {
      addIfNew("scoring-done", "\u2705", "Chấm điểm hoàn tất");
    }

    // Scoring failed
    if (status.scoringStatus === "failed") {
      addIfNew(
        "scoring-failed",
        "\u26A0\uFE0F",
        "Chấm điểm thất bại (không ảnh hưởng import)",
      );
    }

    // Terminal (full success only)
    if (status.isTerminal && status.status !== "failed" && status.scoringStatus !== "failed") {
      addIfNew("terminal", "\u{1F389}", "Hoàn thành!");
    }
    // Terminal but scoring failed — partial success
    if (status.isTerminal && status.status !== "failed" && status.scoringStatus === "failed") {
      addIfNew("terminal-partial", "\u{1F4CB}", "Import hoàn tất. Chấm điểm có thể thử lại sau.");
    }
  }, [result, status, isPolling, addIfNew]);

  if (entries.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
        Nhật ký xử lý
      </button>

      {isExpanded && (
        <div
          ref={scrollRef}
          className="mt-2 max-h-48 overflow-y-auto rounded-xl bg-gray-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 p-3 font-mono text-xs leading-relaxed space-y-1"
        >
          {entries.map((entry, i) => (
            <div key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
              <span className="text-gray-400 dark:text-gray-500 shrink-0">{entry.time}</span>
              <span className="shrink-0">{entry.icon}</span>
              <span>{entry.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
