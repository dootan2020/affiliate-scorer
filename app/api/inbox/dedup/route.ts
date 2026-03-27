// POST /api/inbox/dedup — batch link unlinked ProductIdentity with matching Products
// Also merges duplicate ProductIdentity records (FastMoss + original import)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(): Promise<NextResponse> {
  try {
    let linked = 0;
    let merged = 0;

    // --- Step 1: Link Products that have no identityId to matching ProductIdentity ---
    // Find all Products without a linked ProductIdentity
    const unlinkedProducts = await prisma.product.findMany({
      where: { identityId: null },
      select: { id: true, name: true, shopName: true, tiktokUrl: true },
    });

    for (const product of unlinkedProducts) {
      // Strategy 1: Match by tiktokUrl
      if (product.tiktokUrl) {
        const match = await prisma.productIdentity.findFirst({
          where: {
            urls: { some: { url: product.tiktokUrl } },
            product: null, // not already linked
          },
          select: { id: true },
        });
        if (match) {
          await prisma.product.update({
            where: { id: product.id },
            data: { identityId: match.id },
          });
          linked++;
          continue;
        }
      }

      // Strategy 2: Match by title + shopName
      if (product.name && product.shopName) {
        const match = await prisma.productIdentity.findFirst({
          where: {
            title: product.name,
            shopName: product.shopName,
            product: null,
          },
          select: { id: true },
        });
        if (match) {
          await prisma.product.update({
            where: { id: product.id },
            data: { identityId: match.id },
          });
          linked++;
          continue;
        }
      }
    }

    // --- Step 2: Merge duplicate ProductIdentity records ---
    // Find ProductIdentity records that share the same title+shopName
    // but one is linked to a Product and the other isn't
    const duplicateIdentities = await prisma.$queryRaw<
      Array<{ title: string; shop_name: string; cnt: bigint }>
    >`
      SELECT title, "shopName" as shop_name, COUNT(*) as cnt
      FROM "ProductIdentity"
      WHERE title IS NOT NULL AND "shopName" IS NOT NULL
      GROUP BY title, "shopName"
      HAVING COUNT(*) > 1
    `;

    for (const dup of duplicateIdentities) {
      const identities = await prisma.productIdentity.findMany({
        where: { title: dup.title, shopName: dup.shop_name },
        include: { product: { select: { id: true } } },
        orderBy: { createdAt: "asc" },
      });

      // Find the "primary" one — either linked to Product, or the oldest
      const primary =
        identities.find((i) => i.product !== null) ?? identities[0];
      const duplicates = identities.filter((i) => i.id !== primary.id);

      for (const dup of duplicates) {
        // Skip if this duplicate is also linked to a different Product
        if (dup.product) continue;

        // Copy FastMoss data to primary if primary is missing it
        const updates: Record<string, unknown> = {};
        if (!primary.fastmossProductId && dup.fastmossProductId)
          updates.fastmossProductId = dup.fastmossProductId;
        if (!primary.day28SoldCount && dup.day28SoldCount)
          updates.day28SoldCount = dup.day28SoldCount;
        if (!primary.relateAuthorCount && dup.relateAuthorCount)
          updates.relateAuthorCount = dup.relateAuthorCount;
        if (!primary.relateVideoCount && dup.relateVideoCount)
          updates.relateVideoCount = dup.relateVideoCount;
        if (!primary.viralIndex && dup.viralIndex)
          updates.viralIndex = dup.viralIndex;
        if (!primary.popularityIndex && dup.popularityIndex)
          updates.popularityIndex = dup.popularityIndex;
        if (!primary.fastmossCategoryId && dup.fastmossCategoryId)
          updates.fastmossCategoryId = dup.fastmossCategoryId;
        if (!primary.fastmossCategory && dup.fastmossCategory)
          updates.fastmossCategory = dup.fastmossCategory;
        if (!primary.imageUrl && dup.imageUrl)
          updates.imageUrl = dup.imageUrl;
        if (!primary.countryRank && dup.countryRank)
          updates.countryRank = dup.countryRank;
        if (!primary.categoryRank && dup.categoryRank)
          updates.categoryRank = dup.categoryRank;

        if (Object.keys(updates).length > 0) {
          await prisma.productIdentity.update({
            where: { id: primary.id },
            data: updates,
          });
        }

        // Reassign any InboxItems pointing to the duplicate
        await prisma.inboxItem.updateMany({
          where: { productIdentityId: dup.id },
          data: { productIdentityId: primary.id },
        });

        // Reassign any ProductUrls
        await prisma.productUrl.updateMany({
          where: { productIdentityId: dup.id },
          data: { productIdentityId: primary.id },
        });

        // Delete the duplicate
        try {
          await prisma.productIdentity.delete({ where: { id: dup.id } });
          merged++;
        } catch (err) {
          // If delete fails due to remaining relations, skip
          console.warn(`[dedup] Could not delete ${dup.id}:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      linked,
      merged,
      scanned: unlinkedProducts.length,
      duplicateGroups: duplicateIdentities.length,
    });
  } catch (error) {
    console.error("[inbox/dedup] error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
