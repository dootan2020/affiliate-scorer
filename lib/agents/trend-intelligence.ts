// Trend Intelligence Agent — nightly batch analysis of competitor captures
import { prisma } from "@/lib/db";
import { callAI } from "@/lib/ai/call-ai";

interface TrendAnalysisResult {
  capturesAnalyzed: number;
  channelsUpdated: number;
}

interface TrendInsight {
  hook: string;
  format: string;
  angle: string;
  trendScore: number;
}

/**
 * Process unanalyzed CompetitorCapture records in nightly batch.
 * Groups by channel, runs AI analysis per channel batch, updates ChannelMemory.trendingInsights.
 */
export async function analyzeTrends(): Promise<TrendAnalysisResult> {
  const result: TrendAnalysisResult = { capturesAnalyzed: 0, channelsUpdated: 0 };

  // Get unanalyzed captures (max 100)
  const captures = await prisma.competitorCapture.findMany({
    where: { analyzedAt: null },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { channel: { select: { name: true, niche: true } } },
  });

  if (captures.length === 0) return result;

  // Group by channel
  const byChannel = new Map<string, typeof captures>();
  for (const c of captures) {
    const arr = byChannel.get(c.channelId) || [];
    arr.push(c);
    byChannel.set(c.channelId, arr);
  }

  for (const [channelId, channelCaptures] of byChannel) {
    try {
      const channelName = channelCaptures[0].channel.name;
      const niche = channelCaptures[0].channel.niche;

      // Single captures: mark analyzed without AI (save cost)
      if (channelCaptures.length < 2) {
        await prisma.competitorCapture.updateMany({
          where: { id: { in: channelCaptures.map((c) => c.id) } },
          data: { analyzedAt: new Date() },
        });
        result.capturesAnalyzed += channelCaptures.length;
        continue;
      }

      // Build analysis prompt
      const captureContext = channelCaptures
        .map((c, i) => `${i + 1}. ${c.caption || "no caption"} | @${c.authorHandle || "unknown"} | ${(c.hashtags as string[]).join(" ")}`)
        .join("\n");

      const prompt = `Phân tích ${channelCaptures.length} video đối thủ trong niche "${niche}" (kênh ${channelName}):

${captureContext}

Phát hiện xu hướng. Output JSON:
{
  "trends": [
    {"hook": "loại hook phổ biến", "format": "format phổ biến", "angle": "góc tiếp cận", "trendScore": 1-10},
    ...max 5
  ],
  "summary": "1 câu tóm tắt xu hướng bằng tiếng Việt"
}`;

      const { text } = await callAI(
        "Bạn phân tích xu hướng content TikTok. Trả lời CHỈ JSON.",
        prompt,
        500,
        "trend_analysis"
      );

      // Parse response
      const cleaned = text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(cleaned) as {
        trends?: TrendInsight[];
        summary?: string;
      };

      const trends = parsed.trends || [];

      // Batch update captures with detected patterns
      const captureIds = channelCaptures.map((c) => c.id);
      const topTrend = trends[0];
      await prisma.competitorCapture.updateMany({
        where: { id: { in: captureIds } },
        data: {
          detectedHookType: topTrend?.hook || null,
          detectedFormat: topTrend?.format || null,
          detectedAngle: topTrend?.angle || null,
          trendScore: topTrend?.trendScore || null,
          analyzedAt: new Date(),
        },
      });

      // Update ChannelMemory.trendingInsights (only if exists — don't create empty)
      const trendingJson = JSON.parse(JSON.stringify(trends));
      await prisma.channelMemory.updateMany({
        where: { channelId },
        data: { trendingInsights: trendingJson },
      });

      result.capturesAnalyzed += channelCaptures.length;
      result.channelsUpdated++;
    } catch (err) {
      console.error(`[trend-intelligence] Error for channel ${channelId}:`, err);
      // Mark as analyzed to prevent infinite retry cost
      await prisma.competitorCapture.updateMany({
        where: { id: { in: channelCaptures.map((c) => c.id) } },
        data: { analyzedAt: new Date() },
      }).catch(() => {}); // Best effort
      result.capturesAnalyzed += channelCaptures.length;
    }
  }

  console.log("[trend-intelligence] Result:", result);
  return result;
}
