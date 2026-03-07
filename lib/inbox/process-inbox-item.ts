// Phase 2: Xử lý từng link paste vào → dedupe → tạo identity/inbox item

import { prisma } from "@/lib/db";
import type { ParsedLink } from "@/lib/parsers/link-parser";
import { isProductLink } from "@/lib/parsers/link-parser";
import { canonicalizeUrl, generateFingerprint } from "@/lib/utils/canonical-url";

export interface ProcessResult {
  rawUrl: string;
  detectedType: string;
  status: "new_product" | "duplicate" | "video" | "shop" | "failed";
  identityId: string | null;
  title: string | null;
}

/** Xử lý 1 parsed link: dedupe → tạo identity + inbox item */
export async function processInboxItem(parsed: ParsedLink): Promise<ProcessResult> {
  const base = {
    rawUrl: parsed.originalUrl,
    detectedType: parsed.type === "fastmoss_product" ? "product" : parsed.type === "fastmoss_shop" ? "shop" : parsed.type,
  };

  try {
    // Video và shop → chỉ ghi inbox item, không tạo identity
    if (parsed.type === "video" || parsed.type === "shop" || parsed.type === "fastmoss_shop") {
      await prisma.inboxItem.create({
        data: {
          rawUrl: parsed.originalUrl,
          detectedType: base.detectedType,
          status: "matched",
        },
      });
      return { ...base, status: parsed.type === "video" ? "video" : "shop", identityId: null, title: null };
    }

    // Product links → check dedupe
    if (isProductLink(parsed.type) || parsed.type === "unknown") {
      const canonical = parsed.canonicalUrl ? canonicalizeUrl(parsed.canonicalUrl) : null;

      // 1) Check canonical URL match
      if (canonical) {
        const existing = await prisma.productIdentity.findUnique({
          where: { canonicalUrl: canonical },
          select: { id: true, title: true },
        });
        if (existing) {
          await prisma.productIdentity.update({
            where: { id: existing.id },
            data: { lastSeenAt: new Date() },
          });
          // Thêm URL mới nếu chưa có
          await addUrlIfNew(existing.id, parsed.originalUrl, parsed.type);
          await prisma.inboxItem.create({
            data: {
              rawUrl: parsed.originalUrl,
              detectedType: base.detectedType,
              productIdentityId: existing.id,
              status: "duplicate",
            },
          });
          return { ...base, status: "duplicate", identityId: existing.id, title: existing.title };
        }
      }

      // 2) Check external ID match (product trong products table cũ)
      if (parsed.externalId) {
        const existingByExternal = await prisma.productIdentity.findFirst({
          where: { productIdExternal: parsed.externalId },
          select: { id: true, title: true },
        });
        if (existingByExternal) {
          await prisma.productIdentity.update({
            where: { id: existingByExternal.id },
            data: { lastSeenAt: new Date() },
          });
          await addUrlIfNew(existingByExternal.id, parsed.originalUrl, parsed.type);
          await prisma.inboxItem.create({
            data: {
              rawUrl: parsed.originalUrl,
              detectedType: base.detectedType,
              productIdentityId: existingByExternal.id,
              status: "duplicate",
            },
          });
          return { ...base, status: "duplicate", identityId: existingByExternal.id, title: existingByExternal.title };
        }
      }

      // 3) Mới → tạo product_identity (upsert to prevent race condition duplicates)
      const fingerprint = generateFingerprint(canonical, null, null);
      if (canonical) {
        // Use upsert on canonicalUrl to prevent duplicate when concurrent requests
        const identity = await prisma.productIdentity.upsert({
          where: { canonicalUrl: canonical },
          update: { lastSeenAt: new Date() },
          create: {
            canonicalUrl: canonical,
            productIdExternal: parsed.externalId,
            fingerprintHash: fingerprint,
            inboxState: "new",
          },
        });
        // Check if this was actually an existing record (upsert hit update path)
        const isExisting = identity.updatedAt > identity.createdAt;
        if (isExisting) {
          await addUrlIfNew(identity.id, parsed.originalUrl, parsed.type);
          await prisma.inboxItem.create({
            data: {
              rawUrl: parsed.originalUrl,
              detectedType: base.detectedType,
              productIdentityId: identity.id,
              status: "duplicate",
            },
          });
          return { ...base, status: "duplicate", identityId: identity.id, title: identity.title };
        }

        await addUrlIfNew(identity.id, parsed.originalUrl, parsed.type);
        await prisma.inboxItem.create({
          data: {
            rawUrl: parsed.originalUrl,
            detectedType: base.detectedType,
            productIdentityId: identity.id,
            status: "new_product",
          },
        });
        return { ...base, status: "new_product", identityId: identity.id, title: null };
      }

      // No canonical URL — use fingerprint as unique key
      const identity = await prisma.productIdentity.upsert({
        where: { fingerprintHash: fingerprint },
        update: { lastSeenAt: new Date() },
        create: {
          canonicalUrl: canonical,
          productIdExternal: parsed.externalId,
          fingerprintHash: fingerprint,
          inboxState: "new",
        },
      });
      const isExisting = identity.updatedAt > identity.createdAt;
      if (isExisting) {
        await addUrlIfNew(identity.id, parsed.originalUrl, parsed.type);
        await prisma.inboxItem.create({
          data: {
            rawUrl: parsed.originalUrl,
            detectedType: base.detectedType,
            productIdentityId: identity.id,
            status: "duplicate",
          },
        });
        return { ...base, status: "duplicate", identityId: identity.id, title: identity.title };
      }

      await addUrlIfNew(identity.id, parsed.originalUrl, parsed.type);

      await prisma.inboxItem.create({
        data: {
          rawUrl: parsed.originalUrl,
          detectedType: base.detectedType,
          productIdentityId: identity.id,
          status: "new_product",
        },
      });

      return { ...base, status: "new_product", identityId: identity.id, title: null };
    }

    // Unknown type
    await prisma.inboxItem.create({
      data: {
        rawUrl: parsed.originalUrl,
        detectedType: "unknown",
        status: "failed",
      },
    });
    return { ...base, status: "failed", identityId: null, title: null };
  } catch (error) {
    console.error("processInboxItem error:", error);
    return { ...base, status: "failed", identityId: null, title: null };
  }
}

/** Thêm URL vào product_urls nếu chưa tồn tại */
async function addUrlIfNew(identityId: string, url: string, type: string): Promise<void> {
  const urlType = mapUrlType(type);
  const existing = await prisma.productUrl.findUnique({ where: { url } });
  if (!existing) {
    await prisma.productUrl.create({
      data: {
        productIdentityId: identityId,
        url,
        urlType,
      },
    });
  } else {
    await prisma.productUrl.update({
      where: { id: existing.id },
      data: { lastSeenAt: new Date() },
    });
  }
}

/** Map link type → URL type cho bảng product_urls */
function mapUrlType(linkType: string): string {
  switch (linkType) {
    case "product": return "tiktokshop";
    case "fastmoss_product": return "fastmoss";
    case "fastmoss_shop": return "fastmoss";
    case "video": return "video";
    case "shop": return "shop";
    default: return "manual";
  }
}
