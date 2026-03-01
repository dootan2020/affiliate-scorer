"use client";

import { toast } from "sonner";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FinancialRecord {
  id: string;
  type: string;
  amount: number;
  source: string;
  date: string;
  notes: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  commission_received: "Hoa hồng nhận",
  other_income: "Thu khác",
  ads_spend: "Chi quảng cáo",
  other_cost: "Chi khác",
};

const SOURCE_LABELS: Record<string, string> = {
  tiktok_shop: "TikTok Shop",
  shopee: "Shopee",
  lazada: "Lazada",
  fb_ads: "Facebook Ads",
  tiktok_ads: "TikTok Ads",
  other: "Khác",
};

export function isIncomeType(type: string): boolean {
  return type === "commission_received" || type === "other_income";
}

export function formatVNDFull(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(amount)) + "d";
}

interface FinancialRecordsTableProps {
  records: FinancialRecord[];
  loading: boolean;
  onDeleted: (id: string) => void;
}

export function FinancialRecordsTable({
  records,
  loading,
  onDeleted,
}: FinancialRecordsTableProps): React.ReactElement {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string): Promise<void> {
    if (deleting) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/financial/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Đã xóa giao dịch");
      onDeleted(id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Lỗi khi xóa giao dịch"
      );
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 overflow-hidden">
      <div className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-slate-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Lịch sử giao dịch
        </p>
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chưa có giao dịch trong tháng này
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800">
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-3">
                  Ngày
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-3">
                  Loại
                </th>
                <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-3">
                  Số tiền
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-3 hidden sm:table-cell">
                  Nguồn
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-3 hidden md:table-cell">
                  Ghi chú
                </th>
                <th className="pb-3 px-4 pt-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {records.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-50 whitespace-nowrap">
                    {new Date(record.date).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                    {TYPE_LABELS[record.type] ?? record.type}
                  </td>
                  <td
                    className={`py-3 px-4 text-sm text-right font-medium whitespace-nowrap ${
                      isIncomeType(record.type)
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isIncomeType(record.type) ? "+" : "-"}
                    {formatVNDFull(record.amount)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {SOURCE_LABELS[record.source] ?? record.source}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400 dark:text-gray-500 hidden md:table-cell truncate max-w-[200px]">
                    {record.notes ?? "\u2014"}
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(record.id)}
                      disabled={deleting === record.id}
                      className="text-gray-400 hover:text-rose-500 dark:hover:text-rose-400"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
