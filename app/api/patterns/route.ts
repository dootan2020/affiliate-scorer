// Phase 4: GET /api/patterns — xem playbook
//          POST /api/patterns — regenerate patterns
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { regeneratePatterns } from "@/lib/learning/pattern-detection";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const channelId = request.nextUrl.searchParams.get("channelId") || undefined;

    // Validate channel exists and is active if channelId provided
    if (channelId) {
      const channel = await prisma.tikTokChannel.findUnique({ where: { id: channelId }, select: { id: true, isActive: true } });
      if (!channel) {
        return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });
      }
      if (!channel.isActive) {
        return NextResponse.json({ error: "Kênh đã tạm dừng" }, { status: 400 });
      }
    }

    const patterns = await prisma.userPattern.findMany({
      orderBy: [
        { patternType: "asc" }, // winning first
        { winRate: "desc" },
      ],
    });

    // Filter patterns by channel if channelId provided
    let filteredPatterns = patterns;
    if (channelId) {
      // Get asset IDs for this channel
      const channelAssetIds = await prisma.contentAsset.findMany({
        where: { channelId },
        select: { id: true },
      });
      const channelAssetIdSet = new Set(channelAssetIds.map((a) => a.id));

      filteredPatterns = patterns.filter((p) => {
        const assetIds = (p.assetIds as string[]) || [];
        return assetIds.some((id) => channelAssetIdSet.has(id));
      });
    }

    const winning = filteredPatterns.filter((p) => p.patternType === "winning");
    const losing = filteredPatterns.filter((p) => p.patternType === "losing");

    // Top insights từ learning weights
    const weights = await prisma.learningWeightP4.findMany({
      orderBy: { weight: "desc" },
    });

    const insights: Array<{ label: string; detail: string }> = [];

    // Top hook type
    const topHook = weights.find((w) => w.scope === "hook_type");
    if (topHook) {
      insights.push({
        label: "Hook tốt nhất",
        detail: `"${topHook.key}" (avg reward: ${Number(topHook.avgReward).toFixed(1)}, ${topHook.sampleCount} videos)`,
      });
    }

    // Top format
    const topFormat = weights.find((w) => w.scope === "format");
    if (topFormat) {
      insights.push({
        label: "Format tốt nhất",
        detail: `"${topFormat.key}" (avg reward: ${Number(topFormat.avgReward).toFixed(1)})`,
      });
    }

    // Top category
    const topCat = weights.find((w) => w.scope === "category");
    if (topCat) {
      insights.push({
        label: "Category mạnh",
        detail: `"${topCat.key}" (avg reward: ${Number(topCat.avgReward).toFixed(1)})`,
      });
    }

    // Weak category
    const weakCat = [...weights].reverse().find((w) => w.scope === "category" && w.sampleCount >= 2);
    if (weakCat && weakCat.key !== topCat?.key) {
      insights.push({
        label: "Category yếu",
        detail: `"${weakCat.key}" — cân nhắc tránh`,
      });
    }

    // Total videos logged (filtered by channel if applicable)
    const totalLogged = channelId
      ? await prisma.assetMetric.count({
          where: { contentAsset: { channelId } },
        })
      : await prisma.assetMetric.count();

    return NextResponse.json({
      data: { winning, losing, insights, totalLogged },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(): Promise<NextResponse> {
  try {
    const result = await regeneratePatterns();
    return NextResponse.json({
      data: result,
      message: `Đã tạo ${result.patterns} patterns`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
