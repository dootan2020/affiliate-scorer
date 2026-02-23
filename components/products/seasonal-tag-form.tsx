"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

const PRESETS = [
  { key: "tet", label: "Tết" },
  { key: "valentine", label: "Valentine" },
  { key: "women_day", label: "8/3" },
  { key: "summer", label: "Mùa hè" },
  { key: "back_to_school", label: "Tựu trường" },
  { key: "halloween", label: "Halloween" },
  { key: "singles_day", label: "11/11" },
  { key: "christmas", label: "Giáng sinh" },
];

interface SeasonalTagFormProps {
  productId: string;
  currentTag: string | null;
  sellWindowStart: Date | null;
  sellWindowEnd: Date | null;
}

export function SeasonalTagForm({
  productId,
  currentTag,
  sellWindowStart,
  sellWindowEnd,
}: SeasonalTagFormProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tag, setTag] = useState(currentTag);

  async function handlePreset(preset: string, label: string): Promise<void> {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}/seasonal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: label, preset }),
      });
      if (res.ok) {
        setTag(label);
        setIsOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleClear(): Promise<void> {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}/seasonal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: null }),
      });
      if (res.ok) {
        setTag(null);
        setIsOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  // Check if current date is within sell window
  const now = new Date();
  const isInWindow =
    sellWindowStart && sellWindowEnd
      ? now >= new Date(sellWindowStart) && now <= new Date(sellWindowEnd)
      : null;
  const daysLeft =
    sellWindowEnd
      ? Math.ceil((new Date(sellWindowEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

  return (
    <div>
      {tag && (
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            <Calendar className="w-3 h-3" />
            {tag}
          </span>
          {isInWindow === false && (
            <span className="text-xs text-red-500">⛔ Ngoài mùa vụ</span>
          )}
          {isInWindow && daysLeft !== null && daysLeft <= 3 && daysLeft > 0 && (
            <span className="text-xs text-amber-500">⚠️ Còn {daysLeft} ngày</span>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
        disabled={saving}
      >
        <Calendar className="w-3.5 h-3.5" />
        {tag ? "Sửa mùa vụ" : "📅 Đánh dấu mùa vụ"}
      </button>

      {isOpen && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => handlePreset(p.key, p.label)}
                disabled={saving}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-700 dark:hover:text-blue-300 transition-colors shadow-sm"
              >
                {p.label}
              </button>
            ))}
          </div>
          {tag && (
            <button
              onClick={handleClear}
              disabled={saving}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Xóa tag mùa vụ
            </button>
          )}
        </div>
      )}
    </div>
  );
}
