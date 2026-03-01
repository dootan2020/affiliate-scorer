// Background processor for product imports.
// Runs inside next/server after() — independent of browser connection.
import { prisma } from "@/lib/db";
import { syncProductIdentity } from "@/lib/inbox/sync-identity";
import { scoreProducts } from "@/lib/ai/scoring";
import { syncIdentityScores } from "@/lib/services/score-identity";
import { getProductLifecycle } from "@/lib/ai/lifecycle";
import { updateBatchProgress } from "@/lib/import/update-batch-progress";
import type { NormalizedProduct } from "@/lib/utils/normalize";

const SNAPSHOT_FIELDS = {
  id: true, price: true, commissionRate: true, sales7d: true,
  salesTotal: true, revenue7d: true, revenueTotal: true,
  totalKOL: true, totalVideos: true, kolOrderRate: true,
  productStatus: true, importBatchId: true,
} as const;

/** Process all products in background, updating batch progress as we go. */
export async function processProductBatch(
  batchId: string,
  deduplicated: NormalizedProduct[],
): Promise<void> {
  let created = 0;
  let updated = 0;
  let errors = 0;

  try {
    await updateBatchProgress(batchId, { status: "processing" });

    // Batch pre-fetch existing products to avoid N+1
    const allUrls = deduplicated.map((p) => p.tiktokUrl).filter(Boolean) as string[];
    const allNames = deduplicated.map((p) => p.name.toLowerCase());
    const [existingByUrl, existingByName] = await Promise.all([
      allUrls.length > 0
        ? prisma.product.findMany({
            where: { tiktokUrl: { in: allUrls } },
            select: { ...SNAPSHOT_FIELDS, tiktokUrl: true, name: true, shopName: true },
          })
        : Promise.resolve([]),
      prisma.product.findMany({
        where: { name: { in: allNames, mode: "insensitive" } },
        select: { ...SNAPSHOT_FIELDS, tiktokUrl: true, name: true, shopName: true },
      }),
    ]);

    const urlMap = new Map(existingByUrl.map((p) => [p.tiktokUrl, p]));
    const nameShopMap = new Map(
      existingByName.map((p) => [`${p.name.toLowerCase()}|${(p.shopName || "").toLowerCase()}`, p]),
    );

    // Process each product
    for (let i = 0; i < deduplicated.length; i++) {
      const p = deduplicated[i];
      try {
        const existing = (p.tiktokUrl && urlMap.get(p.tiktokUrl))
          || nameShopMap.get(`${p.name.toLowerCase()}|${(p.shopName || "").toLowerCase()}`)
          || null;

        if (existing) {
          await processExistingProduct(existing, p, batchId);
          await syncIdentityQuiet(existing.id, p);
          updated++;
        } else {
          const newProduct = await createNewProduct(p, batchId);
          await syncIdentityQuiet(newProduct.id, p);
          created++;
        }
      } catch (err) {
        console.error(`Product ${i} error:`, err);
        errors++;
      }

      // Update progress every 10 products or at the end
      if ((i + 1) % 10 === 0 || i === deduplicated.length - 1) {
        await updateBatchProgress(batchId, {
          rowsProcessed: i + 1,
          rowsCreated: created,
          rowsUpdated: updated,
          rowsError: errors,
        });
      }
    }

    // Mark import phase done
    const importStatus = errors > 0 && (created + updated) > 0 ? "partial"
      : errors > 0 ? "failed"
      : "completed";

    await updateBatchProgress(batchId, {
      status: importStatus,
      scoringStatus: "processing",
      errorLog: errors > 0 ? { totalErrors: errors } : undefined,
    });

    // Scoring phase
    await runScoring(batchId);

  } catch (err) {
    console.error("processProductBatch fatal:", err);
    try {
      await updateBatchProgress(batchId, {
        status: "failed",
        scoringStatus: "failed",
        errorLog: { fatal: err instanceof Error ? err.message : "Unknown" },
        completedAt: new Date(),
      });
    } catch (updateErr) {
      console.error("Failed to update batch status after fatal:", updateErr);
    }
  }
}

async function processExistingProduct(
  existing: { id: string; price: number | null; commissionRate: number | null; sales7d: number | null; salesTotal: number | null; revenue7d: number | null; revenueTotal: number | null; totalKOL: number | null; totalVideos: number | null; kolOrderRate: number | null; productStatus: string | null; importBatchId: string | null },
  p: NormalizedProduct,
  batchId: string,
): Promise<void> {
  const dataChanged =
    existing.price !== p.price || existing.commissionRate !== p.commissionRate ||
    existing.sales7d !== p.sales7d || existing.salesTotal !== p.salesTotal ||
    existing.revenue7d !== p.revenue7d || existing.revenueTotal !== p.revenueTotal ||
    existing.totalKOL !== p.totalKOL || existing.totalVideos !== p.totalVideos ||
    existing.kolOrderRate !== p.kolOrderRate || existing.productStatus !== p.productStatus;

  if (dataChanged) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySnap = await prisma.productSnapshot.findFirst({
      where: { productId: existing.id, snapshotDate: { gte: today, lt: tomorrow } },
      select: { id: true },
    });

    const snapData = {
      importBatchId: existing.importBatchId ?? batchId,
      price: existing.price ?? 0, commissionRate: existing.commissionRate ?? 0,
      sales7d: existing.sales7d, salesTotal: existing.salesTotal,
      revenue7d: existing.revenue7d, revenueTotal: existing.revenueTotal,
      totalKOL: existing.totalKOL, totalVideos: existing.totalVideos,
      kolOrderRate: existing.kolOrderRate, productStatus: existing.productStatus,
    };

    if (todaySnap) {
      await prisma.productSnapshot.update({ where: { id: todaySnap.id }, data: snapData });
    } else {
      await prisma.productSnapshot.create({ data: { productId: existing.id, ...snapData } });
    }
  }

  await prisma.product.update({
    where: { id: existing.id },
    data: {
      name: p.name, url: p.url, category: p.category, price: p.price,
      commissionRate: p.commissionRate, commissionVND: p.commissionVND,
      salesTotal: p.salesTotal, sales7d: p.sales7d,
      salesGrowth7d: p.salesGrowth7d, salesGrowth30d: p.salesGrowth30d,
      revenue7d: p.revenue7d, revenue30d: p.revenue30d, revenueTotal: p.revenueTotal,
      totalKOL: p.totalKOL, kolOrderRate: p.kolOrderRate,
      totalVideos: p.totalVideos, totalLivestreams: p.totalLivestreams,
      imageUrl: p.imageUrl, tiktokUrl: p.tiktokUrl,
      fastmossUrl: p.fastmossUrl, shopFastmossUrl: p.shopFastmossUrl,
      shopName: p.shopName ?? undefined, productStatus: p.productStatus,
      listingDate: p.listingDate, lastSeenAt: new Date(),
      importBatchId: batchId, dataDate: p.dataDate,
    },
  });
}

async function createNewProduct(
  p: NormalizedProduct,
  batchId: string,
): Promise<{ id: string }> {
  return prisma.product.create({
    data: {
      name: p.name, url: p.url, category: p.category, price: p.price,
      commissionRate: p.commissionRate, commissionVND: p.commissionVND,
      platform: p.platform, salesTotal: p.salesTotal, sales7d: p.sales7d,
      salesGrowth7d: p.salesGrowth7d, salesGrowth30d: p.salesGrowth30d,
      revenue7d: p.revenue7d, revenue30d: p.revenue30d, revenueTotal: p.revenueTotal,
      totalKOL: p.totalKOL, kolOrderRate: p.kolOrderRate,
      totalVideos: p.totalVideos, totalLivestreams: p.totalLivestreams,
      affiliateCount: p.affiliateCount, creatorCount: p.creatorCount,
      topVideoViews: p.topVideoViews, imageUrl: p.imageUrl,
      tiktokUrl: p.tiktokUrl, fastmossUrl: p.fastmossUrl,
      shopFastmossUrl: p.shopFastmossUrl, shopName: p.shopName,
      shopRating: p.shopRating, productStatus: p.productStatus,
      listingDate: p.listingDate, source: p.source,
      importBatchId: batchId, dataDate: p.dataDate,
    },
    select: { id: true },
  });
}

async function syncIdentityQuiet(productId: string, p: NormalizedProduct): Promise<void> {
  try {
    await syncProductIdentity({
      productId,
      name: p.name, shopName: p.shopName, category: p.category,
      price: p.price, commissionRate: p.commissionRate, imageUrl: p.imageUrl,
      tiktokUrl: p.tiktokUrl, fastmossUrl: p.fastmossUrl,
      aiScore: null, sales7d: p.sales7d,
    });
  } catch (err) {
    console.error("Identity sync error:", err);
  }
}

async function runScoring(batchId: string): Promise<void> {
  try {
    await scoreProducts({ batchId });

    const linkedIdentities = await prisma.product.findMany({
      where: { importBatchId: batchId, identityId: { not: null } },
      select: { identityId: true, id: true },
    });
    const identityIds = linkedIdentities
      .map((p) => p.identityId)
      .filter((id): id is string => id != null);

    if (identityIds.length > 0) {
      await syncIdentityScores(identityIds);
    }

    // Lifecycle recalc
    for (const lp of linkedIdentities) {
      if (!lp.identityId) continue;
      try {
        const lifecycle = await getProductLifecycle(lp.id);
        await prisma.productIdentity.update({
          where: { id: lp.identityId },
          data: { lifecycleStage: lifecycle.stage },
        });
      } catch { /* non-blocking */ }
    }

    await updateBatchProgress(batchId, {
      scoringStatus: "completed",
      completedAt: new Date(),
    });
  } catch (err) {
    console.error("Scoring failed:", err);
    await updateBatchProgress(batchId, {
      scoringStatus: "failed",
      completedAt: new Date(),
    });
  }
}
