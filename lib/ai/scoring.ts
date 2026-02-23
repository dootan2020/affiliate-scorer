import { prisma } from "@/lib/db";
import { callClaude, MAX_TOKENS_SCORING } from "@/lib/ai/claude";
import { buildScoringPrompt } from "@/lib/ai/prompts";
import { getWeights } from "@/lib/scoring/weights";
import { calculateBaseScore } from "@/lib/scoring/formula";
import type { Product as ProductModel } from "@/lib/types/product";

export interface ScoredProduct extends ProductModel {
  aiScore: number;
  scoreBreakdown: string;
  contentSuggestion: string;
  platformAdvice: string;
  scoringVersion: string;
}

interface ClaudeScoreItem {
  id: string;
  aiScore: number;
  scoreBreakdown: Record<
    string,
    { score: number; weight: number; weighted: number }
  >;
  reason: string;
  contentSuggestion: string;
  platformAdvice: string;
}

interface ScoreOptions {
  batchId?: string;
  productIds?: string[];
}

async function fetchProducts(options: ScoreOptions): Promise<ProductModel[]> {
  if (options.productIds && options.productIds.length > 0) {
    return prisma.product.findMany({
      where: { id: { in: options.productIds } },
    });
  }
  if (options.batchId) {
    return prisma.product.findMany({
      where: { importBatchId: options.batchId },
    });
  }
  return prisma.product.findMany({
    where: { aiScore: null },
    take: 50,
    orderBy: { createdAt: "desc" },
  });
}

function parseClaudeResponse(text: string): ClaudeScoreItem[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Không tìm thấy JSON array trong phản hồi Claude");
  }
  return JSON.parse(jsonMatch[0]) as ClaudeScoreItem[];
}

function mergeWithBaseScore(
  product: ProductModel,
  claudeItem: ClaudeScoreItem | undefined
): {
  aiScore: number;
  scoreBreakdown: string;
  contentSuggestion: string;
  platformAdvice: string;
} {
  const base = calculateBaseScore(product);

  if (!claudeItem) {
    return {
      aiScore: base.total,
      scoreBreakdown: JSON.stringify(base.breakdown),
      contentSuggestion: "Chưa có gợi ý nội dung.",
      platformAdvice: product.platform,
    };
  }

  const finalScore = Math.round(
    claudeItem.aiScore * 0.6 + base.total * 0.4
  );

  return {
    aiScore: Math.min(100, Math.max(0, finalScore)),
    scoreBreakdown: JSON.stringify(claudeItem.scoreBreakdown),
    contentSuggestion: claudeItem.contentSuggestion,
    platformAdvice: claudeItem.platformAdvice,
  };
}

export async function scoreProducts(
  options: ScoreOptions = {}
): Promise<ScoredProduct[]> {
  const products = await fetchProducts(options);

  if (products.length === 0) {
    return [];
  }

  const weights = await getWeights();
  const { system, user } = buildScoringPrompt({ products, weights });

  let claudeItems: ClaudeScoreItem[] = [];

  try {
    const response = await callClaude(system, user, MAX_TOKENS_SCORING);
    claudeItems = parseClaudeResponse(response);
  } catch (error) {
    console.error("Lỗi khi gọi Claude API, dùng base score:", error);
  }

  const claudeMap = new Map(claudeItems.map((item) => [item.id, item]));

  const updates = products.map((product) => {
    const claudeItem = claudeMap.get(product.id);
    return { product, scores: mergeWithBaseScore(product, claudeItem) };
  });

  await Promise.all(
    updates.map(({ product, scores }) =>
      prisma.product.update({
        where: { id: product.id },
        data: {
          aiScore: scores.aiScore,
          scoreBreakdown: scores.scoreBreakdown,
          contentSuggestion: scores.contentSuggestion,
          platformAdvice: scores.platformAdvice,
          scoringVersion: "v1",
        },
      })
    )
  );

  await updateRankings();

  const scored = await prisma.product.findMany({
    where: { id: { in: products.map((p) => p.id) } },
    orderBy: { aiScore: "desc" },
  });

  return scored as ScoredProduct[];
}

async function updateRankings(): Promise<void> {
  const all = await prisma.product.findMany({
    where: { aiScore: { not: null } },
    orderBy: { aiScore: "desc" },
    select: { id: true },
  });

  await Promise.all(
    all.map((p: { id: string }, index: number) =>
      prisma.product.update({
        where: { id: p.id },
        data: { aiRank: index + 1 },
      })
    )
  );
}
