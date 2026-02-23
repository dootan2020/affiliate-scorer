import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductTable } from "@/components/products/product-table";
import { Upload, BarChart3, Sparkles, Lightbulb } from "lucide-react";

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
      salesGrowth7d: true,
    },
  });
}

async function getTotalProducts(): Promise<number> {
  return prisma.product.count();
}

async function getLatestInsights() {
  try {
    const [latestLog, feedbackCount] = await Promise.all([
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
      prisma.feedback.count(),
    ]);
    return { latestLog, feedbackCount };
  } catch {
    return { latestLog: null, feedbackCount: 0 };
  }
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const [topProducts, totalProducts, insightsData] = await Promise.all([
    getTopProducts(),
    getTotalProducts(),
    getLatestInsights(),
  ]);

  const hasProducts = totalProducts > 0;
  const hasScored = topProducts.length > 0;
  const { latestLog, feedbackCount } = insightsData;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Top picks hôm nay và AI insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          {latestLog && (
            <span className="text-xs text-gray-400">
              AI Accuracy: {Math.round(latestLog.currentAccuracy * 100)}%
              {latestLog.currentAccuracy > latestLog.previousAccuracy && (
                <span className="text-emerald-600 ml-1">
                  +{Math.round((latestLog.currentAccuracy - latestLog.previousAccuracy) * 100)}%
                </span>
              )}
            </span>
          )}
          {hasProducts && (
            <Link
              href="/upload"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
            >
              Upload thêm
            </Link>
          )}
        </div>
      </div>

      {!hasProducts ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Chưa có dữ liệu sản phẩm
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            Upload file CSV từ FastMoss hoặc KaloData để bắt đầu phân tích
          </p>
          <Link
            href="/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all"
          >
            Upload CSV ngay
          </Link>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Top sản phẩm{hasScored ? ` (${topProducts.length})` : ""}
              </h2>
              {!hasScored && (
                <p className="text-sm text-gray-500">
                  Có {totalProducts} SP — chưa chấm điểm
                </p>
              )}
            </div>

            {hasScored ? (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[640px]">
                    <ProductTable products={topProducts} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Chưa chấm điểm AI
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm">
                  Đã upload {totalProducts} sản phẩm nhưng chưa chấm điểm AI.
                </p>
                <Link
                  href="/upload"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all"
                >
                  Chạy phân tích AI
                </Link>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                AI Insights tuần này
              </h2>
              <Link
                href="/insights"
                className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
              >
                Xem chi tiết →
              </Link>
            </div>

            {latestLog ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <p className="text-sm text-gray-500 mb-1">
                    Tuần {latestLog.weekNumber}
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {Math.round(latestLog.currentAccuracy * 100)}%
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Độ chính xác AI · {feedbackCount} feedback
                  </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <p className="text-sm text-gray-500 mb-1">
                    Chiến lược đề xuất
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                    {latestLog.insights}
                  </p>
                </div>

                {(() => {
                  try {
                    const patterns = JSON.parse(latestLog.patternsFound) as string[];
                    if (patterns.length === 0) return null;
                    return (
                      <div className="bg-white rounded-2xl shadow-sm p-6 sm:col-span-2">
                        <p className="text-sm text-gray-500 mb-3">
                          Patterns phát hiện
                        </p>
                        <ul className="space-y-1.5">
                          {patterns.slice(0, 3).map((p, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
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
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                  <Lightbulb className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Chưa có insights
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm">
                  Hãy vào trang Insights để chạy phân tích AI learning.
                </p>
                <Link
                  href="/insights"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all"
                >
                  Xem Insights
                </Link>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
