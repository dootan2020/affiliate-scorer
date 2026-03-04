"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertTriangle, X } from "lucide-react";
import { useActiveTasks, type UnifiedTask } from "@/lib/hooks/use-active-tasks";

/** Global floating widget showing all active background tasks. */
export function TaskProgressWidget(): React.ReactElement | null {
  const router = useRouter();
  const { tasks } = useActiveTasks();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const autoHideTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Auto-dismiss completed/failed tasks after 10s
  useEffect(() => {
    for (const task of tasks) {
      if ((task.status === "completed" || task.status === "failed") && !dismissed.has(task.id)) {
        if (!autoHideTimers.current.has(task.id)) {
          const timer = setTimeout(() => {
            setDismissed((prev) => new Set(prev).add(task.id));
            autoHideTimers.current.delete(task.id);
          }, 10_000);
          autoHideTimers.current.set(task.id, timer);
        }
      }
    }

    return () => {
      for (const timer of autoHideTimers.current.values()) {
        clearTimeout(timer);
      }
    };
  }, [tasks, dismissed]);

  const visible = tasks.filter((t) => !dismissed.has(t.id));
  if (visible.length === 0) return null;

  return (
    <div className="fixed z-50 bottom-4 right-4 sm:bottom-6 sm:right-6 max-sm:left-4 flex flex-col gap-2 max-w-sm w-full sm:w-auto">
      {visible.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onNavigate={() => { if (task.href) router.push(task.href); }}
          onDismiss={() => setDismissed((prev) => new Set(prev).add(task.id))}
        />
      ))}
    </div>
  );
}

function TaskRow({
  task,
  onNavigate,
  onDismiss,
}: {
  task: UnifiedTask;
  onNavigate: () => void;
  onDismiss: () => void;
}): React.ReactElement {
  const icon = getIcon(task.status);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-gray-200/60 dark:border-slate-700/60 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
      <button
        type="button"
        onClick={onNavigate}
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
      >
        <div className="shrink-0">{icon}</div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium truncate">{task.label}</p>
          {task.detail && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{task.detail}</p>
          )}
          {task.error && (
            <p className="text-xs text-rose-500 truncate">{task.error}</p>
          )}
        </div>
      </button>
      {(task.status === "completed" || task.status === "failed") && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      )}
    </div>
  );
}

function getIcon(status: UnifiedTask["status"]): React.ReactElement {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    case "failed":
      return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    default:
      return <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />;
  }
}
