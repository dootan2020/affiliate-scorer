import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductTable } from "@/components/products/product-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Top picks hôm nay và AI insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          {latestLog && (
            <span className="text-xs text-muted-foreground">
              AI Accuracy: {Math.round(latestLog.currentAccuracy * 100)}%
              {latestLog.currentAccuracy > latestLog.previousAccuracy && (
                <span className="text-emerald-600 ml-1">
                  +{Math.round((latestLog.currentAccuracy - latestLog.previousAccuracy) * 100)}%
                </span>
              )}
            </span>
          )}
          {hasProducts && (
            <Button asChild size="sm" variant="outline">
              <Link href="/upload">Upload thêm</Link>
            </Button>
          )}
        </div>
      </div>

      {!hasProducts ? (
        <div className="rounded-lg border border-dashed p-8 sm:p-12 text-center space-y-4">
          <div className="text-4xl">!</div>
          <div>
            <p className="font-medium text-lg">Chưa có dữ liệu sản phẩm</p>
            <p className="text-muted-foreground text-sm mt-1">
              Upload file CSV từ FastMoss hoặc KaloData để bắt đầu phân tích
            </p>
          </div>
          <Button asChild>
            <Link href="/upload">Upload CSV ngay</Link>
          </Button>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Top sản phẩm{hasScored ? ` (${topProducts.length})` : ""}
              </h2>
              {!hasScored && (
                <p className="text-sm text-muted-foreground">
                  Có {totalProducts} SP — chưa chấm điểm
                </p>
              )}
            </div>

            {hasScored ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-[640px] px-4 sm:px-0">
                  <ProductTable products={topProducts} />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
                <p className="text-muted-foreground">
                  Đã upload {totalProducts} sản phẩm nhưng chưa chấm điểm AI.
                </p>
                <Button asChild size="sm">
                  <Link href="/upload">Chạy phân tích AI</Link>
                </Button>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">AI Insights tuần này</h2>
              <Link
                href="/insights"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Xem chi tiết →
              </Link>
            </div>

            {latestLog ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Tuần {latestLog.weekNumber}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(latestLog.currentAccuracy * 100)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Độ chính xác AI · {feedbackCount} feedback
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Chiến lược đề xuất
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed line-clamp-3">
                      {latestLog.insights}
                    </p>
                  </CardContent>
                </Card>

                {(() => {
                  try {
                    const patterns = JSON.parse(latestLog.patternsFound) as string[];
                    if (patterns.length === 0) return null;
                    return (
                      <Card className="sm:col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Patterns phát hiện
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1">
                            {patterns.slice(0, 3).map((p, i) => (
                              <li key={i} className="text-sm text-muted-foreground">
                                · {p}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    );
                  } catch {
                    return null;
                  }
                })()}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
                Chưa có insights. Hãy vào trang{" "}
                <Link href="/insights" className="underline text-foreground">
                  Insights
                </Link>{" "}
                để chạy phân tích AI learning.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
