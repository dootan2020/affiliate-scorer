"use client";

import { useState } from "react";
import { Loader2, Target } from "lucide-react";
import { formatVND } from "@/lib/utils/format";

interface GoalData {
  id?: string;
  type: string;
  targetAmount: number;
  currentAmount?: number;
  month: string;
}

interface GoalSettingModalProps {
  currentGoal?: GoalData;
  trigger: React.ReactNode;
}

const GOAL_TYPES = [
  { value: "monthly_profit", label: "Lợi nhuận tháng" },
  { value: "monthly_revenue", label: "Doanh thu tháng" },
];

function getCurrentMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function GoalSettingModal({
  currentGoal,
  trigger,
}: GoalSettingModalProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [type, setType] = useState(currentGoal?.type ?? "monthly_profit");
  const [targetAmount, setTargetAmount] = useState(
    currentGoal?.targetAmount?.toString() ?? ""
  );
  const [month, setMonth] = useState(currentGoal?.month ?? getCurrentMonth());

  function handleOpenChange(next: boolean): void {
    setOpen(next);
    if (next) {
      setError(null);
      setSaved(false);
      setType(currentGoal?.type ?? "monthly_profit");
      setTargetAmount(currentGoal?.targetAmount?.toString() ?? "");
      setMonth(currentGoal?.month ?? getCurrentMonth());
    }
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          targetAmount: Number(targetAmount),
          month,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Lưu mục tiêu thất bại");
      }

      setSaved(true);
      setTimeout(() => setOpen(false), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  const progress =
    currentGoal && currentGoal.targetAmount > 0 && currentGoal.currentAmount !== undefined
      ? Math.min(
          100,
          Math.round((currentGoal.currentAmount / currentGoal.targetAmount) * 100)
        )
      : null;

  return (
    <>
      <div onClick={() => handleOpenChange(true)}>{trigger}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => handleOpenChange(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Đặt mục tiêu
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Thiết lập mục tiêu doanh thu hoặc lợi nhuận hàng tháng
              </p>
            </div>

            {currentGoal && progress !== null && (
              <div className="rounded-xl bg-gray-50 dark:bg-slate-800 p-4 space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Mục tiêu hiện tại
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-50">
                    {formatVND(currentGoal.currentAmount ?? 0)} /{" "}
                    {formatVND(currentGoal.targetAmount)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
                  {progress}%
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Loại mục tiêu
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  {GOAL_TYPES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Số tiền mục tiêu (VND)
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="5000000"
                  min={0}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Tháng
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              )}

              {saved && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Đã lưu mục tiêu thành công!
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Huy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50"
                  disabled={loading || !targetAmount}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu mục tiêu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
