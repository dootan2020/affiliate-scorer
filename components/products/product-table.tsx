"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatVND, formatPercent } from "@/lib/utils/format";

interface ProductRow {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  commissionVND: number;
  platform: string;
  aiScore: number | null;
  salesGrowth7d: number | null;
  aiRank: number | null;
}

interface ProductTableProps {
  products: ProductRow[];
}

function getScoreBadgeClass(score: number): string {
  if (score >= 85) return "bg-red-500 text-white";
  if (score >= 70) return "bg-green-500 text-white";
  if (score >= 50) return "bg-yellow-500 text-black";
  return "bg-gray-400 text-white";
}

function ScoreBadge({ score }: { score: number | null }): React.ReactElement {
  if (score === null) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600">
        Chưa chấm
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getScoreBadgeClass(score)}`}
    >
      {Math.round(score)}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }): React.ReactElement {
  const colors: Record<string, string> = {
    tiktok: "bg-pink-100 text-pink-700",
    shopee: "bg-orange-100 text-orange-700",
    lazada: "bg-blue-100 text-blue-700",
    facebook: "bg-indigo-100 text-indigo-700",
  };
  const key = platform.toLowerCase();
  const cls = colors[key] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${cls}`}>
      {platform}
    </span>
  );
}

export function ProductTable({ products }: ProductTableProps): React.ReactElement {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Chưa có sản phẩm nào. Hãy upload CSV để bắt đầu.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-center">#</TableHead>
          <TableHead className="w-16 text-center">Điểm</TableHead>
          <TableHead>Tên sản phẩm</TableHead>
          <TableHead className="text-right">Giá</TableHead>
          <TableHead className="text-right">Hoa hồng</TableHead>
          <TableHead className="text-right">Tăng trưởng</TableHead>
          <TableHead className="text-center">Nền tảng</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product, index) => (
          <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50">
            <TableCell className="text-center font-medium text-muted-foreground">
              {product.aiRank ?? index + 1}
            </TableCell>
            <TableCell className="text-center">
              <ScoreBadge score={product.aiScore} />
            </TableCell>
            <TableCell>
              <Link
                href={`/products/${product.id}`}
                className="font-medium hover:underline line-clamp-2 max-w-[280px] block"
              >
                {product.name}
              </Link>
            </TableCell>
            <TableCell className="text-right text-sm">
              {formatVND(product.price)}
            </TableCell>
            <TableCell className="text-right text-sm">
              {formatPercent(product.commissionRate)}/{formatVND(product.commissionVND)}
            </TableCell>
            <TableCell className="text-right text-sm">
              {product.salesGrowth7d !== null && product.salesGrowth7d !== undefined ? (
                <span className={product.salesGrowth7d >= 0 ? "text-green-600" : "text-red-600"}>
                  {product.salesGrowth7d >= 0 ? "+" : ""}
                  {formatPercent(product.salesGrowth7d)}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="text-center">
              <PlatformBadge platform={product.platform} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
