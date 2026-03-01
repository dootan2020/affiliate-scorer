import { prisma } from "@/lib/db";
import { callAI, MAX_TOKENS_SCORING } from "@/lib/ai/call-ai";
import { buildScoringPrompt } from "@/lib/ai/prompts";
import { getWeights } from "@/lib/scoring/weights";
import { calculateBaseScore } from "@/lib/scoring/formula";
import { getPersonalizedScore, getFeedbackCount } from "@/lib/scoring/personalize";
import { computeRealTrending } from "@/lib/utils/product-badges";
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
  includeAlreadyScored?: boolean;
}

const CLAUDE_BATCH_SIZE = 30;
const CLAUDE_CONCURRENCY = 3;
const DB_WRITE_CHUNK = 50;

async function fetchProducts(options: ScoreOptions): Promise<ProductModel[]> {
  let products: ProductModel[];

  if (options.includeAlreadyScored) {
    products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
  } else if (options.productIds && options.productIds.length > 0) {
    products = await prisma.product.findMany({
      where: { id: { in: options.productIds } },
    });
  } else if (options.batchId) {
    products = await prisma.product.findMany({
      where: { importBatchId: options.batchId },
    });
  } else {
    products = await prisma.product.findMany({
      where: { aiScore: null },
      orderBy: { createdAt: "desc" },
    });
  }

  // Batch trending enrichment: 1 query instead of N findFirst
  const needsTrending = products
    .filter((p) => p.salesGrowth7d === null)
    .map((p) => p.id);

  if (needsTrending.length > 0) {
    const snapshots = await prisma.productSnapshot.findMany({
      where: { productId: { in: needsTrending } },
      orderBy: { snapshotDate: "desc" },
      distinct: ["productId"],
      select: { productId: true, sales7d: true },
    });

    const snapMap = new Map(snapshots.map((s) => [s.productId, s.sales7d]));

    for (const product of products) {
      if (product.salesGrowth7d !== null) continue;
      const prevSales = snapMap.get(product.id);
      if (prevSales !== undefined) {
        const realTrending = computeRealTrending(product.sales7d, prevSales);
        if (realTrending !== null) {
          product.salesGrowth7d = realTrending;
        }
      }
    }
  }

  return products;
}

function parseClaudeResponse(text: string): ClaudeScoreItem[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Không tìm thấy JSON array trong phản hồi Claude");
  }
  try {
    return JSON.parse(jsonMatch[0]) as ClaudeScoreItem[];
  } catch (parseError) {
    console.error("[parseClaudeResponse] JSON parse failed:", parseError, "Raw:", jsonMatch[0].substring(0, 200));
    return [];
  }
}

async function scoreBatchWithClaude(
  batch: ProductModel[],
  weights: ReturnType<typeof getWeights> extends Promise<infer T> ? T : never,
): Promise<Map<string, ClaudeScoreItem>> {
  try {
    const { system, user } = buildScoringPrompt({ products: batch, weights });
    const { text: response } = await callAI(system, user, MAX_TOKENS_SCORING, "scoring");
    const items = parseClaudeResponse(response);
    return new Map(items.map((item) => [item.id, item]));
  } catch (error) {
    console.error(`Claude batch scoring failed (${batch.length} products), using base score:`, error);
    return new Map();
  }
}

async function mergeWithBaseScore(
  product: ProductModel,
  claudeItem: ClaudeScoreItem | undefined,
  usePersonalization: boolean,
): Promise<{
  aiScore: number;
  scoreBreakdown: string;
  contentSuggestion: string;
  platformAdvice: string;
  scoringVersion: string;
}> {
  const base = calculateBaseScore(product);

  if (!claudeItem) {
    const baseTotal = base.total;
    let finalScore = baseTotal;
    let version = "v1";

    if (usePersonalization) {
      const personalized = await getPersonalizedScore(product, baseTotal);
      if (personalized) {
        finalScore = personalized.personalizedTotal;
        version = "v2-personalized";
      }
    }

    return {
      aiScore: finalScore,
      scoreBreakdown: JSON.stringify(base.breakdown),
      contentSuggestion: "",
      platformAdvice: "",
      scoringVersion: version,
    };
  }

  const blendedScore = Math.round(
    claudeItem.aiScore * 0.6 + base.total * 0.4,
  );

  let finalScore = blendedScore;
  let version = "v1";

  if (usePersonalization) {
    const personalized = await getPersonalizedScore(product, blendedScore);
    if (personalized) {
      finalScore = personalized.personalizedTotal;
      version = "v2-personalized";
    }
  }

  return {
    aiScore: Math.min(100, Math.max(0, finalScore)),
    scoreBreakdown: JSON.stringify(claudeItem.scoreBreakdown),
    contentSuggestion: claudeItem.contentSuggestion,
    platformAdvice: claudeItem.platformAdvice,
    scoringVersion: version,
  };
}

export async function scoreProducts(
  options: ScoreOptions = {},
): Promise<ScoredProduct[]> {
  const products = await fetchProducts(options);

  if (products.length === 0) {
    return [];
  }

  const weights = await getWeights();
  const fbCount = await getFeedbackCount();
  const usePersonalization = fbCount >= 30;

  // Split into Claude batches
  const batches: ProductModel[][] = [];
  for (let i = 0; i < products.length; i += CLAUDE_BATCH_SIZE) {
    batches.push(products.slice(i, i + CLAUDE_BATCH_SIZE));
  }

  // Process Claude batches with concurrency limit
  const allClaudeItems = new Map<string, ClaudeScoreItem>();

  for (let i = 0; i < batches.length; i += CLAUDE_CONCURRENCY) {
    const concurrentBatches = batches.slice(i, i + CLAUDE_CONCURRENCY);
    const results = await Promise.allSettled(
      concurrentBatches.map((batch) => scoreBatchWithClaude(batch, weights)),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        for (const [id, item] of result.value) {
          allClaudeItems.set(id, item);
        }
      }
    }
  }

  // Merge Claude + base scores for all products
  const updates = await Promise.all(
    products.map(async (product) => {
      const claudeItem = allClaudeItems.get(product.id);
      const scores = await mergeWithBaseScore(product, claudeItem, usePersonalization);
      return { product, scores };
    }),
  );

  // Write scores to DB in $transaction chunks (instead of N individual updates)
  for (let i = 0; i < updates.length; i += DB_WRITE_CHUNK) {
    const chunk = updates.slice(i, i + DB_WRITE_CHUNK);
    await prisma.$transaction(
      chunk.map(({ product, scores }) =>
        prisma.product.update({
          where: { id: product.id },
          data: {
            aiScore: scores.aiScore,
            scoreBreakdown: scores.scoreBreakdown,
            contentSuggestion: scores.contentSuggestion,
            platformAdvice: scores.platformAdvice,
            scoringVersion: scores.scoringVersion,
          },
        }),
      ),
    );
  }

  await updateRankings();

  const scored = await prisma.product.findMany({
    where: { id: { in: products.map((p) => p.id) } },
    orderBy: { aiScore: "desc" },
  });

  return scored as ScoredProduct[];
}

/** Score ALL products in database (including already-scored ones) */
export async function scoreAllProducts(): Promise<ScoredProduct[]> {
  return scoreProducts({ includeAlreadyScored: true });
}

async function updateRankings(): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "Product"
    SET "aiRank" = ranked.rn
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY "aiScore" DESC) as rn
      FROM "Product"
      WHERE "aiScore" IS NOT NULL
    ) ranked
    WHERE "Product".id = ranked.id
  `;
}
