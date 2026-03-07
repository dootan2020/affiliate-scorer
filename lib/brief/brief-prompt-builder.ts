// Helper functions for building Morning Brief AI prompt sections
import { matchesNiche } from "@/lib/suggestions/niche-category-map";

// --- Types for builder inputs ---

interface ChannelData {
  id: string;
  name: string;
  personaName: string | null;
  niche: string | null;
  voiceStyle: string | null;
  contentMix: unknown;
  targetAudience: string | null;
  contentPillars: unknown;
  contentSlots: Array<{ status: string }>;
  contentAssets: Array<{ id: string }>;
  _count: { contentAssets: number };
  characterBible: {
    coreValues: unknown;
    catchphrases: unknown;
    redLines: unknown;
    voiceDna: unknown;
  } | null;
}

interface ProductData {
  id: string;
  title: string | null;
  deltaType: string | null;
  combinedScore: unknown;
  contentPotentialScore: unknown;
  category: string | null;
}

interface WeightData {
  scope: string;
  key: string;
  weight: unknown;
}

interface PatternData {
  label: string;
  winRate: unknown;
  avgViews: unknown;
  sampleSize: number;
  conditions: unknown;
}

// --- Explore/exploit tagging ---

export function tagProduct(
  product: ProductData,
  categoryWeights: Map<string, number>,
): "proven" | "explore" {
  const cat = product.category?.toLowerCase();
  if (cat && categoryWeights.has(cat) && (categoryWeights.get(cat) ?? 0) > 1.0) {
    return "proven";
  }
  // Heuristic fallback when no weights
  if (categoryWeights.size === 0 && Number(product.combinedScore ?? 0) >= 75) {
    return "proven";
  }
  return "explore";
}

/** Build category weight map from LearningWeightP4 rows */
export function buildCategoryWeights(weights: WeightData[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const w of weights) {
    if (w.scope === "category") {
      map.set(w.key.toLowerCase(), Number(w.weight));
    }
  }
  return map;
}

// --- Channel prompt lines ---

export function buildChannelSection(
  channels: ChannelData[],
  products: ProductData[],
  categoryWeights: Map<string, number>,
): { channelLines: string[]; perChannelProducts: Map<string, string[]>; unmatchedLines: string[] } {
  const perChannelProducts = new Map<string, string[]>();
  const matchedProductIds = new Set<string>();

  const channelLines = channels.map((ch) => {
    const totalSlots = ch.contentSlots.length;
    const planned = ch.contentSlots.filter((s) => s.status === "planned").length;
    const briefed = ch.contentSlots.filter((s) => s.status === "briefed").length;
    const draftCount = ch.contentAssets.length;
    const totalAssets = ch._count.contentAssets;

    let classification: string;
    if (totalAssets === 0) classification = "Kênh mới — cần tạo brief đầu tiên";
    else if (draftCount > 0) classification = `Có ${draftCount} draft chờ xuất bản`;
    else classification = `${totalAssets} assets tổng`;

    // Context fields
    const contextParts: string[] = [];
    if (ch.niche) contextParts.push(`niche: ${ch.niche}`);
    if (ch.voiceStyle) contextParts.push(`voiceStyle: '${ch.voiceStyle}'`);
    if (ch.targetAudience) contextParts.push(`targetAudience: '${ch.targetAudience}'`);
    if (ch.contentMix && typeof ch.contentMix === "object") {
      contextParts.push(`contentMix: ${JSON.stringify(ch.contentMix)}`);
    }
    if (ch.contentPillars && Array.isArray(ch.contentPillars)) {
      contextParts.push(`contentPillars: [${(ch.contentPillars as string[]).join(", ")}]`);
    }
    const contextStr = contextParts.length > 0 ? `, ${contextParts.join(", ")}` : "";

    // Filter matching products for this channel
    const matchingProducts = ch.niche
      ? products
          .filter((p) => p.category && matchesNiche(ch.niche!, p.category))
          .slice(0, 5)
      : products.slice(0, 5);

    const productLines = matchingProducts.map((p) => {
      const tag = tagProduct(p, categoryWeights);
      matchedProductIds.add(p.id);
      return `  - ${p.title || "?"} (productId: ${p.id}, ${tag}) | ${p.deltaType || "?"} | Score: ${p.combinedScore != null ? Number(p.combinedScore) : "?"}`;
    });
    perChannelProducts.set(ch.id, productLines);

    return `- ${ch.name} (channelId: ${ch.id}, persona: ${ch.personaName || "?"}${contextStr}): ${classification} | ${totalSlots} slots today (${planned} planned, ${briefed} briefed)`;
  });

  // Unmatched products
  const unmatchedLines = products
    .filter((p) => !matchedProductIds.has(p.id))
    .slice(0, 5)
    .map((p) => {
      const tag = tagProduct(p, categoryWeights);
      return `- ${p.title || "?"} (productId: ${p.id}, ${tag}) | ${p.deltaType || "?"} | Score: ${p.combinedScore != null ? Number(p.combinedScore) : "?"}`;
    });

  return { channelLines, perChannelProducts, unmatchedLines };
}

// --- Character Bible prompt lines ---

export function buildCharacterBibleSection(channels: ChannelData[]): string[] {
  const lines: string[] = [];
  for (const ch of channels) {
    if (!ch.characterBible) continue;
    const cb = ch.characterBible;
    const parts: string[] = [`CHARACTER BIBLE — ${ch.name}:`];

    if (cb.coreValues && Array.isArray(cb.coreValues)) {
      parts.push(`  Core beliefs: ${(cb.coreValues as string[]).slice(0, 3).join(", ")}`);
    }
    if (cb.catchphrases && Array.isArray(cb.catchphrases)) {
      parts.push(`  Catchphrases: ${(cb.catchphrases as string[]).slice(0, 3).join(", ")}`);
    }
    if (cb.redLines && Array.isArray(cb.redLines)) {
      parts.push(`  Red lines: ${(cb.redLines as string[]).slice(0, 3).join(", ")}`);
    }
    if (cb.voiceDna && typeof cb.voiceDna === "object") {
      const vd = cb.voiceDna as Record<string, string>;
      const voiceSummary = [vd.tone, vd.pace, vd.signature].filter(Boolean).join(", ");
      if (voiceSummary) parts.push(`  Voice DNA: ${voiceSummary}`);
    }

    if (parts.length > 1) lines.push(parts.join("\n"));
  }
  return lines;
}

// --- Pattern prompt lines ---

export function buildPatternLines(
  winningPatterns: PatternData[],
  losingPatterns: Array<{ label: string; winRate: unknown; sampleSize: number }>,
  products: ProductData[],
): { winLines: string[]; loseLines: string[] } {
  const winLines = winningPatterns.map((p) => {
    const raw = p.conditions;
    const cond = raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : null;
    const category = typeof cond?.category === "string" ? cond.category : undefined;
    const hookType = typeof cond?.hook_type === "string" ? cond.hook_type : "?";
    const format = typeof cond?.format === "string" ? cond.format : "?";
    const matchingProducts = category
      ? products
          .filter((prod) => prod.category?.toLowerCase() === category.toLowerCase())
          .slice(0, 2)
          .map((prod) => prod.title || "?")
      : [];
    const productNote = matchingProducts.length > 0
      ? ` | SP phù hợp: ${matchingProducts.join(", ")}`
      : "";
    const viewsStr = p.avgViews != null ? `${p.avgViews} avg views` : "chưa có data views";
    return `- ${p.label} | Win rate: ${(Number(p.winRate ?? 0) * 100).toFixed(0)}% | ${viewsStr} | ${p.sampleSize} videos | Hook: ${hookType}, Format: ${format}${productNote}`;
  });

  const loseLines = losingPatterns.map((p) =>
    `- ${p.label} | Win rate: ${(Number(p.winRate ?? 0) * 100).toFixed(0)}% | ${p.sampleSize} videos`,
  );

  return { winLines, loseLines };
}

// --- Full prompt assembly ---

export interface PromptData {
  todayStr: string;
  channelLines: string[];
  channelProductSections: string;
  unmatchedLines: string[];
  briefedLines: string[];
  eventLines: string[];
  yesterdayMetrics: { published: number; totalViews: number; avgReward: number };
  topHook: string;
  topFormat: string;
  topCategories: string[];
  winLines: string[];
  loseLines: string[];
  bibleLines: string[];
  currentGoal: { targetVideos: number | null; actualVideos: number } | null;
}

export function buildPrompt(d: PromptData): string {
  const sections: string[] = [
    `Tạo Morning Brief cho ngày ${d.todayStr}.`,
  ];

  // Channels — always include
  sections.push(`KÊNH HOẠT ĐỘNG:\n${d.channelLines.length > 0 ? d.channelLines.join("\n") : "CHƯA CÓ KÊNH"}`);

  if (d.channelProductSections) sections.push(d.channelProductSections);

  if (d.unmatchedLines.length > 0) {
    sections.push(`SP CHƯA PHÂN KÊNH:\n${d.unmatchedLines.join("\n")}`);
  }

  if (d.briefedLines.length > 0) {
    sections.push(`SẢN PHẨM ĐÃ CÓ BRIEF (KHÔNG đề xuất lại):\n${d.briefedLines.join("\n")}`);
  }

  if (d.eventLines.length > 0) {
    sections.push(`SỰ KIỆN SẮP TỚI (7 ngày):\n${d.eventLines.join("\n")}`);
  }

  // Yesterday — skip if no activity
  const ym = d.yesterdayMetrics;
  if (ym.published > 0 || ym.totalViews > 0) {
    sections.push(`KẾT QUẢ HÔM QUA:\n- Videos đăng: ${ym.published}\n- Tổng views: ${ym.totalViews}\n- Reward trung bình: ${ym.avgReward.toFixed(1)}`);
  }

  // Learning — skip if no data
  const hasLearning = d.topHook !== "chưa có" || d.topFormat !== "chưa có" || d.topCategories.length > 0;
  if (hasLearning) {
    sections.push(`LEARNING INSIGHTS:\n- Hook tốt nhất: ${d.topHook}\n- Format tốt nhất: ${d.topFormat}\n- Category mạnh: ${d.topCategories.length > 0 ? d.topCategories.join(", ") : "chưa có"}`);
  }

  if (d.winLines.length > 0) sections.push(`WINNING PATTERNS:\n${d.winLines.join("\n")}`);
  if (d.loseLines.length > 0) sections.push(`PATTERNS NÊN TRÁNH:\n${d.loseLines.join("\n")}`);
  if (d.bibleLines.length > 0) sections.push(d.bibleLines.join("\n\n"));

  if (d.currentGoal) {
    sections.push(`MỤC TIÊU TUẦN:\n- Target: ${d.currentGoal.targetVideos || "?"} videos\n- Đã làm: ${d.currentGoal.actualVideos} videos`);
  }

  sections.push(`Output JSON:
{
  "greeting": "Chào buổi sáng ngắn gọn",
  "channel_tasks": [{"channel": "Tên", "channelId": "id", "action": "Việc", "priority": 1}],
  "produce_today": [{"product": "Tên", "productId": "id", "reason": "Tại sao", "videos": 3, "priority": 1}],
  "channel_product_match": [{"channelId": "id", "channelName": "Tên", "products": [{"productId": "id", "product": "Tên", "reason": "Lý do", "tag": "proven", "videos": 2}]}],
  "new_products_alert": [{"product": "Tên", "productId": "id", "why": "Đáng chú ý"}],
  "upcoming_events": [{"title": "Tên", "date": "dd/mm"}],
  "event_product_boost": [{"event": "Tên", "date": "dd/mm", "products": [{"productId": "id", "product": "Tên", "reason": "Liên quan sự kiện"}]}],
  "yesterday_recap": "1-2 câu",
  "tip": "Gợi ý cụ thể dựa trên winning patterns + character bible",
  "weekly_progress": "X/Y videos",
  "pattern_highlight": "Combo hook+format win rate XX% — hoặc để trống '' nếu chưa có dữ liệu"
}

Chỉ output JSON, không text khác.`);

  return sections.join("\n\n");
}
