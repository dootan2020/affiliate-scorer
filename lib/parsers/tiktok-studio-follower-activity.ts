// Parse TikTok Studio FollowerActivity.xlsx
// 168 rows: 24 hours × 7 days
// Columns: Date, Hour (or similar), Active followers

import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { parseVietnameseDate } from "./vietnamese-date";

function findColumn(headers: string[], keywords: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase());
  for (const kw of keywords) {
    const idx = lower.findIndex((h) => h.includes(kw));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

function toInt(val: unknown): number {
  if (typeof val === "number") return Math.round(val);
  if (typeof val === "string") return parseInt(val.replace(/[,.\s]/g, ""), 10) || 0;
  return 0;
}

// Map Vietnamese or English weekday to 0-6 (Mon=0..Sun=6)
function parseDayOfWeek(raw: string | Date | number): number | null {
  if (raw instanceof Date) return raw.getDay() === 0 ? 6 : raw.getDay() - 1;
  const str = String(raw).toLowerCase();

  const mapping: Record<string, number> = {
    monday: 0, mon: 0, "thứ hai": 0, "thứ 2": 0,
    tuesday: 1, tue: 1, "thứ ba": 1, "thứ 3": 1,
    wednesday: 2, wed: 2, "thứ tư": 2, "thứ 4": 2,
    thursday: 3, thu: 3, "thứ năm": 3, "thứ 5": 3,
    friday: 4, fri: 4, "thứ sáu": 4, "thứ 6": 4,
    saturday: 5, sat: 5, "thứ bảy": 5, "thứ 7": 5,
    sunday: 6, sun: 6, "chủ nhật": 6, cn: 6,
  };

  for (const [key, val] of Object.entries(mapping)) {
    if (str.includes(key)) return val;
  }

  // Fallback: parse as date and extract day
  const refYear = new Date().getFullYear();
  const d = parseVietnameseDate(str, refYear);
  if (d) return d.getDay() === 0 ? 6 : d.getDay() - 1;

  return null;
}

export async function parseTikTokStudioFollowerActivity(
  buffer: ArrayBuffer,
  importBatchId?: string,
): Promise<{ count: number; errors: string[] }> {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  if (raw.length === 0) return { count: 0, errors: ["File rỗng"] };

  const headers = Object.keys(raw[0]);
  const dateCol = findColumn(headers, ["date", "ngày", "thứ", "day"]);
  const hourCol = findColumn(headers, ["hour", "giờ", "time"]);
  const activeCol = findColumn(headers, ["active followers", "follower", "active", "hoạt động"]);

  if (!activeCol) return { count: 0, errors: ["Không tìm thấy cột Active followers"] };

  const errors: string[] = [];
  let upserted = 0;

  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];

    const rawDay = dateCol ? row[dateCol] : null;
    const rawHour = hourCol ? row[hourCol] : null;
    const activeCount = toInt(row[activeCol]);

    if (rawDay === null && rawHour === null) continue;

    const dayOfWeek = rawDay !== null ? parseDayOfWeek(rawDay as string) : null;
    if (dayOfWeek === null) {
      errors.push(`Dòng ${i + 2}: Không parse được ngày "${rawDay}"`);
      continue;
    }

    const hour = rawHour !== null ? toInt(rawHour) : i % 24;
    if (hour < 0 || hour > 23) {
      errors.push(`Dòng ${i + 2}: Giờ không hợp lệ "${rawHour}"`);
      continue;
    }

    await prisma.followerActivity.upsert({
      where: { dayOfWeek_hour: { dayOfWeek, hour } },
      update: { activeCount, importBatchId: importBatchId ?? null },
      create: { dayOfWeek, hour, activeCount, importBatchId: importBatchId ?? null },
    });
    upserted++;
  }

  return { count: upserted, errors };
}
