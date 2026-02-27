import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Papa from "papaparse";

/**
 * POST — Import CSV from TikTok Studio analytics
 * Expects CSV with columns like: Video URL, Views, Likes, Comments, Shares, etc.
 * Tries to match videos to existing content assets by URL or by title.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const { data: rows } = Papa.parse(text, { header: true, skipEmptyLines: true });

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "CSV is empty" }, { status: 400 });
    }

    // Get all published assets for matching
    const assets = await prisma.contentAsset.findMany({
      where: { status: { in: ["published", "produced", "rendered"] } },
      select: { id: true, assetCode: true, hookText: true },
    });

    let matched = 0;
    let skipped = 0;

    for (const row of rows as Record<string, string>[]) {
      // Try to find the matching asset
      // TikTok Studio CSV might have columns like "Video URL", "Views", "Likes", etc.
      const videoUrl = row["Video URL"] || row["video_url"] || row["URL"] || row["url"] || "";
      const views = parseInt(row["Views"] || row["views"] || row["Lượt xem"] || "0", 10) || 0;
      const likes = parseInt(row["Likes"] || row["likes"] || row["Lượt thích"] || "0", 10) || 0;
      const comments = parseInt(row["Comments"] || row["comments"] || row["Bình luận"] || "0", 10) || 0;
      const shares = parseInt(row["Shares"] || row["shares"] || row["Chia sẻ"] || "0", 10) || 0;
      const saves = parseInt(row["Saves"] || row["saves"] || row["Lưu"] || "0", 10) || 0;

      if (views === 0 && likes === 0) {
        skipped++;
        continue;
      }

      // Try matching by existing tracking URL, or use first untracked asset
      let assetId: string | null = null;

      if (videoUrl) {
        // Check if any tracking already has this URL
        const existingTracking = await prisma.videoTracking.findFirst({
          where: { tiktokVideoUrl: videoUrl },
          select: { contentAssetId: true },
        });
        if (existingTracking) {
          assetId = existingTracking.contentAssetId;
        }
      }

      if (!assetId && assets.length > 0) {
        // Try to match by assetCode in CSV
        const code = row["Asset Code"] || row["asset_code"] || row["Mã"] || "";
        if (code) {
          const found = assets.find((a) => a.assetCode === code);
          if (found) assetId = found.id;
        }
      }

      if (!assetId) {
        skipped++;
        continue;
      }

      // Auto-detect winner
      const isWinner = views >= 500 && (likes + comments + shares > 0);
      const winReason = views >= 1000 ? "high_views" : (views >= 500 ? "high_engagement" : null);

      await prisma.videoTracking.upsert({
        where: { contentAssetId: assetId },
        create: {
          contentAssetId: assetId,
          tiktokVideoUrl: videoUrl || null,
          views24h: views,
          likes,
          comments,
          shares,
          saves,
          isWinner,
          winReason,
        },
        update: {
          views24h: views,
          likes,
          comments,
          shares,
          saves,
          isWinner,
          winReason,
        },
      });

      matched++;
    }

    return NextResponse.json({
      data: { matched, skipped, total: (rows as unknown[]).length },
      message: `${matched} video đã import, ${skipped} bỏ qua`,
    });
  } catch {
    return NextResponse.json({ error: "Failed to import CSV" }, { status: 500 });
  }
}
