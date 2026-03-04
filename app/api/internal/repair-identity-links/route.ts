// POST /api/internal/repair-identity-links
// One-time repair: fix Product.identityId=null for products whose identities exist
// but failed to link during import (due to $transaction P2028 under PgBouncer).
// Looks up identities via ProductUrl (canonical URL match) and re-links.
// After linking, runs syncIdentityScores to propagate aiScore to ProductIdentity.
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncIdentityScores } from "@/lib/services/score-identity";

const PARALLEL = 20;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { batchId?: string };

    // Find products with no identityId — optionally filtered by batchId
    const where = body.batchId
      ? { importBatchId: body.batchId, identityId: null }
      : { identityId: null };

    const unlinked = await prisma.product.findMany({
      where,
      select: { id: true, tiktokUrl: true },
    });

    if (unlinked.length === 0) {
      return NextResponse.json({ repaired: 0, message: "No unlinked products found" });
    }

    // Look up identities via ProductUrl
    const urlsToSearch = unlinked
      .map((p) => p.tiktokUrl)
      .filter((u): u is string => u != null);

    if (urlsToSearch.length === 0) {
      return NextResponse.json({ repaired: 0, message: "No tiktokUrls on unlinked products" });
    }

    const productUrls = await prisma.productUrl.findMany({
      where: { url: { in: urlsToSearch } },
      select: { url: true, productIdentityId: true },
    });

    const urlToIdentity = new Map(productUrls.map((u) => [u.url, u.productIdentityId]));

    const repairs: Array<{ productId: string; identityId: string }> = [];
    for (const p of unlinked) {
      const identityId = p.tiktokUrl ? urlToIdentity.get(p.tiktokUrl) : null;
      if (identityId) {
        repairs.push({ productId: p.id, identityId });
      }
    }

    if (repairs.length === 0) {
      return NextResponse.json({ repaired: 0, message: "No identity matches found via ProductUrl" });
    }

    // Re-link products → identities
    for (let i = 0; i < repairs.length; i += PARALLEL) {
      const chunk = repairs.slice(i, i + PARALLEL);
      await Promise.allSettled(
        chunk.map(({ productId, identityId }) =>
          prisma.product.update({
            where: { id: productId },
            data: { identityId },
          }),
        ),
      );
    }

    // Sync identity scores to propagate aiScore → marketScore/combinedScore
    const identityIds = [...new Set(repairs.map((r) => r.identityId))];
    const synced = await syncIdentityScores(identityIds);

    return NextResponse.json({
      repaired: repairs.length,
      identitiesSynced: synced,
      message: `Repaired ${repairs.length} product→identity links, synced ${synced} identity scores`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[repair-identity-links] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
