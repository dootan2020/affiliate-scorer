// Phase 5: Morning Brief generator — "Hôm nay sản xuất gì?"
import { prisma } from "@/lib/db";
import { callAI } from "@/lib/ai/call-ai";
import type { BriefContent } from "./brief-types";
import { ceoBriefReview } from "@/lib/advisor/analyze-pipeline";
import {
  buildCategoryWeights,
  buildChannelSection,
  buildCharacterBibleSection,
  buildPatternLines,
  buildPrompt,
} from "./brief-prompt-builder";
import { getYesterdayStats } from "./brief-yesterday-stats";

const SYSTEM_PROMPT = `Bạn là AI thư ký cho affiliate marketer TikTok Việt Nam.
Tạo Morning Brief ngắn gọn, actionable. Output luôn là JSON hợp lệ, không có markdown code fences.
QUAN TRỌNG: Với mỗi sản phẩm, PHẢI trả về đúng productId đã cung cấp. Với mỗi kênh, PHẢI trả về đúng channelId đã cung cấp.
QUAN TRỌNG: SP trong section ĐÃ CÓ BRIEF KHÔNG được đề xuất lại trong produce_today hoặc new_products_alert. Chỉ nhắc sản xuất nếu SP đã brief nhưng chưa publish.
QUAN TRỌNG: Mỗi kênh CHỈ ĐƯỢC đề xuất SP từ list SP PHÙ HỢP của kênh đó. KHÔNG đề xuất SP từ kênh khác.
QUAN TRỌNG: Mỗi kênh cần ít nhất 70% SP proven + 30% SP explore trong đề xuất.
QUAN TRỌNG: Tip và channel_tasks action phải nhất quán với Character Bible của kênh (nếu có). Dùng catchphrases khi phù hợp.`;

export async function generateMorningBrief(): Promise<string> {
  const today = new Date();
  const todayStr = today.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" });
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const sevenDaysLater = new Date(todayStart);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  // Gather data — 9 parallel queries
  const [newProducts, briefedProducts, yesterdayMetrics, topWeights, currentGoal, activeChannels, upcomingEvents, winningPatterns, losingPatterns] = await Promise.all([
    prisma.productIdentity.findMany({
      where: { inboxState: { in: ["scored", "enriched"] } },
      orderBy: { combinedScore: "desc" }, take: 15,
      select: { id: true, title: true, deltaType: true, combinedScore: true, contentPotentialScore: true, category: true },
    }),
    prisma.productIdentity.findMany({
      where: { inboxState: "briefed" }, take: 5,
      select: { id: true, title: true, _count: { select: { briefs: true } } },
    }),
    getYesterdayStats(),
    prisma.learningWeightP4.findMany({ orderBy: { weight: "desc" }, take: 10 }),
    prisma.goalP5.findFirst({
      where: { periodType: "weekly", periodStart: { lte: today }, periodEnd: { gte: today } },
    }),
    prisma.tikTokChannel.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, personaName: true, niche: true,
        voiceStyle: true, contentMix: true, targetAudience: true, contentPillars: true,
        contentSlots: { where: { scheduledDate: { gte: todayStart, lt: tomorrowStart } }, select: { status: true } },
        contentAssets: { where: { status: "draft" }, select: { id: true } },
        _count: { select: { contentAssets: true } },
        characterBible: { select: { coreValues: true, catchphrases: true, redLines: true, voiceDna: true } },
      },
    }),
    prisma.calendarEvent.findMany({
      where: { startDate: { gte: todayStart, lte: sevenDaysLater } },
      orderBy: { startDate: "asc" }, take: 5,
      select: { name: true, startDate: true, eventType: true },
    }),
    prisma.userPattern.findMany({
      where: { patternType: "winning", sampleSize: { gte: 2 } },
      orderBy: { winRate: "desc" }, take: 3,
      select: { label: true, winRate: true, avgViews: true, sampleSize: true, conditions: true },
    }),
    prisma.userPattern.findMany({
      where: { patternType: "losing", sampleSize: { gte: 2 }, winRate: { not: null } },
      orderBy: { winRate: "asc" }, take: 2,
      select: { label: true, winRate: true, sampleSize: true },
    }),
  ]);

  const categoryWeights = buildCategoryWeights(topWeights);
  const { channelLines, perChannelProducts, unmatchedLines } = buildChannelSection(
    activeChannels, newProducts, categoryWeights,
  );
  const bibleLines = buildCharacterBibleSection(activeChannels);

  const topHook = topWeights.find((w) => w.scope === "hook_type")?.key || "chưa có data";
  const topFormat = topWeights.find((w) => w.scope === "format")?.key || "chưa có data";
  const topCategories = topWeights.filter((w) => w.scope === "category").slice(0, 3).map((w) => w.key);

  const briefedLines = briefedProducts.map((p) =>
    `- ${p.title || "?"} (productId: ${p.id}) | ${p._count.briefs} briefs — KHÔNG đề xuất lại`,
  );
  const eventLines = upcomingEvents.map((e) => {
    const dateStr = new Date(e.startDate).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
    return `- ${e.name} (${e.eventType}) — ngày ${dateStr}`;
  });
  const { winLines, loseLines } = buildPatternLines(winningPatterns, losingPatterns, newProducts);

  const channelProductSections = activeChannels.map((ch) => {
    const lines = perChannelProducts.get(ch.id) || [];
    return `SP PHÙ HỢP KÊNH ${ch.name} (channelId: ${ch.id}):\n${lines.length > 0 ? lines.join("\n") : "Không có SP match niche kênh này"}`;
  }).join("\n\n");

  const prompt = buildPrompt({
    todayStr, channelLines, channelProductSections, unmatchedLines,
    briefedLines, eventLines, yesterdayMetrics, topHook, topFormat,
    topCategories, winLines, loseLines, bibleLines, currentGoal,
  });

  const { text: rawResponse, modelUsed } = await callAI(SYSTEM_PROMPT, prompt, 3000, "morning_brief");

  let jsonStr = rawResponse.trim();
  if (jsonStr.startsWith("```")) jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  let content: BriefContent;
  try {
    content = JSON.parse(jsonStr);
  } catch {
    console.error("[generateMorningBrief] JSON parse failed. Raw:", jsonStr.substring(0, 200));
    content = {
      greeting: "Chào buổi sáng!", channel_tasks: [], produce_today: [],
      new_products_alert: [], upcoming_events: [], yesterday_recap: "Không thể phân tích",
      tip: "Thử lại sau", weekly_progress: "",
    };
  }

  // V3: CEO brief review — actionable decision appended to brief
  try {
    const briefSummary = [
      content.greeting,
      content.produce_today?.map((p) => `Sản xuất: ${p.product} (${p.reason})`).join("; ") ?? "",
      content.yesterday_recap,
      content.tip,
    ].filter(Boolean).join("\n");

    const ceoReview = await ceoBriefReview(briefSummary);
    content.ceo_brief_review = ceoReview;
  } catch (err) {
    console.error("[generateMorningBrief] CEO review failed (non-blocking):", err);
    content.ceo_brief_review = null;
  }

  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const saved = await prisma.dailyBrief.upsert({
    where: { briefDate: todayDate },
    create: { briefDate: todayDate, content: JSON.parse(JSON.stringify(content)), aiModel: modelUsed },
    update: { content: JSON.parse(JSON.stringify(content)), generatedAt: new Date() },
  });
  return saved.id;
}
