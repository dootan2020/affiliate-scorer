"use client";

import { useState, useEffect, useRef } from "react";
import type { ActiveBatch } from "@/lib/hooks/use-active-import-batch";

export interface BackgroundTaskItem {
  id: string;
  type: string;
  status: string;
  label: string;
  progress: number;
  detail: string | null;
  error: string | null;
  channelId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedTask {
  id: string;
  source: "task" | "import";
  label: string;
  status: "processing" | "completed" | "failed";
  detail: string | null;
  error: string | null;
  /** Where to navigate on click */
  href: string | null;
}

const POLL_INTERVAL = 2000;

function importToUnified(batch: ActiveBatch): UnifiedTask {
  const isImporting = batch.status === "pending" || batch.status === "processing";
  const isCompleted = batch.status === "completed" || batch.status === "partial";
  const isDone = isCompleted && batch.scoringStatus === "completed";
  const hasFailed = batch.status === "failed";
  const scoringFailed = !hasFailed && isCompleted && batch.scoringStatus === "failed";

  let label: string;
  let status: UnifiedTask["status"];

  if (hasFailed) {
    label = "Import thất bại";
    status = "failed";
  } else if (scoringFailed) {
    label = "Chấm điểm lỗi";
    status = "failed";
  } else if (isDone) {
    const total = batch.rowsCreated + batch.rowsUpdated;
    label = `Hoàn thành ${total} SP`;
    status = "completed";
  } else if (!isImporting) {
    label = "Đang chấm điểm...";
    status = "processing";
  } else {
    label = "Đang import...";
    status = "processing";
  }

  return {
    id: `import-${batch.id}`,
    source: "import",
    label,
    status,
    detail: batch.fileName || null,
    error: null,
    href: "/sync",
  };
}

function taskToUnified(t: BackgroundTaskItem): UnifiedTask {
  let status: UnifiedTask["status"];
  if (t.status === "completed") status = "completed";
  else if (t.status === "failed") status = "failed";
  else status = "processing";

  return {
    id: `task-${t.id}`,
    source: "task",
    label: t.label,
    status,
    detail: t.detail,
    error: t.error,
    href: t.channelId ? `/channels/${t.channelId}` : null,
  };
}

/** Poll both /api/tasks/active and /api/imports/active, return unified list. */
export function useActiveTasks(): {
  tasks: UnifiedTask[];
  hasActive: boolean;
} {
  const [tasks, setTasks] = useState<UnifiedTask[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = async (): Promise<void> => {
      // Skip polling when browser is offline to avoid ERR_NAME_NOT_RESOLVED
      if (typeof navigator !== "undefined" && !navigator.onLine) return;

      try {
        const [taskRes, importRes] = await Promise.all([
          fetch("/api/tasks/active"),
          fetch("/api/imports/active"),
        ]);

        const unified: UnifiedTask[] = [];

        if (taskRes.ok) {
          const json = (await taskRes.json()) as { data: BackgroundTaskItem[] };
          if (json.data) {
            unified.push(...json.data.map(taskToUnified));
          }
        }

        if (importRes.ok) {
          const json = (await importRes.json()) as { data: ActiveBatch | null };
          if (json.data) {
            unified.push(importToUnified(json.data));
          }
        }

        setTasks(unified);
      } catch {
        // network error — keep polling silently
      }
    };

    void poll();
    intervalRef.current = setInterval(() => void poll(), POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    tasks,
    hasActive: tasks.length > 0,
  };
}
