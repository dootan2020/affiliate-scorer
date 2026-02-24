import { Pencil } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";

interface DailyResult {
  date: string;
  spend: number;
  orders: number;
  revenue: number;
  clicks?: number;
  notes?: string;
}

interface DailyResultsTableProps {
  results: DailyResult[];
  campaignId: string;
  onEdit?: (date: string) => void;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function formatVNDFull(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

function calcROAS(revenue: number, spend: number): string {
  if (spend === 0) return "-";
  return (revenue / spend).toFixed(2);
}

function getROASColor(revenue: number, spend: number): string {
  if (spend === 0) return "text-gray-500 dark:text-gray-400";
  const roas = revenue / spend;
  if (roas >= 2) return "text-emerald-600 dark:text-emerald-400 font-medium";
  if (roas >= 1) return "text-blue-600 dark:text-blue-400";
  return "text-rose-600 dark:text-rose-400";
}

export function DailyResultsTable({
  results,
  onEdit,
}: DailyResultsTableProps): React.ReactElement {
  const sorted = [...results].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
        Chua co ket qua nao. Them ket qua hang ngay de theo doi.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-800">
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-3">
              Ngay
            </th>
            <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-3">
              Chi
            </th>
            <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-3">
              Don
            </th>
            <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-3">
              Thu
            </th>
            <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-3">
              ROAS
            </th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-3 hidden sm:table-cell">
              Ghi chu
            </th>
            {onEdit && <th className="w-8 pb-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
          {sorted.map((row) => (
            <tr
              key={row.date}
              className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td className="py-3 px-3 text-gray-900 dark:text-gray-50 whitespace-nowrap">
                {formatDateShort(row.date)}
              </td>
              <td className="py-3 px-3 text-right text-gray-900 dark:text-gray-50 whitespace-nowrap">
                {formatVNDFull(row.spend)}
              </td>
              <td className="py-3 px-3 text-right text-gray-900 dark:text-gray-50">
                {formatNumber(row.orders)}
              </td>
              <td className="py-3 px-3 text-right text-gray-900 dark:text-gray-50 whitespace-nowrap">
                {formatVNDFull(row.revenue)}
              </td>
              <td
                className={`py-3 px-3 text-right whitespace-nowrap ${getROASColor(row.revenue, row.spend)}`}
              >
                {calcROAS(row.revenue, row.spend)}x
              </td>
              <td className="py-3 px-3 text-gray-500 dark:text-gray-400 truncate max-w-[160px] hidden sm:table-cell">
                {row.notes ?? "-"}
              </td>
              {onEdit && (
                <td className="py-3 px-1">
                  <button
                    type="button"
                    onClick={() => onEdit(row.date)}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
