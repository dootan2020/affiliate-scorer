// Phase 2: Sync product → product_identity khi upload FastMoss
// Tạo hoặc cập nhật identity cho mỗi product imported

import { prisma } from "@/lib/db";
import { canonicalizeUrl, generateFingerprint } from "@/lib/utils/canonical-url";
import { classifyProductDelta } from "./delta-classification";
import type { DeltaType } from "./delta-classification";
import { dispatchRescore } from "@/lib/scoring/rescore-dispatcher";

interface SyncInput {
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

/** Sync 1 product → product_identity. Trả về { identityId, delta } */
export async function syncProductIdentity(input: SyncInput): Promise<{ identityId: string; delta: DeltaType }> {
  const canonical = input.tiktokUrl ? canonicalizeUrl(input.tiktokUrl) : null;
  const fingerprint = generateFingerprint(canonical, input.name, input.shopName);

  // Parse external ID
  const externalIdMatch = input.tiktokUrl?.match(/product\/(\d+)/);
  const externalId = externalIdMatch ? externalIdMatch[1] : null;

  // Check nếu product đã link tới identity
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { identityId: true },
  });

  if (product?.identityId) {
    // Đã có identity → compute delta + update metadata
    // Fix C6: Don't overwrite marketScore — let score-identity.ts handle it exclusively
    const delta = await computeDelta(input.productId, input.sales7d);
    const updateData: Record<string, unknown> = {
      title: input.name,
      shopName: input.shopName,
      category: input.category,
      price: Math.round(input.price),
      commissionRate: input.commissionRate,
      imageUrl: input.imageUrl,
      deltaType: delta,
      lastSeenAt: new Date(),
    };
    // Fix C7: Only write marketScore when we have a real value (match batch behavior)
    if (input.aiScore != null) updateData.marketScore = input.aiScore;
    await prisma.productIdentity.update({
      where: { id: product.identityId },
      data: updateData,
    });

    // Fix H9: SURGE re-import → trigger formula rescore for this identity
    if (delta === "SURGE") {
      dispatchRescore({
        type: "formula_only",
        scope: "identityIds",
        identityIds: [product.identityId],
        reason: "re-import-surge",
      }).catch((err) => console.error("[sync-identity] surge rescore failed:", err));
    }

    return { identityId: product.identityId, delta };
  }

  // Tìm identity bằng canonical URL
  let identity = canonical
    ? await prisma.productIdentity.findUnique({ where: { canonicalUrl: canonical } })
    : null;

  // Fallback: tìm bằng fingerprint
  if (!identity) {
    identity = await prisma.productIdentity.findUnique({ where: { fingerprintHash: fingerprint } });
  }

  if (identity) {
    // Đã có identity → link product + compute delta + update
    await prisma.product.update({
      where: { id: input.productId },
      data: { identityId: identity.id },
    });
    const delta = await computeDelta(input.productId, input.sales7d);
    // Fix C6: Don't overwrite marketScore — let score-identity.ts handle it exclusively
    const updateData2: Record<string, unknown> = {
      title: input.name,
      shopName: input.shopName,
      category: input.category,
      price: Math.round(input.price),
      commissionRate: input.commissionRate,
      imageUrl: input.imageUrl,
      deltaType: delta,
      lastSeenAt: new Date(),
    };
    if (input.aiScore != null) updateData2.marketScore = input.aiScore;
    await prisma.productIdentity.update({
      where: { id: identity.id },
      data: updateData2,
    });
    return { identityId: identity.id, delta };
  }

  // Tạo mới → delta = NEW
  const newIdentity = await prisma.productIdentity.create({
    data: {
      canonicalUrl: canonical,
      fingerprintHash: fingerprint,
      productIdExternal: externalId,
      title: input.name,
      shopName: input.shopName,
      category: input.category,
      price: Math.round(input.price),
      commissionRate: input.commissionRate,
      imageUrl: input.imageUrl,
      // Fix H12: aiScore is always null at import time — always "enriched"
      inboxState: "enriched",
      // Fix C6: Only set marketScore if we have a real value
      ...(input.aiScore != null ? { marketScore: input.aiScore } : {}),
      deltaType: "NEW",
    },
  });

  // Link product → identity
  await prisma.product.update({
    where: { id: input.productId },
    data: { identityId: newIdentity.id },
  });

  // Thêm URLs
  if (input.tiktokUrl) {
    await prisma.productUrl.create({
      data: { productIdentityId: newIdentity.id, url: input.tiktokUrl, urlType: "tiktokshop" },
    }).catch(() => { /* URL đã tồn tại */ });
  }
  if (input.fastmossUrl) {
    await prisma.productUrl.create({
      data: { productIdentityId: newIdentity.id, url: input.fastmossUrl, urlType: "fastmoss" },
    }).catch(() => { /* URL đã tồn tại */ });
  }

  return { identityId: newIdentity.id, delta: "NEW" as DeltaType };
}

/** Tính delta từ snapshot history */
async function computeDelta(productId: string, currentSales7d: number | null): Promise<DeltaType> {
  const snapshots = await prisma.productSnapshot.findMany({
    where: { productId },
    orderBy: { snapshotDate: "desc" },
    take: 3,
    select: { sales7d: true, revenue7d: true, snapshotDate: true },
  });

  return classifyProductDelta(currentSales7d, null, snapshots);
}
