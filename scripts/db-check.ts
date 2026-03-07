import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

async function main() {
  // Latest 3 batches
  const batches = await p.importBatch.findMany({
    take: 3,
    orderBy: { importDate: "desc" },
    select: {
      id: true,
      status: true,
      scoringStatus: true,
      recordCount: true,
      rowsProcessed: true,
      rowsCreated: true,
      rowsUpdated: true,
      errorLog: true,
      importDate: true,
    },
  });
  console.log("=== Latest Batches ===");
  for (const b of batches) {
    console.log(
      `  ${b.id} | status=${b.status} scoring=${b.scoringStatus} | ${b.recordCount} records | created=${b.rowsCreated} updated=${b.rowsUpdated} | date=${b.importDate.toISOString()}`,
    );
    if (b.errorLog) console.log(`    errorLog: ${JSON.stringify(b.errorLog)}`);
  }

  // Product score distribution
  const scored = await p.product.count({ where: { aiScore: { not: null } } });
  const total = await p.product.count();
  console.log(`\n=== Products: ${scored}/${total} scored ===`);

  // Identity score distribution
  const idTotal = await p.productIdentity.count();
  const idCombined = await p.productIdentity.count({ where: { combinedScore: { not: null } } });
  const idMarket = await p.productIdentity.count({ where: { marketScore: { not: null } } });
  console.log(`=== Identities: ${idMarket}/${idTotal} marketScore, ${idCombined}/${idTotal} combinedScore ===`);

  // AI model config
  const aiConfig = await p.aiModelConfig.findUnique({ where: { taskType: "scoring" } });
  console.log(`\n=== Scoring model: ${aiConfig?.modelId ?? "NOT CONFIGURED"} ===`);

  // Check API key existence (not the actual key)
  const providers = await p.apiProvider.findMany({
    select: { provider: true, isConnected: true },
  });
  console.log("=== API Providers ===");
  for (const pr of providers) {
    console.log(`  ${pr.provider}: connected=${pr.isConnected}`);
  }

  // Test: can we actually get the scoring model + key?
  try {
    const modelId = aiConfig?.modelId;
    if (!modelId) throw new Error("No scoring model configured");

    const provider = modelId.startsWith("claude")
      ? "anthropic"
      : modelId.startsWith("gpt") || modelId.startsWith("o")
        ? "openai"
        : modelId.startsWith("gemini")
          ? "google"
          : "unknown";

    const record = await p.apiProvider.findUnique({ where: { provider } });
    const hasKey = !!(record?.encryptedKey && record.isConnected);
    console.log(`\n=== Scoring readiness: model=${modelId} provider=${provider} hasKey=${hasKey} ===`);
  } catch (e) {
    console.log(`\n=== Scoring readiness: FAILED — ${e} ===`);
  }

  // Check: identities from latest batch — what are their product's aiScores?
  if (batches.length > 0) {
    const latestId = batches[0].id;
    const batchProds = await p.product.findMany({
      where: { importBatchId: latestId },
      select: { id: true, aiScore: true, identityId: true },
    });
    const withScore = batchProds.filter((p) => p.aiScore !== null).length;
    const withIdentity = batchProds.filter((p) => p.identityId !== null).length;
    console.log(
      `\n=== Latest batch (${latestId}) products: ${batchProds.length} total, ${withScore} scored, ${withIdentity} linked ===`,
    );

    // Check those identities' combinedScore
    const identityIds = batchProds
      .filter((p) => p.identityId)
      .map((p) => p.identityId!)
      .slice(0, 300);
    const identities = await p.productIdentity.findMany({
      where: { id: { in: identityIds } },
      select: { id: true, combinedScore: true, marketScore: true, inboxState: true },
    });
    const withCombined = identities.filter((i) => i.combinedScore !== null).length;
    const stateDistrib: Record<string, number> = {};
    for (const i of identities) {
      stateDistrib[i.inboxState] = (stateDistrib[i.inboxState] || 0) + 1;
    }
    console.log(`  Identities: ${withCombined}/${identities.length} have combinedScore`);
    console.log(`  State distribution:`, stateDistrib);
  }

  await p.$disconnect();
}

main().catch(console.error);
