import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ScoreBreakdown } from "@/components/products/score-breakdown";
import { ContentSuggestion } from "@/components/products/content-suggestion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVND, formatPercent, formatNumber } from "@/lib/utils/format";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

function getScoreBadgeClass(score: number): string {
  if (score >= 85) return "bg-red-500 text-white";
  if (score >= 70) return "bg-green-500 text-white";
  if (score >= 50) return "bg-yellow-500 text-black";
  return "bg-gray-400 text-white";
}

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
}

function InfoRow({ label, value }: InfoRowProps): React.ReactElement | null {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between py-1.5 border-b last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps): Promise<React.ReactElement> {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      url: true,
      category: true,
      price: true,
      commissionRate: true,
      commissionVND: true,
      platform: true,
      salesTotal: true,
      salesGrowth7d: true,
      salesGrowth30d: true,
      revenue7d: true,
      affiliateCount: true,
      shopName: true,
      shopRating: true,
      aiScore: true,
      aiRank: true,
      scoreBreakdown: true,
      contentSuggestion: true,
      platformAdvice: true,
      source: true,
      dataDate: true,
    },
  });

  if (!product) notFound();

  const score = product.aiScore;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/">← Quay lại</Link>
        </Button>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold leading-tight">{product.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {product.platform} · {product.category}
          </p>
        </div>
        {score !== null && (
          <div
            className={`shrink-0 flex flex-col items-center rounded-xl px-3 py-2 font-bold ${getScoreBadgeClass(score)}`}
          >
            <span className="text-2xl leading-none">{Math.round(score)}</span>
            <span className="text-xs mt-0.5 opacity-80">điểm AI</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Thông tin sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Giá bán" value={formatVND(product.price)} />
            <InfoRow
              label="Hoa hồng"
              value={`${formatPercent(product.commissionRate)} (${formatVND(product.commissionVND)})`}
            />
            <InfoRow label="Nền tảng" value={product.platform} />
            <InfoRow label="Danh mục" value={product.category} />
            <InfoRow label="Shop" value={product.shopName} />
            {product.shopRating !== null && product.shopRating !== undefined && (
              <InfoRow label="Đánh giá shop" value={`${product.shopRating.toFixed(1)}/5`} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dữ liệu xu hướng</CardTitle>
          </CardHeader>
          <CardContent>
            {product.salesTotal !== null && product.salesTotal !== undefined && (
              <InfoRow label="Tổng bán" value={formatNumber(product.salesTotal)} />
            )}
            {product.salesGrowth7d !== null && product.salesGrowth7d !== undefined && (
              <InfoRow
                label="Tăng trưởng 7 ngày"
                value={`${product.salesGrowth7d >= 0 ? "+" : ""}${formatPercent(product.salesGrowth7d)}`}
              />
            )}
            {product.salesGrowth30d !== null && product.salesGrowth30d !== undefined && (
              <InfoRow
                label="Tăng trưởng 30 ngày"
                value={`${product.salesGrowth30d >= 0 ? "+" : ""}${formatPercent(product.salesGrowth30d)}`}
              />
            )}
            {product.revenue7d !== null && product.revenue7d !== undefined && (
              <InfoRow label="Doanh thu 7 ngày" value={formatVND(product.revenue7d)} />
            )}
            {product.affiliateCount !== null && product.affiliateCount !== undefined && (
              <InfoRow label="Affiliate" value={formatNumber(product.affiliateCount)} />
            )}
            <InfoRow label="Nguồn dữ liệu" value={product.source} />
            {product.aiRank !== null && product.aiRank !== undefined && (
              <InfoRow label="Xếp hạng AI" value={`#${product.aiRank}`} />
            )}
          </CardContent>
        </Card>
      </div>

      {product.scoreBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Phân tích điểm (6 tiêu chí)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreBreakdown breakdown={product.scoreBreakdown} />
          </CardContent>
        </Card>
      )}

      <ContentSuggestion
        suggestion={product.contentSuggestion ?? null}
        platformAdvice={product.platformAdvice ?? null}
      />

      {product.url && (
        <div className="pt-2">
          <Button asChild variant="outline" size="sm">
            <a href={product.url} target="_blank" rel="noopener noreferrer">
              Xem sản phẩm trên {product.platform} →
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
