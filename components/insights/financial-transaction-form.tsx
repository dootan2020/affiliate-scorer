"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";

const TYPE_OPTIONS = [
  { value: "commission_received", label: "Hoa hồng nhận" },
  { value: "other_income", label: "Thu khác" },
  { value: "ads_spend", label: "Chi quảng cáo" },
  { value: "other_cost", label: "Chi khác" },
] as const;

const SOURCE_OPTIONS = [
  { value: "tiktok_shop", label: "TikTok Shop" },
  { value: "shopee", label: "Shopee" },
  { value: "lazada", label: "Lazada" },
  { value: "fb_ads", label: "Facebook Ads" },
  { value: "tiktok_ads", label: "TikTok Ads" },
  { value: "other", label: "Khác" },
] as const;

function isIncomeType(type: string): boolean {
  return type === "commission_received" || type === "other_income";
}

interface FinancialTransactionFormProps {
  mode: "income" | "expense";
  onClose: () => void;
  onSaved: () => void;
}

export function FinancialTransactionForm({
  mode,
  onClose,
  onSaved,
}: FinancialTransactionFormProps): React.ReactElement {
  const [saving, setSaving] = useState(false);
  const [formType, setFormType] = useState(
    mode === "income" ? "commission_received" : "ads_spend"
  );
  const [formAmount, setFormAmount] = useState("");
  const [formSource, setFormSource] = useState("tiktok_shop");
  const [formDate, setFormDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formNotes, setFormNotes] = useState("");

  const incomeTypes = TYPE_OPTIONS.filter((t) => isIncomeType(t.value));
  const expenseTypes = TYPE_OPTIONS.filter((t) => !isIncomeType(t.value));

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) {
      toast.error("Nhập số tiền hợp lệ");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/financial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          amount,
          source: formSource,
          date: formDate,
          notes: formNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Đã thêm giao dịch");
      onSaved();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Lỗi khi thêm giao dịch"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50">
          {mode === "income" ? "Thêm khoản thu" : "Thêm khoản chi"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Loại *
          </label>
          <select
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
          >
            {(mode === "income" ? incomeTypes : expenseTypes).map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Nguồn *
          </label>
          <select
            value={formSource}
            onChange={(e) => setFormSource(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
          >
            {SOURCE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Số tiền (VND) *
          </label>
          <input
            type="number"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Ngày *
          </label>
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          Ghi chú
        </label>
        <input
          type="text"
          value={formNotes}
          onChange={(e) => setFormNotes(e.target.value)}
          placeholder="Ghi chú (tùy chọn)"
          className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Đang lưu..." : "Lưu giao dịch"}
      </button>
    </form>
  );
}
