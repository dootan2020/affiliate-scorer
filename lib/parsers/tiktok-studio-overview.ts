// Parse TikTok Studio Overview.xlsx
// Columns: Date, Video Views, Profile Views, Likes, Comments, Shares

import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { parseVietnameseDate } from "./vietnamese-date";

interface OverviewRow {
  date: Date;
  videoViews: number;
  profileViews: number;
  likes: number;
  comments: number;
  shares: number;
}

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

export async function parseTikTokStudioOverview(
  buffer: ArrayBuffer,
  importBatchId?: string,
): Promise<{ count: number; errors: string[] }> {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  if (raw.length === 0) return { count: 0, errors: ["File rỗng"] };

  const headers = Object.keys(raw[0]);
  const dateCol = findColumn(headers, ["date", "ngày", "thời gian"]);
  const videoViewsCol = findColumn(headers, ["video views", "lượt xem video", "video view"]);
  const profileViewsCol = findColumn(headers, ["profile views", "lượt xem trang cá nhân", "profile view"]);
  const likesCol = findColumn(headers, ["likes", "tim", "thích"]);
  const commentsCol = findColumn(headers, ["comments", "bình luận"]);
  const sharesCol = findColumn(headers, ["shares", "chia sẻ"]);

  if (!dateCol) return { count: 0, errors: ["Không tìm thấy cột Date"] };

  const rows: OverviewRow[] = [];
  const errors: string[] = [];
  const referenceYear = new Date().getFullYear();

  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    const rawDate = row[dateCol];
    if (!rawDate) continue;

    const date = parseVietnameseDate(String(rawDate), referenceYear);
    if (!date) {
      errors.push(`Dòng ${i + 2}: Không parse được ngày "${rawDate}"`);
      continue;
    }

    rows.push({
      date,
      videoViews: videoViewsCol ? toInt(row[videoViewsCol]) : 0,
      profileViews: profileViewsCol ? toInt(row[profileViewsCol]) : 0,
      likes: likesCol ? toInt(row[likesCol]) : 0,
      comments: commentsCol ? toInt(row[commentsCol]) : 0,
      shares: sharesCol ? toInt(row[sharesCol]) : 0,
    });
  }

  let upserted = 0;
  for (const r of rows) {
    await prisma.accountDailyStat.upsert({
      where: { date: r.date },
      update: {
        videoViews: r.videoViews,
        profileViews: r.profileViews,
        likes: r.likes,
        comments: r.comments,
        shares: r.shares,
        importBatchId: importBatchId ?? null,
      },
      create: {
        date: r.date,
        videoViews: r.videoViews,
        profileViews: r.profileViews,
        likes: r.likes,
        comments: r.comments,
        shares: r.shares,
        importBatchId: importBatchId ?? null,
      },
    });
    upserted++;
  }

  return { count: upserted, errors };
}
