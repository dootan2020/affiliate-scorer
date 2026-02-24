"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";

interface ChecklistItem {
  label: string;
  dueDay: number;
  completed: boolean;
  completedAt: string | null;
}

interface CampaignChecklistProps {
  campaignId: string;
  checklist: ChecklistItem[];
  startedAt: string | null;
}

function getDaysSinceStart(startedAt: string | null): number {
  if (!startedAt) return 0;
  const start = new Date(startedAt);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function CampaignChecklist({
  campaignId,
  checklist: initialChecklist,
  startedAt,
}: CampaignChecklistProps): React.ReactElement {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [saving, setSaving] = useState(false);

  const daysSinceStart = getDaysSinceStart(startedAt);

  async function handleToggle(index: number): Promise<void> {
    const updated = checklist.map((item, i) => {
      if (i !== index) return item;
      return {
        ...item,
        completed: !item.completed,
        completedAt: !item.completed ? new Date().toISOString() : null,
      };
    });

    setChecklist(updated);
    setSaving(true);

    try {
      await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: updated }),
      });
    } catch {
      setChecklist(initialChecklist);
    } finally {
      setSaving(false);
    }
  }

  const completedCount = checklist.filter((item) => item.completed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {completedCount}/{checklist.length} hoan thanh
          {startedAt && ` — Ngay thu ${daysSinceStart}`}
        </p>
        {saving && (
          <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">
            Dang luu...
          </span>
        )}
      </div>

      <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all"
          style={{
            width: `${checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0}%`,
          }}
        />
      </div>

      <div className="space-y-1">
        {checklist.map((item, i) => {
          const isOverdue =
            !item.completed &&
            startedAt !== null &&
            item.dueDay <= daysSinceStart;

          return (
            <button
              key={`${item.label}-${item.dueDay}`}
              type="button"
              onClick={() => handleToggle(i)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                item.completed
                  ? "bg-gray-50 dark:bg-slate-800/50"
                  : isOverdue
                    ? "bg-amber-50 dark:bg-amber-950/30"
                    : "hover:bg-gray-50 dark:hover:bg-slate-800/50"
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : isOverdue ? (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
              )}

              <span
                className={`text-sm flex-1 ${
                  item.completed
                    ? "line-through text-gray-400 dark:text-gray-500"
                    : "text-gray-900 dark:text-gray-50"
                }`}
              >
                {item.label}
              </span>

              <span
                className={`text-xs shrink-0 ${
                  isOverdue
                    ? "text-amber-600 dark:text-amber-400 font-medium"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                Ngay {item.dueDay}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
