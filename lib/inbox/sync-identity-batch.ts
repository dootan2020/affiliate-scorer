// Batch identity sync: ~10 queries instead of ~1,200 for 300 products.
// Keeps single-product sync-identity.ts for use elsewhere.
import { prisma } from "@/lib/db";
import { canonicalizeUrl, generateFingerprint } from "@/lib/utils/canonical-url";
import { classifyProductDelta } from "./delta-classification";
import type { DeltaType } from "./delta-classification";

interface BatchSyncInput {
  productId: string;
  name: string;
  shopName: string | null;
  category: string;
  price: number;
  commissionRate: number;
  imageUrl: string | null;
  tiktokUrl: string | null;
  fastmossUrl: string | null;
  aiScore: number | null;
  sales7d: number | null;
}

const UPDATE_CHUNK = 50;

/** Sync N products → identities in batch. Returns count synced. */
export async function syncIdentityBatch(inputs: BatchSyncInput[]): Promise<number> {
  if (inputs.length === 0) return 0;

  // Step 1: Compute canonical URLs and fingerprints
  const enriched = inputs.map((input) => {
    const canonical = input.tiktokUrl ? canonicalizeUrl(input.tiktokUrl) : null;
    const fingerprint = generateFingerprint(canonical, input.name, input.shopName);
    const externalIdMatch = input.tiktokUrl?.match(/product\/(\d+)/);
    const externalId = externalIdMatch ? externalIdMatch[1] : null;
    return { ...input, canonical, fingerprint, externalId };
  });

  // Step 2: Check which products already have identities linked
  const productIds = enriched.map((e) => e.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, identityId: true },
  });
  const productIdentityMap = new Map(products.map((p) => [p.id, p.identityId]));

  // Step 3: Pre-fetch existing identities by canonicalUrl and fingerprintHash
  const allCanonicals = enriched
    .map((e) => e.canonical)
    .filter((c): c is string => c != null);
  const allFingerprints = enriched.map((e) => e.fingerprint);

  const [identitiesByUrl, identitiesByFp] = await Promise.all([
    allCanonicals.length > 0
      ? prisma.productIdentity.findMany({
          where: { canonicalUrl: { in: allCanonicals } },
          select: { id: true, canonicalUrl: true },
        })
      : Promise.resolve([]),
    prisma.productIdentity.findMany({
      where: { fingerprintHash: { in: allFingerprints } },
      select: { id: true, fingerprintHash: true },
    }),
  ]);

  const urlToIdentity = new Map(identitiesByUrl.map((i) => [i.canonicalUrl!, i.id]));
  const fpToIdentity = new Map(identitiesByFp.map((i) => [i.fingerprintHash!, i.id]));

  // Step 4: Classify each product
  const alreadyLinked: typeof enriched = [];
  const matchFound: Array<typeof enriched[0] & { identityId: string }> = [];
  const needsCreating: typeof enriched = [];

  for (const item of enriched) {
    const existingIdentityId = productIdentityMap.get(item.productId);
    if (existingIdentityId) {
      alreadyLinked.push(item);
      continue;
    }

    const foundId =
      (item.canonical && urlToIdentity.get(item.canonical)) ||
      fpToIdentity.get(item.fingerprint) ||
      null;

    if (foundId) {
      matchFound.push({ ...item, identityId: foundId });
    } else {
      needsCreating.push(item);
    }
  }

  // Step 5: Batch create new identities
  if (needsCreating.length > 0) {
    await prisma.productIdentity.createMany({
      data: needsCreating.map((item) => ({
        canonicalUrl: item.canonical,
        fingerprintHash: item.fingerprint,
        productIdExternal: item.externalId,
        title: item.name,
        shopName: item.shopName,
        category: item.category,
        price: Math.round(item.price),
        commissionRate: item.commissionRate,
        imageUrl: item.imageUrl,
        inboxState: item.aiScore ? "scored" : "enriched",
        marketScore: item.aiScore,
        deltaType: "NEW",
      })),
      skipDuplicates: true,
    });

    // Fetch created identity IDs to link products
    const createdCanonicals = needsCreating
      .map((n) => n.canonical)
      .filter((c): c is string => c != null);
    const createdFingerprints = needsCreating.map((n) => n.fingerprint);

    const [newByUrl, newByFp] = await Promise.all([
      createdCanonicals.length > 0
        ? prisma.productIdentity.findMany({
            where: { canonicalUrl: { in: createdCanonicals } },
            select: { id: true, canonicalUrl: true, fingerprintHash: true },
          })
        : Promise.resolve([]),
      prisma.productIdentity.findMany({
        where: { fingerprintHash: { in: createdFingerprints } },
        select: { id: true, canonicalUrl: true, fingerprintHash: true },
      }),
    ]);

    // Build lookup for newly created
    const newUrlMap = new Map(newByUrl.map((i) => [i.canonicalUrl!, i.id]));
    const newFpMap = new Map(newByFp.map((i) => [i.fingerprintHash!, i.id]));

    for (const item of needsCreating) {
      const identityId =
        (item.canonical && newUrlMap.get(item.canonical)) ||
        newFpMap.get(item.fingerprint);
      if (identityId) {
        matchFound.push({ ...item, identityId });
      }
    }
  }

  // Step 6: Batch link products → identities
  // Use parallel standalone updates (no $transaction) for PgBouncer compatibility — avoids P2028 timeout
  if (matchFound.length > 0) {
    for (let i = 0; i < matchFound.length; i += UPDATE_CHUNK) {
      const chunk = matchFound.slice(i, i + UPDATE_CHUNK);
      await Promise.allSettled(
        chunk.map(({ productId, identityId }) =>
          prisma.product.update({
            where: { id: productId },
            data: { identityId },
          }),
        ),
      );
    }
  }

  // Step 7: Batch create productUrls
  const urlsToCreate: Array<{ productIdentityId: string; url: string; urlType: string }> = [];

  for (const item of matchFound) {
    if (item.tiktokUrl) {
      urlsToCreate.push({
        productIdentityId: item.identityId,
        url: item.tiktokUrl,
        urlType: "tiktokshop",
      });
    }
    if (item.fastmossUrl) {
      urlsToCreate.push({
        productIdentityId: item.identityId,
        url: item.fastmossUrl,
        urlType: "fastmoss",
      });
    }
  }

  if (urlsToCreate.length > 0) {
    await prisma.productUrl.createMany({
      data: urlsToCreate,
      skipDuplicates: true,
    });
  }

  // Step 8: Batch compute deltas
  const allLinkedProductIds = [
    ...alreadyLinked.map((a) => a.productId),
    ...matchFound.map((m) => m.productId),
  ];

  const snapshots = allLinkedProductIds.length > 0
    ? await prisma.productSnapshot.findMany({
        where: { productId: { in: allLinkedProductIds } },
        orderBy: { snapshotDate: "desc" },
        select: { productId: true, sales7d: true, revenue7d: true, snapshotDate: true },
      })
    : [];

  // Group snapshots by productId
  const snapshotsByProduct = new Map<string, typeof snapshots>();
  for (const snap of snapshots) {
    const existing = snapshotsByProduct.get(snap.productId) || [];
    existing.push(snap);
    snapshotsByProduct.set(snap.productId, existing);
  }

  // Compute deltas in memory
  const deltaMap = new Map<string, DeltaType>();
  const inputByProductId = new Map(enriched.map((e) => [e.productId, e]));

  for (const productId of allLinkedProductIds) {
    const input = inputByProductId.get(productId);
    const productSnapshots = snapshotsByProduct.get(productId) || [];
    const delta = classifyProductDelta(
      input?.sales7d ?? null,
      null,
      productSnapshots.slice(0, 3),
    );
    deltaMap.set(productId, delta);
  }

  // Step 9: Batch update identity metadata
  const identityUpdates: Array<{
    identityId: string;
    data: Record<string, unknown>;
  }> = [];

  for (const item of alreadyLinked) {
    const identityId = productIdentityMap.get(item.productId);
    if (!identityId) continue;
    const data: Record<string, unknown> = {
      title: item.name,
      shopName: item.shopName,
      category: item.category,
      price: Math.round(item.price),
      commissionRate: item.commissionRate,
      imageUrl: item.imageUrl,
      deltaType: deltaMap.get(item.productId) ?? "STABLE",
      lastSeenAt: new Date(),
    };
    // Only overwrite marketScore when we have a real value — preserve previous scoring
    if (item.aiScore != null) data.marketScore = item.aiScore;
    identityUpdates.push({ identityId, data });
  }

  for (const item of matchFound) {
    const data: Record<string, unknown> = {
      title: item.name,
      shopName: item.shopName,
      category: item.category,
      price: Math.round(item.price),
      commissionRate: item.commissionRate,
      imageUrl: item.imageUrl,
      deltaType: deltaMap.get(item.productId) ?? "NEW",
      lastSeenAt: new Date(),
    };
    if (item.aiScore != null) data.marketScore = item.aiScore;
    identityUpdates.push({ identityId: item.identityId, data });
  }

  // Deduplicate by identityId (keep last)
  const dedupedUpdates = new Map(identityUpdates.map((u) => [u.identityId, u]));
  const finalUpdates = Array.from(dedupedUpdates.values());

  for (let i = 0; i < finalUpdates.length; i += UPDATE_CHUNK) {
    const chunk = finalUpdates.slice(i, i + UPDATE_CHUNK);
    // Parallel standalone updates — no $transaction to avoid P2028 under PgBouncer
    await Promise.allSettled(
      chunk.map(({ identityId, data }) =>
        prisma.productIdentity.update({ where: { id: identityId }, data }),
      ),
    );
  }

  return enriched.length;
}
