import Link from "next/link";
import { RefreshCw, Tv } from "lucide-react";

export function DashboardEmptyState(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      {/* Icon cluster */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 flex items-center justify-center shadow-sm">
          <Tv className="w-10 h-10 text-blue-500 dark:text-blue-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center shadow-sm">
          <RefreshCw className="w-4 h-4 text-orange-500 dark:text-orange-400" />
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
        Chào mừng đến PASTR!
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm leading-relaxed">
        Bắt đầu bằng cách đồng bộ sản phẩm từ TikTok Shop và tạo kênh đầu tiên của bạn.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Link
          href="/sync"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Đồng bộ sản phẩm
        </Link>
        <Link
          href="/channels"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 px-6 py-2.5 text-sm font-medium transition-colors"
        >
          <Tv className="w-4 h-4" />
          Tạo kênh
        </Link>
      </div>
    </div>
  );
}
