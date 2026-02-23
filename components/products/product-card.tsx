"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatVND, formatPercent } from "@/lib/utils/format";

interface ProductCardData {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  commissionVND: number;
  platform: string;
  category: string;
  shopName: string | null;
  aiScore: number | null;
}

interface ProductCardProps {
  product: ProductCardData;
}

function getScoreStyle(score: number): { bg: string; text: string; label: string } {
  if (score >= 85) return { bg: "bg-red-500", text: "text-white", label: "Hot" };
  if (score >= 70) return { bg: "bg-green-500", text: "text-white", label: "Tốt" };
  if (score >= 50) return { bg: "bg-yellow-500", text: "text-black", label: "Khá" };
  return { bg: "bg-gray-400", text: "text-white", label: "Thấp" };
}

export function ProductCard({ product }: ProductCardProps): React.ReactElement {
  const score = product.aiScore;
  const scoreStyle = score !== null ? getScoreStyle(score) : null;

  return (
    <Link href={`/products/${product.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm line-clamp-2 flex-1">{product.name}</p>
            {score !== null && scoreStyle ? (
              <span
                className={`shrink-0 inline-flex flex-col items-center rounded-lg px-2 py-1 text-xs font-bold ${scoreStyle.bg} ${scoreStyle.text}`}
              >
                <span className="text-base leading-none">{Math.round(score)}</span>
                <span className="text-[10px] opacity-80">{scoreStyle.label}</span>
              </span>
            ) : (
              <span className="shrink-0 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-500">
                Chưa chấm
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Giá: </span>
              <span className="font-medium">{formatVND(product.price)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">HH: </span>
              <span className="font-medium text-green-600">
                {formatPercent(product.commissionRate)}/{formatVND(product.commissionVND)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-muted px-1.5 py-0.5">{product.platform}</span>
            <span className="text-muted-foreground truncate">{product.category}</span>
          </div>
          {product.shopName && (
            <p className="text-xs text-muted-foreground truncate">
              Shop: {product.shopName}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
