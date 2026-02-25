// Phase 2: POST /api/inbox/migrate — one-time migration
// Tạo product_identities từ products hiện tại (chạy 1 lần)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canonicalizeUrl, generateFingerprint } from "@/lib/utils/canonical-url";

export async function POST(): Promise<NextResponse> {
  try {
    // Lấy tất cả products chưa có identityId
    const products = await prisma.product.findMany({
      where: { identityId: null },
      select: {
        id: true,
        name: true,
        shopName: true,
        category: true,
        price: true,
        commissionRate: true,
        imageUrl: true,
        tiktokUrl: true,
        fastmossUrl: true,
        aiScore: true,
        sales7d: true,
        totalKOL: true,
      },
    });

    if (products.length === 0) {
      return NextResponse.json({ message: "Tất cả sản phẩm đã có identity", migrated: 0 });
    }

    let migrated = 0;
    let skipped = 0;

    for (const p of products) {
      try {
        // Xác định canonical URL
        const canonical = p.tiktokUrl ? canonicalizeUrl(p.tiktokUrl) : null;

        // Check nếu đã có identity với canonical URL này
        if (canonical) {
          const existing = await prisma.productIdentity.findUnique({
            where: { canonicalUrl: canonical },
          });
          if (existing) {
            // Link product → existing identity
            await prisma.product.update({
              where: { id: p.id },
              data: { identityId: existing.id },
            });
            migrated++;
            continue;
          }
        }

        // Tạo identity mới
        const fingerprint = generateFingerprint(canonical, p.name, p.shopName);

        // Check fingerprint trùng
        const existingByFp = await prisma.productIdentity.findUnique({
          where: { fingerprintHash: fingerprint },
        });
        if (existingByFp) {
          await prisma.product.update({
            where: { id: p.id },
            data: { identityId: existingByFp.id },
          });
          migrated++;
          continue;
        }

        // Parse external ID từ tiktokUrl
        const externalIdMatch = p.tiktokUrl?.match(/product\/(\d+)/);
        const externalId = externalIdMatch ? externalIdMatch[1] : null;

        const identity = await prisma.productIdentity.create({
          data: {
            canonicalUrl: canonical,
            fingerprintHash: fingerprint,
            productIdExternal: externalId,
            title: p.name,
            shopName: p.shopName,
            category: p.category,
            price: Math.round(p.price),
            commissionRate: p.commissionRate,
            imageUrl: p.imageUrl,
            // Nếu đã có aiScore → state = scored
            inboxState: p.aiScore ? "scored" : "enriched",
            marketScore: p.aiScore,
          },
        });

        // Link product → identity
        await prisma.product.update({
          where: { id: p.id },
          data: { identityId: identity.id },
        });

        // Thêm URLs
        if (p.tiktokUrl) {
          await prisma.productUrl.create({
            data: {
              productIdentityId: identity.id,
              url: p.tiktokUrl,
              urlType: "tiktokshop",
            },
          }).catch(() => { /* URL đã tồn tại — ignore */ });
        }
        if (p.fastmossUrl) {
          await prisma.productUrl.create({
            data: {
              productIdentityId: identity.id,
              url: p.fastmossUrl,
              urlType: "fastmoss",
            },
          }).catch(() => { /* URL đã tồn tại — ignore */ });
        }

        migrated++;
      } catch (err) {
        console.error(`Migration error for product ${p.id}:`, err);
        skipped++;
      }
    }

    return NextResponse.json({
      message: `Đã migrate ${migrated} sản phẩm, bỏ qua ${skipped}`,
      migrated,
      skipped,
      total: products.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
