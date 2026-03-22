// Phase 4: Decay function — weights cũ giảm theo thời gian
import { prisma } from "@/lib/db";

function daysBetween(d1: Date, d2: Date): number {
  return Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Apply exponential decay to all learning weights.
 * Weight *= 0.5^(days/halfLife).
 * Chạy khi generate brief hoặc admin trigger.
 */
export async function applyDecay(): Promise<{ updated: number; skipped: number }> {
  const weights = await prisma.learningWeightP4.findMany();
  let updated = 0;
  let skipped = 0;

  for (const w of weights) {
    if (!w.lastRewardAt) {
      skipped++;
      continue;
    }

    const daysSince = daysBetween(w.lastRewardAt, new Date());
    if (daysSince < 1) {
      skipped++;
      continue; // Skip nếu mới có data hôm nay
    }

    const halfLife = w.decayHalfLifeDays;
    const decayFactor = Math.pow(0.5, daysSince / halfLife);
    const decayedWeight = Number(w.weight) * decayFactor;

    // Fix E1: Update lastRewardAt to prevent double-exponential decay
    await prisma.learningWeightP4.update({
      where: { id: w.id },
      data: { weight: decayedWeight, lastRewardAt: new Date() },
    });
    updated++;
  }

  return { updated, skipped };
}
