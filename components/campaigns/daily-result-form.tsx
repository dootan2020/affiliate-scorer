"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";

interface DailyResult {
  date: string;
  spend: number;
  orders: number;
  revenue: number;
  clicks?: number;
  notes?: string;
}

interface DailyResultFormProps {
  campaignId: string;
  existingDate?: string;
  existingData?: DailyResult;
  onSaved?: () => void;
}

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DailyResultForm({
  campaignId,
  existingDate,
  existingData,
  onSaved,
}: DailyResultFormProps): React.ReactElement {
  const isEdit = Boolean(existingData);

  const [date, setDate] = useState(existingDate ?? existingData?.date ?? todayString());
  const [spend, setSpend] = useState(existingData?.spend?.toString() ?? "");
  const [orders, setOrders] = useState(existingData?.orders?.toString() ?? "");
  const [revenue, setRevenue] = useState(
    existingData?.revenue?.toString() ?? ""
  );
  const [notes, setNotes] = useState(existingData?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const body = {
        date,
        spend: Number(spend),
        orders: Number(orders),
        revenue: revenue ? Number(revenue) : undefined,
        notes: notes.trim() || undefined,
      };

      const method = isEdit ? "PATCH" : "POST";
      const url = `/api/campaigns/${campaignId}/daily-results`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Luu ket qua that bai");
      }

      onSaved?.();

      if (!isEdit) {
        setSpend("");
        setOrders("");
        setRevenue("");
        setNotes("");
        setDate(todayString());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Loi khong xac dinh");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Ngay
          </label>
          <input
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Chi (VND)
          </label>
          <input
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            type="number"
            value={spend}
            onChange={(e) => setSpend(e.target.value)}
            placeholder="0"
            min={0}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Don hang
          </label>
          <input
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            type="number"
            value={orders}
            onChange={(e) => setOrders(e.target.value)}
            placeholder="0"
            min={0}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Thu (VND)
          </label>
          <input
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            type="number"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            placeholder="De trong = tu tinh"
            min={0}
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            De trong = tu tinh
          </p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
          Ghi chu
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
          rows={2}
          placeholder="VD: Test content moi, tang budget..."
        />
      </div>

      {error && (
        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
      )}

      <button
        type="submit"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50"
        disabled={loading || !spend || !orders}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {isEdit ? "Cap nhat" : "Luu ket qua"}
      </button>
    </form>
  );
}
