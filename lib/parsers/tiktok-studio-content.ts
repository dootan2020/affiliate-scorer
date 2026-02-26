// Parse TikTok Studio Content.xlsx
// Columns: Time, Video title, Video link, Post time,
//          Total likes, Total comments, Total shares, Total views
// Match video links to ContentAsset.publishedUrl → update AssetMetric

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

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/$/, "").toLowerCase();
}

export async function parseTikTokStudioContent(
  buffer: ArrayBuffer,
  importBatchId?: string,
): Promise<{ count: number; errors: string[] }> {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  if (raw.length === 0) return { count: 0, errors: ["File rỗng"] };

  const headers = Object.keys(raw[0]);
  const timeCol = findColumn(headers, ["time", "thời gian"]);
  const titleCol = findColumn(headers, ["video title", "tiêu đề", "title"]);
  const linkCol = findColumn(headers, ["video link", "link", "url"]);
  const postTimeCol = findColumn(headers, ["post time", "đăng lúc"]);
  const likesCol = findColumn(headers, ["total likes", "likes", "tim"]);
  const commentsCol = findColumn(headers, ["total comments", "comments", "bình luận"]);
  const sharesCol = findColumn(headers, ["total shares", "shares", "chia sẻ"]);
  const viewsCol = findColumn(headers, ["total views", "views", "lượt xem"]);

  const errors: string[] = [];
  let matched = 0;
  let unmatched = 0;

  const refYear = new Date().getFullYear();

  // Pre-load all published ContentAssets with URLs for matching
  const publishedAssets = await prisma.contentAsset.findMany({
    where: { publishedUrl: { not: null } },
    select: { id: true, publishedUrl: true },
  });
  const urlToAssetId = new Map<string, string>();
  for (const a of publishedAssets) {
    if (a.publishedUrl) urlToAssetId.set(normalizeUrl(a.publishedUrl), a.id);
  }

  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];

    const rawLink = linkCol ? String(row[linkCol] ?? "").trim() : "";
    const views = viewsCol ? toInt(row[viewsCol]) : 0;
    const likes = likesCol ? toInt(row[likesCol]) : 0;
    const comments = commentsCol ? toInt(row[commentsCol]) : 0;
    const shares = sharesCol ? toInt(row[sharesCol]) : 0;

    if (!rawLink && views === 0) continue;

    const assetId = rawLink ? urlToAssetId.get(normalizeUrl(rawLink)) : undefined;

    if (!assetId) {
      unmatched++;
      // Still store as ContentPost-linked metric if no asset found
      continue;
    }

    const rawTime = timeCol ? row[timeCol] : null;
    const capturedAt = rawTime
      ? (parseVietnameseDate(String(rawTime), refYear) ?? new Date())
      : new Date();

    await prisma.assetMetric.create({
      data: {
        contentAssetId: assetId,
        capturedAt,
        source: "import",
        views,
        likes,
        comments,
        shares,
        rawData: {
          fileName: "Content.xlsx",
          importBatchId: importBatchId ?? null,
          title: titleCol ? String(row[titleCol] ?? "") : undefined,
          postTime: postTimeCol ? String(row[postTimeCol] ?? "") : undefined,
          videoLink: rawLink,
        },
      },
    });
    matched++;
  }

  if (unmatched > 0) {
    errors.push(`${unmatched} video không khớp với asset nào (chưa được đăng qua hệ thống)`);
  }

  return { count: matched, errors };
}
