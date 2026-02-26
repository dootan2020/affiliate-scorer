import { normalizeNumber, normalizeString } from "@/lib/utils/normalize";
import type { ImportParseResult, ImportedFinancialRecord } from "./types";

interface RawRow {
  [key: string]: unknown;
}

function findColumn(row: RawRow, candidates: string[]): unknown {
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    for (const key of Object.keys(row)) {
      const keyNorm = key.toLowerCase().replace(/\s+/g, "_");
      if (keyNorm.includes(lower) || lower.includes(keyNorm)) {
        return row[key];
      }
    }
  }
  return null;
}

function parseDate(value: unknown): Date {
  if (!value) return new Date();
  const str = String(value).trim();
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`);
  const slashMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashMatch) return new Date(`${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`);
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

const COMPLETED_STATUSES = [
  "completed", "confirmed", "hoàn thành", "đã xác nhận",
  "đã thanh toán", "settled", "paid",
];

function isCompletedOrder(status: string): boolean {
  const lower = status.toLowerCase().trim();
  return COMPLETED_STATUSES.some((s) => lower.includes(s));
}

export function parseTikTokAffiliate(_headers: string[], rows: RawRow[]): ImportParseResult {
  const financialRecords: ImportedFinancialRecord[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const orderId = normalizeString(
      findColumn(row, ["mã_đơn_hàng", "order_id", "order id"])
    );
    const productName = normalizeString(
      findColumn(row, ["tên_sản_phẩm", "product_name", "product name"])
    );
    const commission = normalizeNumber(
      findColumn(row, ["hoa_hồng_(vnd)", "commission", "hoa_hồng"])
    );
    const status = normalizeString(
      findColumn(row, ["trạng_thái", "status", "order_status"])
    );
    const orderDate = findColumn(row, [
      "ngày_đặt_hàng", "order_date", "date",
    ]);
    const productPrice = normalizeNumber(
      findColumn(row, ["giá_sản_phẩm", "product_price", "price"])
    );
    const quantity = normalizeNumber(
      findColumn(row, ["số_lượng", "quantity", "qty"])
    );
    const commissionRate = normalizeNumber(
      findColumn(row, ["hoa_hồng_(%)", "commission_rate", "commission_(%)"])
    );

    if (!orderId && !productName) {
      errors.push({ row: i + 1, message: "Thiếu mã đơn hàng và tên sản phẩm" });
      continue;
    }

    if (commission === null || commission === undefined) {
      errors.push({ row: i + 1, message: `Thiếu hoa hồng cho đơn ${orderId || productName}` });
      continue;
    }

    const isCompleted = status ? isCompletedOrder(status) : false;
    const date = parseDate(orderDate);
    const revenue = productPrice && quantity ? productPrice * quantity : 0;

    financialRecords.push({
      type: isCompleted ? "commission_received" : "commission_pending",
      amount: commission,
      source: "tiktok_shop",
      productId: null,
      campaignId: null,
      date,
      notes: `TikTok Affiliate: ${productName || orderId} - ${orderId || "N/A"}`,
      metadata: {
        orderId: orderId || null,
        productName: productName || null,
        productPrice: productPrice ?? null,
        quantity: quantity ?? null,
        commissionRate: commissionRate ?? null,
        status: status || null,
        revenue,
      },
    });
  }

  return { financialRecords, errors };
}
