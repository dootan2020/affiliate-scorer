// Product import processor for Vercel serverless.
// Supports chunked import: processes IMPORT_CHUNK products per invocation,
// then fires relay to /api/internal/import-chunk for the rest.
// Scoring fires via /api/internal/score-batch after the LAST import chunk.
// Key optimization: parallel standalone updates (no $transaction for PgBouncer).
import { prisma } from "@/lib/db";
import { syncIdentityBatch } from "@/lib/inbox/sync-identity-batch";
import {
  updateBatchProgress,
  incrementBatchProgress,
} from "@/lib/import/update-batch-progress";
import {
  buildCreateData,
  buildUpdateData,
  hasDataChanged,
} from "@/lib/import/product-data-builders";
import { fireRelay } from "@/lib/import/fire-relay";
import type { NormalizedProduct } from "@/lib/utils/normalize";

const SNAPSHOT_SELECT = {
  id: true, price: true, commissionRate: true, sales7d: true,
  salesTotal: true, revenue7d: true, revenueTotal: true,
  totalKOL: true, totalVideos: true, kolOrderRate: true,
  productStatus: true, importBatchId: true,
} as const;

/** Concurrency for parallel queries — matches typical PgBouncer pool size */
const PARALLEL = 20;

/** Products per import chunk — fits comfortably in 60s maxDuration */
export const IMPORT_CHUNK = 300;

/** Run array of async fns with concurrency limit */
async function parallelMap<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number,
): Promise<{ successes: R[]; errorCount: number }> {
  const successes: R[] = [];
  let errorCount = 0;
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const results = await Promise.allSettled(chunk.map(fn));
    for (const r of results) {
      if (r.status === "fulfilled") successes.push(r.value);
      else errorCount++;
    }
  }
  return { successes, errorCount };
}

/**
 * Entry point called from after() in upload route.
 * Processes first chunk, relays remaining via /api/internal/import-chunk.
 */
export async function processProductBatch(
  batchId: string,
  deduplicated: NormalizedProduct[],
): Promise<void> {
  try {
    await updateBatchProgress(batchId, { status: "processing" });

    const chunk = deduplicated.slice(0, IMPORT_CHUNK);
    const remaining = deduplicated.slice(IMPORT_CHUNK);

    await processChunk(batchId, chunk);

    if (remaining.length > 0) {
      // MUST await — runs inside after() which freezes on return
      await fireRelay(
        "/api/internal/import-chunk",
        { batchId, products: remaining },
        "import-chunk",
      );
    } else {
      await finalizeImportAndFireScoring(batchId);
    }
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

/**
 * Process a single chunk: classify + import + identity sync + update progress.
 * Shared by processProductBatch (first chunk) and import-chunk endpoint.
 */
export async function processChunk(
  batchId: string,
  products: NormalizedProduct[],
): Promise<void> {
  const { toCreate, toUpdate, created, errors } =
    await classifyAndImport(batchId, products);

  await batchSyncIdentities(products, created, toUpdate);

  await incrementBatchProgress(batchId, {
    rowsProcessed: products.length,
    rowsCreated: toCreate.length,
    rowsUpdated: toUpdate.length,
    rowsError: errors,
  });
}

/**
 * Mark import complete and fire scoring relay.
 * Called after the last import chunk finishes.
 */
export async function finalizeImportAndFireScoring(
  batchId: string,
): Promise<void> {
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
    select: { rowsError: true, rowsCreated: true, rowsUpdated: true },
  });

  const totalErrors = batch?.rowsError ?? 0;
  const totalProcessed = (batch?.rowsCreated ?? 0) + (batch?.rowsUpdated ?? 0);
  const importStatus =
    totalErrors > 0 && totalProcessed > 0
      ? "partial"
      : totalErrors > 0
        ? "failed"
        : "completed";

  await updateBatchProgress(batchId, {
    status: importStatus,
    scoringStatus: "processing",
    errorLog: totalErrors > 0 ? { totalErrors } : undefined,
  });

  // Await relay so it completes before after()/route handler returns.
  // Vercel freezes serverless functions after the handler finishes,
  // killing any dangling fire-and-forget promises.
  await fireRelay("/api/internal/score-batch", { batchId }, "scoring");
}

// ─── Internal helpers (unchanged from before) ───

interface ClassifyResult {
  toCreate: NormalizedProduct[];
  toUpdate: Array<{
    existingId: string;
    product: NormalizedProduct;
    existing: ExistingProduct;
  }>;
  created: Array<{ id: string; tiktokUrl: string | null; name: string }>;
  errors: number;
}

type ExistingProduct = {
  id: string; tiktokUrl: string | null; name: string; shopName: string | null;
  price: number | null; commissionRate: number | null; sales7d: number | null;
  salesTotal: number | null; revenue7d: number | null; revenueTotal: number | null;
  totalKOL: number | null; totalVideos: number | null; kolOrderRate: number | null;
  productStatus: string | null; importBatchId: string | null;
};

async function classifyAndImport(
  batchId: string,
  products: NormalizedProduct[],
): Promise<ClassifyResult> {
  const allUrls = products.map((p) => p.tiktokUrl).filter(Boolean) as string[];
  const allNames = products.map((p) => p.name.toLowerCase());
  const [existingByUrl, existingByName] = await Promise.all([
    allUrls.length > 0
      ? prisma.product.findMany({
          where: { tiktokUrl: { in: allUrls } },
          select: { ...SNAPSHOT_SELECT, tiktokUrl: true, name: true, shopName: true },
        })
      : Promise.resolve([]),
    prisma.product.findMany({
      where: { name: { in: allNames, mode: "insensitive" } },
      select: { ...SNAPSHOT_SELECT, tiktokUrl: true, name: true, shopName: true },
    }),
  ]);

  const urlMap = new Map(existingByUrl.map((p) => [p.tiktokUrl!, p]));
  const nameShopMap = new Map(
    existingByName.map((p) => [
      `${p.name.toLowerCase()}|${(p.shopName || "").toLowerCase()}`,
      p,
    ]),
  );

  const toCreate: NormalizedProduct[] = [];
  const toUpdate: ClassifyResult["toUpdate"] = [];

  for (const p of products) {
    const existing =
      (p.tiktokUrl && urlMap.get(p.tiktokUrl)) ||
      nameShopMap.get(
        `${p.name.toLowerCase()}|${(p.shopName || "").toLowerCase()}`,
      ) ||
      null;
    if (existing) {
      toUpdate.push({ existingId: existing.id, product: p, existing });
    } else {
      toCreate.push(p);
    }
  }

  let errors = 0;
  let created: Array<{ id: string; tiktokUrl: string | null; name: string }> =
    [];

  if (toCreate.length > 0) {
    try {
      await prisma.product.createMany({
        data: toCreate.map((p) => buildCreateData(p, batchId)),
        skipDuplicates: true,
      });
      created = await prisma.product.findMany({
        where: { importBatchId: batchId },
        select: { id: true, tiktokUrl: true, name: true },
      });
    } catch (err) {
      console.error("Batch create failed:", err);
      errors += toCreate.length;
    }
  }

  if (toUpdate.length > 0) {
    errors += await parallelUpdateProducts(batchId, toUpdate);
  }

  return { toCreate, toUpdate, created, errors };
}

async function parallelUpdateProducts(
  batchId: string,
  toUpdate: ClassifyResult["toUpdate"],
): Promise<number> {
  const changedProducts = toUpdate.filter(({ existing, product }) =>
    hasDataChanged(existing, product),
  );

  if (changedProducts.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const changedIds = changedProducts.map(({ existingId }) => existingId);
    const existingSnaps = await prisma.productSnapshot.findMany({
      where: {
        productId: { in: changedIds },
        snapshotDate: { gte: today, lt: tomorrow },
      },
      select: { id: true, productId: true },
    });
    const snapMap = new Map(existingSnaps.map((s) => [s.productId, s.id]));

    const snapsToCreate: Array<{
      productId: string; importBatchId: string; price: number;
      commissionRate: number; sales7d: number | null; salesTotal: number | null;
      revenue7d: number | null; revenueTotal: number | null;
      totalKOL: number | null; totalVideos: number | null;
      kolOrderRate: number | null; productStatus: string | null;
    }> = [];
    const snapsToUpdate: Array<{ id: string; data: Record<string, unknown> }> =
      [];

    for (const { existingId, existing } of changedProducts) {
      const snapData = {
        importBatchId: existing.importBatchId ?? batchId,
        price: existing.price ?? 0,
        commissionRate: existing.commissionRate ?? 0,
        sales7d: existing.sales7d, salesTotal: existing.salesTotal,
        revenue7d: existing.revenue7d, revenueTotal: existing.revenueTotal,
        totalKOL: existing.totalKOL, totalVideos: existing.totalVideos,
        kolOrderRate: existing.kolOrderRate,
        productStatus: existing.productStatus,
      };
      const existingSnapId = snapMap.get(existingId);
      if (existingSnapId) {
        snapsToUpdate.push({ id: existingSnapId, data: snapData });
      } else {
        snapsToCreate.push({ productId: existingId, ...snapData });
      }
    }

    if (snapsToCreate.length > 0) {
      try {
        await prisma.productSnapshot.createMany({ data: snapsToCreate });
      } catch (err) {
        console.error("Batch snapshot create failed:", err);
      }
    }

    if (snapsToUpdate.length > 0) {
      await parallelMap(
        snapsToUpdate,
        (s) =>
          prisma.productSnapshot.update({ where: { id: s.id }, data: s.data }),
        PARALLEL,
      );
    }
  }

  const { errorCount } = await parallelMap(
    toUpdate,
    ({ existingId, product }) =>
      prisma.product.update({
        where: { id: existingId },
        data: buildUpdateData(product, batchId),
      }),
    PARALLEL,
  );

  return errorCount;
}

async function batchSyncIdentities(
  deduplicated: NormalizedProduct[],
  created: Array<{ id: string; tiktokUrl: string | null; name: string }>,
  toUpdate: ClassifyResult["toUpdate"],
): Promise<void> {
  try {
    const productInputs: Array<{
      productId: string; name: string; shopName: string | null;
      category: string; price: number; commissionRate: number;
      imageUrl: string | null; tiktokUrl: string | null;
      fastmossUrl: string | null; aiScore: number | null;
      sales7d: number | null;
    }> = [];

    const normalizedByUrl = new Map(
      deduplicated.filter((p) => p.tiktokUrl).map((p) => [p.tiktokUrl!, p]),
    );
    const normalizedByName = new Map(
      deduplicated.map((p) => [p.name.toLowerCase(), p]),
    );

    for (const c of created) {
      const norm =
        (c.tiktokUrl && normalizedByUrl.get(c.tiktokUrl)) ||
        normalizedByName.get(c.name.toLowerCase());
      if (norm) {
        productInputs.push({
          productId: c.id,
          name: norm.name, shopName: norm.shopName,
          category: norm.category, price: norm.price,
          commissionRate: norm.commissionRate, imageUrl: norm.imageUrl,
          tiktokUrl: norm.tiktokUrl, fastmossUrl: norm.fastmossUrl,
          aiScore: null, sales7d: norm.sales7d,
        });
      }
    }

    for (const u of toUpdate) {
      productInputs.push({
        productId: u.existingId,
        name: u.product.name, shopName: u.product.shopName,
        category: u.product.category, price: u.product.price,
        commissionRate: u.product.commissionRate,
        imageUrl: u.product.imageUrl, tiktokUrl: u.product.tiktokUrl,
        fastmossUrl: u.product.fastmossUrl, aiScore: null,
        sales7d: u.product.sales7d,
      });
    }

    if (productInputs.length > 0) {
      await syncIdentityBatch(productInputs);
    }
  } catch (err) {
    console.error("Batch identity sync error:", err);
  }
}
