"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, Wallet } from "lucide-react";
import { FinancialTransactionForm } from "./financial-transaction-form";
import {
  FinancialRecordsTable,
  isIncomeType,
  formatVNDFull,
} from "./financial-records-table";
import type { FinancialRecord } from "./financial-records-table";

function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getMonthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `Tháng ${parseInt(m)}/${y}`;
}

export function FinancialTab(): React.ReactElement {
  const [month, setMonth] = useState(getMonthKey(new Date()));
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"income" | "expense">("income");

  const fetchRecords = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch(`/api/financial?month=${month}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecords(data.data ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Lỗi khi tải dữ liệu"
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  function navigateMonth(delta: number): void {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(getMonthKey(d));
  }

  function openForm(mode: "income" | "expense"): void {
    setFormMode(mode);
    setShowForm(true);
  }

  function handleFormSaved(): void {
    setShowForm(false);
    void fetchRecords();
  }

  function handleDeleted(id: string): void {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  // Summary calculations
  const income = records
    .filter((r) => isIncomeType(r.type))
    .reduce((sum, r) => sum + r.amount, 0);
  const expense = records
    .filter((r) => !isIncomeType(r.type))
    .reduce((sum, r) => sum + r.amount, 0);
  const profit = income - expense;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50">
            Tổng quan thu chi
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
            {getMonthLabel(month)}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Thu</p>
          <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
            {formatVNDFull(income)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Chi</p>
          <p className="text-xl font-semibold text-rose-600 dark:text-rose-400">
            {formatVNDFull(expense)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lai/Lo</p>
          <p
            className={`text-xl font-semibold ${
              profit >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {profit >= 0 ? "+" : ""}
            {formatVNDFull(profit)}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => openForm("income")}
          className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm thu
        </button>
        <button
          onClick={() => openForm("expense")}
          className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm chi
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <FinancialTransactionForm
          mode={formMode}
          onClose={() => setShowForm(false)}
          onSaved={handleFormSaved}
        />
      )}

      {/* Records table */}
      <FinancialRecordsTable
        records={records}
        loading={loading}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
