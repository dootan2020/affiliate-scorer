import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod/v4";

const createTrackingSchema = z.object({
  contentAssetId: z.string().min(1),
  tiktokVideoUrl: z.string().optional(),
  publishedAt: z.string().optional(),
  views24h: z.number().int().optional(),
  views7d: z.number().int().optional(),
  likes: z.number().int().optional(),
  comments: z.number().int().optional(),
  shares: z.number().int().optional(),
  saves: z.number().int().optional(),
  clicksToShop: z.number().int().optional(),
  orders: z.number().int().optional(),
  revenue: z.number().optional(),
  commission: z.number().optional(),
});

/** Auto-detect winner: views24h >= 500 AND (orders >= 3 OR engagement rate high) */
function detectWinner(data: {
  views24h?: number | null;
  orders?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
}): { isWinner: boolean; winReason: string | null } {
  const views = data.views24h ?? 0;
  const orders = data.orders ?? 0;
  const engagement = (data.likes ?? 0) + (data.comments ?? 0) + (data.shares ?? 0);
  const engRate = views > 0 ? engagement / views : 0;

  if (views >= 500 && orders >= 3) {
    return { isWinner: true, winReason: "high_conversion" };
  }
  if (views >= 500 && engRate >= 0.015) {
    return { isWinner: true, winReason: "high_engagement" };
  }
  if (views >= 1000) {
    return { isWinner: true, winReason: "high_views" };
  }
  return { isWinner: false, winReason: null };
}

/** GET — list all tracking entries */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const contentType = searchParams.get("contentType");
    const videoFormat = searchParams.get("videoFormat");

    const where: Record<string, unknown> = {};
    if (channelId || contentType || videoFormat) {
      where.contentAsset = {};
      if (channelId) (where.contentAsset as Record<string, unknown>).channelId = channelId;
      if (contentType) (where.contentAsset as Record<string, unknown>).contentType = contentType;
      if (videoFormat) (where.contentAsset as Record<string, unknown>).videoFormat = videoFormat;
    }

    const tracking = await prisma.videoTracking.findMany({
      where,
      include: {
        contentAsset: {
          select: {
            id: true,
            assetCode: true,
            format: true,
            contentType: true,
            videoFormat: true,
            hookText: true,
            productIdentity: {
              select: { id: true, title: true, imageUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ data: tracking });
  } catch {
    return NextResponse.json({ error: "Failed to fetch tracking" }, { status: 500 });
  }
}

/** POST — create or update tracking entry */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = createTrackingSchema.parse(body);

    const { isWinner, winReason } = detectWinner(parsed);

    // Upsert — one tracking per asset
    const existing = await prisma.videoTracking.findUnique({
      where: { contentAssetId: parsed.contentAssetId },
    });

    const data = {
      tiktokVideoUrl: parsed.tiktokVideoUrl ?? null,
      publishedAt: parsed.publishedAt ? new Date(parsed.publishedAt) : null,
      views24h: parsed.views24h ?? null,
      views7d: parsed.views7d ?? null,
      likes: parsed.likes ?? null,
      comments: parsed.comments ?? null,
      shares: parsed.shares ?? null,
      saves: parsed.saves ?? null,
      clicksToShop: parsed.clicksToShop ?? null,
      orders: parsed.orders ?? null,
      revenue: parsed.revenue ?? null,
      commission: parsed.commission ?? null,
      isWinner,
      winReason,
    };

    let tracking;
    if (existing) {
      tracking = await prisma.videoTracking.update({
        where: { id: existing.id },
        data,
      });
    } else {
      tracking = await prisma.videoTracking.create({
        data: { contentAssetId: parsed.contentAssetId, ...data },
      });
    }

    // Update asset status to published if URL provided
    if (parsed.tiktokVideoUrl) {
      await prisma.contentAsset.update({
        where: { id: parsed.contentAssetId },
        data: { status: "published" },
      });
    }

    return NextResponse.json({ data: tracking });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save tracking" }, { status: 500 });
  }
}
