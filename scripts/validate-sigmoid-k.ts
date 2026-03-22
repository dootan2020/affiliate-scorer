// Phase 08: Validate sigmoid K parameter against real product data
// Run: npx tsx scripts/validate-sigmoid-k.ts
// Target: P25≈30-35, P75≈65-70 for well-spread score distribution

import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

async function validateSigmoidK(): Promise<void> {
  const identities = await prisma.productIdentity.findMany({
    where: { marketScore: { not: null } },
    select: { marketScore: true },
  });

  const rawScores = identities.map((i) => Number(i.marketScore));
  if (rawScores.length === 0) {
    console.log("No scored products found.");
    return;
  }

  const mean =
    rawScores.reduce((s, v) => s + v, 0) / rawScores.length;
  const stddev = Math.sqrt(
    rawScores.reduce((s, v) => s + (v - mean) ** 2, 0) /
      (rawScores.length - 1),
  );

  console.log(
    `Products: ${rawScores.length}, Mean: ${mean.toFixed(1)}, StdDev: ${stddev.toFixed(1)}`,
  );
  console.log("---");
  console.log("K     | P10  P25  P50  P75  P90  | Spread (P75-P25)");
  console.log("------|--------------------------|------------------");

  for (const K of [0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.5]) {
    const normalized = rawScores
      .map((raw) => {
        const z = (raw - mean) / stddev;
        return Math.round((1 / (1 + Math.exp(-K * z))) * 100);
      })
      .sort((a, b) => a - b);

    const p = (pct: number) =>
      normalized[Math.floor(normalized.length * pct)];
    const p10 = p(0.1);
    const p25 = p(0.25);
    const p50 = p(0.5);
    const p75 = p(0.75);
    const p90 = p(0.9);

    const marker = K === 0.9 ? " ← current" : "";
    console.log(
      `K=${K.toFixed(1)} | ${String(p10).padStart(3)}  ${String(p25).padStart(3)}  ${String(p50).padStart(3)}  ${String(p75).padStart(3)}  ${String(p90).padStart(3)}  | ${p75 - p25}${marker}`,
    );
  }

  console.log("\nTarget: P25≈30-35, P75≈65-70 (spread ~30-40)");
}

validateSigmoidK()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
