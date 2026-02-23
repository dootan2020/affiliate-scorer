import type { NormalizedProduct } from "@/lib/utils/normalize";
import { normalizeNumber, normalizeString } from "@/lib/utils/normalize";
import type { ColumnMapping } from "@/lib/parsers/ai-detect";
import type { ParsedRow } from "@/lib/parsers/parse-file";

/**
 * Generic parser: applies a ColumnMapping to raw rows to produce NormalizedProducts.
 * Used when user confirms or adjusts column mapping.
 */
export function parseWithMapping(
  rows: ParsedRow[],
  mapping: ColumnMapping,
  source: "fastmoss" | "kalodata"
): NormalizedProduct[] {
  return rows
    .map((row): NormalizedProduct | null => {
      const name = normalizeString(col(row, mapping.name));
      if (!name) return null;

      const price = normalizeNumber(col(row, mapping.price)) ?? 0;
      const commissionRate =
        normalizeNumber(col(row, mapping.commissionRate)) ?? 0;

      return {
        name,
        url: strOrNull(col(row, mapping.url)),
        category: normalizeString(col(row, mapping.category)) || "Khác",
        price,
        commissionRate,
        commissionVND: price * (commissionRate / 100),
        platform: detectPlatformFromRow(row, mapping),
        salesTotal: normalizeNumber(col(row, mapping.salesTotal)),
        salesGrowth7d: normalizeNumber(col(row, mapping.salesGrowth7d)),
        salesGrowth30d: normalizeNumber(col(row, mapping.salesGrowth30d)),
        revenue7d: normalizeNumber(col(row, mapping.revenue7d)),
        revenue30d: normalizeNumber(col(row, mapping.revenue30d)),
        affiliateCount: normalizeNumber(
          col(row, mapping.affiliateCount)
        ) as number | null,
        creatorCount: normalizeNumber(
          col(row, mapping.creatorCount)
        ) as number | null,
        topVideoViews: normalizeNumber(
          col(row, mapping.topVideoViews)
        ) as number | null,
        shopName: strOrNull(col(row, mapping.shopName)),
        shopRating: normalizeNumber(col(row, mapping.shopRating)),
        source,
        dataDate: new Date(),
      };
    })
    .filter((p): p is NormalizedProduct => p !== null);
}

function col(row: ParsedRow, header: string | null): unknown {
  if (!header) return null;
  return row[header] ?? null;
}

function strOrNull(value: unknown): string | null {
  const s = normalizeString(value);
  return s || null;
}

function detectPlatformFromRow(
  row: ParsedRow,
  mapping: ColumnMapping
): "shopee" | "tiktok_shop" | "both" {
  const raw = normalizeString(col(row, mapping.platform)).toLowerCase();
  if (!raw) return "tiktok_shop";
  if (raw.includes("shopee") && raw.includes("tiktok")) return "both";
  if (raw.includes("shopee")) return "shopee";
  return "tiktok_shop";
}
