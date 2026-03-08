// Content Analyzer Agent — extracts actual video metadata post-publish
// Hooks into quick-log flow to close the feedback loop
import { prisma } from "@/lib/db";
import { callAI } from "@/lib/ai/call-ai";
import { fetchTikTokOembed } from "@/lib/agents/tiktok-oembed";
import { extractPostId } from "@/lib/learning/match-tiktok-link";

export interface AnalyzerResult {
  actualHookType: string | null;
  actualFormat: string | null;
  actualAngle: string | null;
  caption: string | null;
  hashtags: string[];
  tiktokVideoId: string | null;
}

const VALID_HOOK_TYPES = ["result", "price", "compare", "myth", "problem", "unbox", "trend"];
const VALID_FORMATS = ["review_short", "demo", "compare", "unbox", "lifestyle", "greenscreen", "problem_solution"];

/**
 * Analyze content post-publish: extract oembed metadata + AI classify hookType/format/angle.
 * Writes actual* fields to ContentAsset. Never throws — returns fallback result on error.
 */
export async function analyzeContent(
  assetId: string,
  tiktokUrl: string | null
): Promise<AnalyzerResult> {
  const fallback: AnalyzerResult = {
    actualHookType: null, actualFormat: null, actualAngle: null,
    caption: null, hashtags: [], tiktokVideoId: null,
  };

  try {
    // Fetch asset with product info
    const asset = await prisma.contentAsset.findUnique({
      where: { id: assetId },
      include: { productIdentity: { select: { category: true } } },
    });
    if (!asset) return fallback;

    // Extract video ID
    const tiktokVideoId = tiktokUrl ? extractPostId(tiktokUrl) : null;

    // Fetch oembed data
    const oembed = tiktokUrl ? await fetchTikTokOembed(tiktokUrl) : null;

    // Build classification context
    const caption = oembed?.caption || null;
    const hashtags = oembed?.hashtags || [];

    // Skip AI classification if no useful context
    if (!caption && !asset.hookType && !asset.format) {
      await updateAssetActuals(assetId, { tiktokVideoId });
      return { ...fallback, tiktokVideoId, caption, hashtags };
    }

    // AI classification
    const classified = await classifyContent(
      caption,
      hashtags,
      asset.hookType,
      asset.format,
      asset.productIdentity?.category || null
    );

    const result: AnalyzerResult = {
      actualHookType: classified?.hookType || asset.hookType,
      actualFormat: classified?.format || asset.format,
      actualAngle: classified?.angle || asset.angle,
      caption,
      hashtags,
      tiktokVideoId,
    };

    // Write to DB
    await updateAssetActuals(assetId, {
      actualHookType: result.actualHookType,
      actualFormat: result.actualFormat,
      actualAngle: result.actualAngle,
      tiktokVideoId,
      postedAt: new Date(),
    });

    return result;
  } catch (err) {
    console.warn("[content-analyzer] Error analyzing content:", err);
    return fallback;
  }
}

async function updateAssetActuals(
  assetId: string,
  data: Record<string, unknown>
): Promise<void> {
  await prisma.contentAsset.update({ where: { id: assetId }, data });
}

interface ClassificationResult {
  hookType: string;
  format: string;
  angle: string;
}

async function classifyContent(
  caption: string | null,
  hashtags: string[],
  plannedHook: string | null,
  plannedFormat: string | null,
  category: string | null
): Promise<ClassificationResult | null> {
  const prompt = `Given this TikTok video context:
- Caption: "${caption || "không có"}"
- Hashtags: ${hashtags.length > 0 ? hashtags.join(", ") : "không có"}
- Planned hook: "${plannedHook || "unknown"}"
- Planned format: "${plannedFormat || "unknown"}"
- Product category: "${category || "unknown"}"

Classify the actual content. Reply ONLY with JSON:
{
  "hookType": "${VALID_HOOK_TYPES.join("|")}",
  "format": "${VALID_FORMATS.join("|")}",
  "angle": "brief 5-10 word description of content angle in Vietnamese"
}`;

  try {
    const { text } = await callAI(
      "Bạn phân loại content TikTok. Trả lời CHỈ JSON, không giải thích.",
      prompt,
      200,
      "content_analysis"
    );

    const cleaned = text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(cleaned) as ClassificationResult;

    // Validate
    if (!VALID_HOOK_TYPES.includes(parsed.hookType)) parsed.hookType = plannedHook || "unknown";
    if (!VALID_FORMATS.includes(parsed.format)) parsed.format = plannedFormat || "unknown";

    return parsed;
  } catch {
    return null;
  }
}
