import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductTable } from "@/components/products/product-table";
import { Button } from "@/components/ui/button";

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

export default async function DashboardPage(): Promise<React.ReactElement> {
  const [topProducts, totalProducts] = await Promise.all([
    getTopProducts(),
    getTotalProducts(),
  ]);

  const hasProducts = totalProducts > 0;
  const hasScored = topProducts.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Top picks hôm nay và AI insights
          </p>
        </div>
        {hasProducts && (
          <Button asChild size="sm" variant="outline">
            <Link href="/upload">Upload thêm</Link>
          </Button>
        )}
      </div>

      {!hasProducts ? (
        <div className="rounded-lg border border-dashed p-12 text-center space-y-4">
          <div className="text-4xl">📊</div>
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
              <ProductTable products={topProducts} />
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
            <h2 className="text-lg font-semibold">AI Insights tuần này</h2>
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
              Chưa có insights. Hãy vào trang{" "}
              <Link href="/insights" className="underline text-foreground">
                Insights
              </Link>{" "}
              để chạy phân tích AI learning.
            </div>
          </section>
        </>
      )}
    </div>
  );
}
