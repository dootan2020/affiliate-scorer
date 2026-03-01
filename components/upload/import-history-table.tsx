"use client";

interface ImportRecord {
  id: string;
  sourceType: string;
  fileName: string | null;
  status: string;
  rowsTotal: number;
  rowsImported: number;
  rowsError: number;
  productsCreated: number;
  productsUpdated: number;
  financialRecordsCreated: number;
  createdAt: string;
}

interface ImportHistoryTableProps {
  records: ImportRecord[];
}

const SOURCE_LABELS: Record<string, string> = {
  fb_ads: "FB Ads",
  tiktok_ads: "TikTok Ads",
  shopee_ads: "Shopee Ads",
  tiktok_affiliate: "TikTok Affiliate",
  shopee_affiliate: "Shopee Affiliate",
  fastmoss: "FastMoss",
  kalodata: "KaloData",
  generic: "Chung",
  unknown: "Không rõ",
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  completed: {
    label: "Hoàn thành",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  partial: {
    label: "1 phần",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  failed: {
    label: "Lỗi",
    className:
      "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  },
  processing: {
    label: "Đang xử lý",
    className:
      "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  },
  pending: {
    label: "Chờ",
    className:
      "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400",
  },
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return iso;
  }
}

function summarizeResult(record: ImportRecord): string {
  const parts: string[] = [];

  const totalProducts = record.productsCreated + record.productsUpdated;
  if (totalProducts > 0) {
    parts.push(
      `${totalProducts} SP (${record.productsCreated} mới)`
    );
  }

  if (record.financialRecordsCreated > 0) {
    parts.push(`${record.financialRecordsCreated} records`);
  }

  if (parts.length === 0) {
    return `${record.rowsImported}/${record.rowsTotal} dòng`;
  }

  return parts.join(", ");
}

export function ImportHistoryTable({
  records,
}: ImportHistoryTableProps): React.ReactElement {
  if (records.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
        Chưa có lịch sử import
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full min-w-[540px]">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700">
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4">
              Ngày
            </th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 hidden sm:table-cell">
              File
            </th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4">
              Loại
            </th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4">
              Status
            </th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 hidden md:table-cell">
              Kết quả
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
          {records.map((record) => {
            const status =
              STATUS_STYLES[record.status] ?? STATUS_STYLES.pending;

            return (
              <tr
                key={record.id}
                className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {formatDate(record.createdAt)}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell max-w-[180px] truncate">
                  {record.fileName ?? "-"}
                </td>
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {SOURCE_LABELS[record.sourceType] ?? record.sourceType}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                  {summarizeResult(record)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
