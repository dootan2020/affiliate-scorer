import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductTable } from "@/components/products/product-table";
import { Upload, BarChart3, Lightbulb, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard | AffiliateScorer",
};

async function getTopProducts() {
  return prisma.product.findMany({
    where: { aiScore: { not: null } },
    orderBy: { aiScore: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      price: true,
      commissionRate: true,
      commissionVND: true,
      platform: true,
      aiScore: true,
      aiRank: true,
      sales7d: true,
      totalKOL: true,
      imageUrl: true,
      category: true,
    },
  });
}

async function getStats() {
  const [totalProducts, feedbackCount, latestLog] = await Promise.all([
    prisma.product.count(),
    prisma.feedback.count(),
    prisma.learningLog.findFirst({
      orderBy: { runDate: "desc" },
      select: {
        currentAccuracy: true,
        previousAccuracy: true,
        patternsFound: true,
        insights: true,
        weekNumber: true,
      },
    }),
  ]);
  return { totalProducts, feedbackCount, latestLog };
}

/** Confidence level based on feedback count (B7) */
function getConfidence(feedbackCount: number): {
  label: string;
  color: string;
  message: string;
} {
  if (feedbackCount >= 100) {
    return {
      label: "CAO",
      color: "text-emerald-600 dark:text-emerald-400",
      message: "Scoring cá nhân hóa",
    };
  }
  if (feedbackCount >= 50) {
    return {
      label: "KHÁ",
      color: "text-blue-600 dark:text-blue-400",
      message: "Weights đã personalize",
    };
  }
  if (feedbackCount >= 20) {
    return {
      label: "TRUNG BÌNH",
      color: "text-amber-600 dark:text-amber-400",
      message: "AI đang học",
    };
  }
  if (feedbackCount >= 10) {
    return {
      label: "THẤP",
      color: "text-orange-600 dark:text-orange-400",
      message: `Cần thêm ${20 - feedbackCount} SP nữa`,
    };
  }
  return {
    label: "RẤT THẤP",
    color: "text-rose-600 dark:text-rose-400",
    message: `Scoring dùng formula mặc định (${feedbackCount}/20 SP đã test)`,
  };
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const [topProducts, stats] = await Promise.all([
    getTopProducts(),
    getStats(),
  ]);

  const { totalProducts, feedbackCount, latestLog } = stats;
  const hasProducts = totalProducts > 0;
  const hasScored = topProducts.length > 0;
  const confidence = getConfidence(feedbackCount);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            Top Picks Hôm Nay
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {hasProducts
              ? `${totalProducts} sản phẩm · ${hasScored ? `${topProducts.length} được xếp hạng` : "Chưa chấm điểm AI"}`
              : "Upload file FastMoss để bắt đầu"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all"
          >
            Upload CSV
          </Link>
          {hasScored && (
            <a
              href="/api/export/sheet"
              className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Export ↓
            </a>
          )}
        </div>
      </div>

      {/* Confidence + Quick Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Độ tin cậy
            </p>
          </div>
          <p className={`text-lg font-semibold ${confidence.color}`}>
            {confidence.label}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {confidence.message}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Sản phẩm
          </p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            {totalProducts}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {hasScored ? "Đã chấm AI" : "Trong database"}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Feedback
          </p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            {feedbackCount}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {feedbackCount === 0
              ? "Chưa có data"
              : `${feedbackCount} kết quả thật`}
          </p>
        </div>
      </div>

      {/* TOP PICKS — Phần CHÍNH */}
      {!hasProducts ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
            Chưa có dữ liệu sản phẩm
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
            Upload file CSV/Excel từ FastMoss hoặc KaloData để bắt đầu phân
            tích
          </p>
          <Link
            href="/upload"
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all w-full sm:w-auto text-center"
          >
            Upload ngay
          </Link>
        </div>
      ) : hasScored ? (
        <section>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <ProductTable products={topProducts} />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
            Chưa chấm điểm AI
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
            Đã upload {totalProducts} sản phẩm. Bấm để chạy AI scoring.
          </p>
          <Link
            href="/upload"
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all w-full sm:w-auto text-center"
          >
            Chạy phân tích AI
          </Link>
        </div>
      )}

      {/* AI INSIGHTS — CHỈ hiện khi có feedback data thật */}
      {feedbackCount > 0 && latestLog ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
              AI Insights
            </h2>
            <Link
              href="/insights"
              className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
            >
              Xem chi tiết →
            </Link>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            {/* Accuracy — CHỈ hiện khi >= 20 feedback */}
            {feedbackCount >= 20 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  AI Accuracy · Tuần {latestLog.weekNumber}
                </p>
                <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
                  {Math.round(latestLog.currentAccuracy * 100)}%
                </p>
                {latestLog.currentAccuracy > latestLog.previousAccuracy && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                    +
                    {Math.round(
                      (latestLog.currentAccuracy -
                        latestLog.previousAccuracy) *
                        100
                    )}
                    % so với tuần trước
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  AI Accuracy
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Cần {20 - feedbackCount} feedback nữa để hiện accuracy
                </p>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Chiến lược đề xuất
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                {latestLog.insights}
              </p>
            </div>

            {(() => {
              try {
                const patterns = JSON.parse(
                  latestLog.patternsFound
                ) as string[];
                if (patterns.length === 0) return null;
                return (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5 sm:col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Patterns phát hiện
                    </p>
                    <ul className="space-y-1.5">
                      {patterns.slice(0, 3).map((p, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              } catch {
                return null;
              }
            })()}
          </div>
        </section>
      ) : (
        hasProducts && (
          <section className="space-y-4">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center mb-4">
                <Lightbulb className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-50 mb-1">
                AI chưa có data để học
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Upload kết quả quảng cáo (FB Ads, TikTok Ads) để AI bắt đầu
                học và cá nhân hóa scoring.
              </p>
              <Link
                href="/upload"
                className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Upload kết quả →
              </Link>
            </div>
          </section>
        )
      )}
    </div>
  );
}
