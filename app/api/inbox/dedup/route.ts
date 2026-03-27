// POST /api/inbox/dedup — batch link unlinked ProductIdentity with matching Products
// Call multiple times until linked=0 + merged=0
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const BATCH_LIMIT = 50; // Process max 50 per call to stay under Vercel timeout

export async function POST(): Promise<NextResponse> {
  try {
    let linked = 0;
    let merged = 0;
    const errors: string[] = [];

    // --- Step 1: Link Products → matching ProductIdentity (by title+shopName) ---
    const unlinkedProducts = await prisma.product.findMany({
      where: { identityId: null, shopName: { not: null } },
      select: { id: true, name: true, shopName: true },
      take: BATCH_LIMIT,
    });

    for (const product of unlinkedProducts) {
      if (!product.name || !product.shopName) continue;
      try {
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
        }
      } catch (err) {
        errors.push(`link ${product.id}: ${String(err).slice(0, 80)}`);
      }
    }

    // --- Step 2: Find and merge duplicate ProductIdentity (same title+shop) ---
    const dupGroups = await prisma.$queryRaw<
      Array<{ title: string; shop_name: string }>
    >`
      SELECT title, "shopName" as shop_name
      FROM "ProductIdentity"
      WHERE title IS NOT NULL AND "shopName" IS NOT NULL
      GROUP BY title, "shopName"
      HAVING COUNT(*) > 1
      LIMIT ${BATCH_LIMIT}
    `;

    for (const group of dupGroups) {
      try {
        const identities = await prisma.productIdentity.findMany({
          where: { title: group.title, shopName: group.shop_name },
          select: {
            id: true,
            fastmossProductId: true,
            day28SoldCount: true,
            relateAuthorCount: true,
            relateVideoCount: true,
            viralIndex: true,
            popularityIndex: true,
            fastmossCategoryId: true,
            fastmossCategory: true,
            imageUrl: true,
            countryRank: true,
            categoryRank: true,
            product: { select: { id: true } },
          },
          orderBy: { createdAt: "asc" },
        });

        // Primary: linked to Product, or oldest
        const primary =
          identities.find((i) => i.product !== null) ?? identities[0];
        const dups = identities.filter(
          (i) => i.id !== primary.id && !i.product
        );

        for (const dup of dups) {
          // Merge FastMoss data to primary
          const updates: Record<string, unknown> = {};
          const fields = [
            "day28SoldCount",
            "relateAuthorCount",
            "relateVideoCount",
            "viralIndex",
            "popularityIndex",
            "fastmossCategoryId",
            "fastmossCategory",
            "imageUrl",
            "countryRank",
            "categoryRank",
          ] as const;
          for (const f of fields) {
            if (!primary[f] && dup[f]) updates[f] = dup[f];
          }
          // Handle fastmossProductId specially (unique field)
          if (!primary.fastmossProductId && dup.fastmossProductId) {
            await prisma.productIdentity.update({
              where: { id: dup.id },
              data: { fastmossProductId: null },
            });
            updates.fastmossProductId = dup.fastmossProductId;
          }

          if (Object.keys(updates).length > 0) {
            await prisma.productIdentity.update({
              where: { id: primary.id },
              data: updates,
            });
          }

          // Reassign relations
          await prisma.inboxItem.updateMany({
            where: { productIdentityId: dup.id },
            data: { productIdentityId: primary.id },
          });
          await prisma.productUrl.updateMany({
            where: { productIdentityId: dup.id },
            data: { productIdentityId: primary.id },
          });

          // Clear unique fields then delete
          await prisma.productIdentity.update({
            where: { id: dup.id },
            data: {
              fastmossProductId: null,
              fingerprintHash: null,
              canonicalUrl: null,
            },
          });
          await prisma.productIdentity.delete({ where: { id: dup.id } });
          merged++;
        }
      } catch (err) {
        errors.push(
          `merge ${group.title}: ${String(err).slice(0, 80)}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      linked,
      merged,
      scannedProducts: unlinkedProducts.length,
      dupGroupsFound: dupGroups.length,
      errors: errors.length > 0 ? errors : undefined,
      done: linked === 0 && merged === 0 && unlinkedProducts.length === 0 && dupGroups.length === 0,
    });
  } catch (error) {
    console.error("[inbox/dedup] error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
