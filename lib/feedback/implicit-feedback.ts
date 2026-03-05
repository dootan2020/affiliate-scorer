// Phase 07: Implicit feedback collection — zero-effort signals from user actions
// add-to-production = positive, archive = negative, publish = strong positive

import { prisma } from "@/lib/db";
import { invalidatePersonalizationCache } from "@/lib/scoring/personalize";

/** Log positive implicit signal (user added to production or published) */
export async function logImplicitPositive(
  productIdentityId: string,
): Promise<void> {
  // Find the linked Product for feedback relation
  const identity = await prisma.productIdentity.findUnique({
    where: { id: productIdentityId },
    select: { product: { select: { id: true } } },
  });

  if (!identity?.product) return;

  await prisma.feedback.upsert({
    where: {
      productId_source: {
        productId: identity.product.id,
        source: "implicit",
      },
    },
    create: {
      productId: identity.product.id,
      overallSuccess: "success",
      source: "implicit",
      aiScoreAtSelection: 0,
      feedbackDate: new Date(),
    },
    update: {
      overallSuccess: "success",
      feedbackDate: new Date(),
    },
  });

  invalidatePersonalizationCache();
  await checkAndBootstrapWeights();
}

/** Log negative implicit signal (user archived from inbox) */
export async function logImplicitNegative(
  productIdentityId: string,
): Promise<void> {
  const identity = await prisma.productIdentity.findUnique({
    where: { id: productIdentityId },
    select: { product: { select: { id: true } } },
  });

  if (!identity?.product) return;

  await prisma.feedback.upsert({
    where: {
      productId_source: {
        productId: identity.product.id,
        source: "implicit",
      },
    },
    create: {
      productId: identity.product.id,
      overallSuccess: "skip",
      source: "implicit",
      aiScoreAtSelection: 0,
      feedbackDate: new Date(),
    },
    update: {
      overallSuccess: "skip",
      feedbackDate: new Date(),
    },
  });

  invalidatePersonalizationCache();
}

/** Auto-populate LearningWeightP4 when feedback reaches BASIC threshold */
async function checkAndBootstrapWeights(): Promise<void> {
  const count = await prisma.feedback.count();
  const TIER_BOUNDARIES = [5, 15, 30];
  if (!TIER_BOUNDARIES.includes(count)) return;

  const successFeedbacks = await prisma.feedback.findMany({
    where: { overallSuccess: "success" },
    include: { product: { select: { category: true } } },
  });

  const catCounts = new Map<string, number>();
  for (const fb of successFeedbacks) {
    const cat = fb.product?.category?.toLowerCase() ?? "unknown";
    catCounts.set(cat, (catCounts.get(cat) ?? 0) + 1);
  }

  for (const [cat, catCount] of catCounts) {
    const weight = Math.min(3.0, catCount * 0.5);
    await prisma.learningWeightP4.upsert({
      where: { scope_key_channelId: { scope: "category", key: cat, channelId: "" } },
      create: { scope: "category", key: cat, weight, channelId: "" },
      update: { weight },
    });
  }

  console.log(
    `[feedback] Bootstrapped ${catCounts.size} category weights at ${count} feedback`,
  );
}
