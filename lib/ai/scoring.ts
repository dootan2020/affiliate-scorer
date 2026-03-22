// Phase 02+05: AI Scoring Pipeline
// Rubric-anchored scoring with 4 criteria, model tracking, batch validation

import { prisma } from "@/lib/db";
import { callAI, MAX_TOKENS_SCORING } from "@/lib/ai/call-ai";
import { buildScoringPrompt } from "@/lib/ai/prompts";
import { getWeights } from "@/lib/scoring/weights";
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

interface RubricScores {
  market_demand: number;
  quality_trust: number;
  viral_potential: number;
  risk: number;
}

interface ClaudeScoreItem {
  id: string;
  scores: RubricScores;
  aiScore: number;
  reason: string;
  contentAngle: string;
  // Legacy compat
  scoreBreakdown?: Record<string, unknown>;
  contentSuggestion?: string;
  platformAdvice?: string;
}

interface ScoreOptions {
  batchId?: string;
  productIds?: string[];
  identityIds?: string[];
  includeAlreadyScored?: boolean;
}

const CLAUDE_BATCH_SIZE = 30;
const CLAUDE_CONCURRENCY = 3;
const PARALLEL_WRITES = 20;
const VALID_TIERS = [20, 40, 60, 80, 100];

// Fix #12: Explicit scoring version for tracking old vs new scores
const CURRENT_SCORING_VERSION = "v2.0-rubric-20260322";

/** Snap a value to the nearest valid rubric tier */
function snapToTier(value: number): number {
  return VALID_TIERS.reduce((a, b) =>
    Math.abs(b - value) < Math.abs(a - value) ? b : a,
  );
}

/** Validate and correct rubric scores from AI response */
function validateBatchScores(scores: ClaudeScoreItem[]): ClaudeScoreItem[] {
  const mean =
    scores.length > 0
      ? scores.reduce((s, p) => s + p.aiScore, 0) / scores.length
      : 0;

  if (mean > 70 || mean < 40) {
    console.warn(
      `[AI Scoring] Batch mean ${mean.toFixed(1)} outside expected range 40-70`,
    );
  }

  for (const item of scores) {
    if (!item.scores) continue;
    // Snap each sub-score to valid tier
    for (const key of Object.keys(item.scores) as Array<keyof RubricScores>) {
      const val = item.scores[key];
      if (typeof val === "number" && !VALID_TIERS.includes(val)) {
        item.scores[key] = snapToTier(val);
      }
    }
    // Recompute aiScore from corrected sub-scores
    const s = item.scores;
    item.aiScore = Math.round(
      (s.market_demand ?? 60) * 0.35 +
        (s.quality_trust ?? 60) * 0.25 +
        (s.viral_potential ?? 60) * 0.25 +
        (s.risk ?? 60) * 0.15,
    );
  }

  return scores;
}

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

  // Batch trending enrichment
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
  // Fix A2: Use non-greedy regex to avoid overcapture across code blocks
  const jsonMatch = text.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) {
    throw new Error("No JSON array found in AI response");
  }
  try {
    return JSON.parse(jsonMatch[0]) as ClaudeScoreItem[];
  } catch (parseError) {
    // Fix A1: Throw on parse failure instead of returning [] (silent cascade)
    console.error(
      "[parseClaudeResponse] JSON parse failed:",
      parseError,
      "Raw:",
      jsonMatch[0].substring(0, 200),
    );
    throw new Error(`JSON parse failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
  }
}

async function scoreBatchWithClaude(
  batch: ProductModel[],
  weights: Awaited<ReturnType<typeof getWeights>>,
): Promise<{ items: Map<string, ClaudeScoreItem>; modelUsed: string }> {
  try {
    const { system, user } = buildScoringPrompt({ products: batch, weights });
    const { text: response, modelUsed } = await callAI(
      system,
      user,
      MAX_TOKENS_SCORING,
      "scoring",
    );
    const rawItems = parseClaudeResponse(response);
    const validatedItems = validateBatchScores(rawItems);
    return {
      items: new Map(validatedItems.map((item) => [item.id, item])),
      modelUsed,
    };
  } catch (error) {
    console.error(
      `Claude batch scoring failed (${batch.length} products):`,
      error,
    );
    return { items: new Map(), modelUsed: "unknown" };
  }
}

function buildScoreBreakdownJson(
  claudeItem: ClaudeScoreItem,
  modelUsed: string,
): string {
  return JSON.stringify({
    rubric: claudeItem.scores,
    reason: claudeItem.reason,
    contentAngle: claudeItem.contentAngle,
    scoredByModel: modelUsed,
    scoredAt: new Date().toISOString(),
  });
}

async function mergeWithBaseScore(
  product: ProductModel,
  claudeItem: ClaudeScoreItem | undefined,
  modelUsed: string,
  usePersonalization: boolean,
): Promise<{
  aiScore: number | null;
  scoreBreakdown: string;
  contentSuggestion: string;
  platformAdvice: string;
  scoringVersion: string;
}> {
  if (!claudeItem) {
    // No AI response — store null so retry-scoring cron can pick it up (Fix C3)
    return {
      aiScore: null,
      scoreBreakdown: JSON.stringify({ scoredByModel: modelUsed, error: "no_response" }),
      contentSuggestion: "",
      platformAdvice: "",
      scoringVersion: CURRENT_SCORING_VERSION,
    };
  }

  let finalScore = claudeItem.aiScore;

  if (usePersonalization) {
    const personalized = await getPersonalizedScore(product, finalScore);
    if (personalized) {
      finalScore = personalized.personalizedTotal;
    }
  }

  return {
    aiScore: Math.min(100, Math.max(0, finalScore)),
    scoreBreakdown: buildScoreBreakdownJson(claudeItem, modelUsed),
    contentSuggestion: claudeItem.contentAngle || claudeItem.contentSuggestion || "",
    platformAdvice: claudeItem.platformAdvice || "",
    scoringVersion: CURRENT_SCORING_VERSION,
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
  const usePersonalization = fbCount >= 5; // Phase 07: lowered from 30 to 5

  // Split into Claude batches
  const batches: ProductModel[][] = [];
  for (let i = 0; i < products.length; i += CLAUDE_BATCH_SIZE) {
    batches.push(products.slice(i, i + CLAUDE_BATCH_SIZE));
  }

  // Process Claude batches with concurrency limit
  const allClaudeItems = new Map<string, ClaudeScoreItem>();
  let lastModelUsed = "unknown";

  for (let i = 0; i < batches.length; i += CLAUDE_CONCURRENCY) {
    const concurrentBatches = batches.slice(i, i + CLAUDE_CONCURRENCY);
    const results = await Promise.allSettled(
      concurrentBatches.map((batch) => scoreBatchWithClaude(batch, weights)),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        lastModelUsed = result.value.modelUsed;
        for (const [id, item] of result.value.items) {
          allClaudeItems.set(id, item);
        }
      }
    }
  }

  // Merge Claude + base scores
  const updates = await Promise.all(
    products.map(async (product) => {
      const claudeItem = allClaudeItems.get(product.id);
      const scores = await mergeWithBaseScore(
        product,
        claudeItem,
        lastModelUsed,
        usePersonalization,
      );
      return { product, scores };
    }),
  );

  // Write scores to DB
  let writeErrors = 0;
  for (let i = 0; i < updates.length; i += PARALLEL_WRITES) {
    const chunk = updates.slice(i, i + PARALLEL_WRITES);
    const results = await Promise.allSettled(
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
    writeErrors += results.filter((r) => r.status === "rejected").length;
  }
  if (writeErrors > 0) {
    console.warn(`Scoring: ${writeErrors}/${updates.length} write failures`);
  }

  await updateRankings();

  const scored = await prisma.product.findMany({
    where: { id: { in: products.map((p) => p.id) } },
    orderBy: { aiScore: "desc" },
  });

  return scored as ScoredProduct[];
}

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
