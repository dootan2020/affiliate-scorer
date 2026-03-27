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

      for (const dupItem of duplicates) {
        try {
          // Skip if this duplicate is also linked to a different Product
          if (dupItem.product) continue;

          // Verify dup still exists (may have been deleted in prior iteration)
          const exists = await prisma.productIdentity.findUnique({
            where: { id: dupItem.id },
            select: { id: true },
          });
          if (!exists) continue;

          // Copy FastMoss data to primary if primary is missing it
          const updates: Record<string, unknown> = {};
          if (!primary.fastmossProductId && dupItem.fastmossProductId) {
            await prisma.productIdentity.update({
              where: { id: dupItem.id },
              data: { fastmossProductId: null },
            });
            updates.fastmossProductId = dupItem.fastmossProductId;
          }
          if (!primary.day28SoldCount && dupItem.day28SoldCount)
            updates.day28SoldCount = dupItem.day28SoldCount;
          if (!primary.relateAuthorCount && dupItem.relateAuthorCount)
            updates.relateAuthorCount = dupItem.relateAuthorCount;
          if (!primary.relateVideoCount && dupItem.relateVideoCount)
            updates.relateVideoCount = dupItem.relateVideoCount;
          if (!primary.viralIndex && dupItem.viralIndex)
            updates.viralIndex = dupItem.viralIndex;
          if (!primary.popularityIndex && dupItem.popularityIndex)
            updates.popularityIndex = dupItem.popularityIndex;
          if (!primary.fastmossCategoryId && dupItem.fastmossCategoryId)
            updates.fastmossCategoryId = dupItem.fastmossCategoryId;
          if (!primary.fastmossCategory && dupItem.fastmossCategory)
            updates.fastmossCategory = dupItem.fastmossCategory;
          if (!primary.imageUrl && dupItem.imageUrl)
            updates.imageUrl = dupItem.imageUrl;
          if (!primary.countryRank && dupItem.countryRank)
            updates.countryRank = dupItem.countryRank;
          if (!primary.categoryRank && dupItem.categoryRank)
            updates.categoryRank = dupItem.categoryRank;

          if (Object.keys(updates).length > 0) {
            await prisma.productIdentity.update({
              where: { id: primary.id },
              data: updates,
            });
          }

          // Reassign any InboxItems pointing to the duplicate
          await prisma.inboxItem.updateMany({
            where: { productIdentityId: dupItem.id },
            data: { productIdentityId: primary.id },
          });

          // Reassign any ProductUrls
          await prisma.productUrl.updateMany({
            where: { productIdentityId: dupItem.id },
            data: { productIdentityId: primary.id },
          });

          // Clear unique fields on dup before delete
          await prisma.productIdentity.update({
            where: { id: dupItem.id },
            data: {
              fastmossProductId: null,
              fingerprintHash: null,
              canonicalUrl: null,
            },
          });

          // Delete the duplicate
          await prisma.productIdentity.delete({ where: { id: dupItem.id } });
          merged++;
        } catch (err) {
          console.warn(`[dedup] Skip dup ${dupItem.id}:`, err);
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
