// lib/fastmoss/sync-products.ts — upsert FastMoss product data into ProductIdentity

import { prisma } from "@/lib/db";

interface FastMossProduct {
  product_id: string;
  title?: string;
  cover?: string;
  price_vnd?: number;
  commission_rate_num?: number;
  shop_name?: string;
  category_name?: string[];
  category_id?: number;
  viral_index?: number;
  popularity_index?: number;
  country_rank?: number;
  category_rank?: number;
  day28_sold_count?: number;
  sale_amount?: number;
  relate_author_count?: number;
  relate_video_count?: number;
  relate_live_count?: number;
  sold_count_inc_rate?: string;
  product_rating?: number;
  is_promoted?: boolean;
}

interface SyncProductsResult {
  recordCount: number;
  newCount: number;
  updatedCount: number;
  errorCount: number;
}

const CHUNK_SIZE = 50;

function mapProductFields(p: FastMossProduct) {
  const categoryNames = p.category_name ?? [];
  return {
    title: p.title,
    imageUrl: p.cover,
    price: p.price_vnd != null ? Math.round(p.price_vnd) : undefined,
    commissionRate: p.commission_rate_num != null ? p.commission_rate_num : undefined,
    shopName: p.shop_name,
    category: categoryNames[0],
    fastmossCategoryId: p.category_id,
    fastmossCategory: categoryNames.length > 0 ? categoryNames.join(" > ") : undefined,
    viralIndex: p.viral_index,
    popularityIndex: p.popularity_index,
    countryRank: p.country_rank,
    categoryRank: p.category_rank,
    day28SoldCount: p.day28_sold_count,
    day28Revenue: p.sale_amount != null ? p.sale_amount : undefined,
    relateAuthorCount: p.relate_author_count,
    relateVideoCount: p.relate_video_count,
    relateLiveCount: p.relate_live_count,
    soldCountIncRate: p.sold_count_inc_rate,
    productRating: p.product_rating != null ? p.product_rating : undefined,
    isPromoted: p.is_promoted ?? false,
    lastFastmossSync: new Date(),
  };
}

async function processChunk(
  chunk: FastMossProduct[]
): Promise<{ newCount: number; updatedCount: number; errorCount: number }> {
  let newCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  const results = await Promise.allSettled(
    chunk.map(async (p) => {
      const existing = await prisma.productIdentity.findUnique({
        where: { fastmossProductId: p.product_id },
        select: { id: true },
      });

      const fields = mapProductFields(p);

      if (existing) {
        await prisma.productIdentity.update({
          where: { id: existing.id },
          data: fields,
        });
        return "updated";
      } else {
        await prisma.productIdentity.create({
          data: {
            fastmossProductId: p.product_id,
            inboxState: "enriched",
            fingerprintHash: `fm-${p.product_id}`,
            ...fields,
          },
        });
        return "new";
      }
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled") {
      if (r.value === "new") newCount++;
      else updatedCount++;
    } else {
      errorCount++;
      console.error("[syncProducts] chunk item error:", r.reason);
    }
  }

  return { newCount, updatedCount, errorCount };
}

export async function syncProducts(
  data: unknown[],
  _syncLogId: string
): Promise<SyncProductsResult> {
  const products = data as FastMossProduct[];
  let newCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    const result = await processChunk(chunk);
    newCount += result.newCount;
    updatedCount += result.updatedCount;
    errorCount += result.errorCount;
  }

  return {
    recordCount: products.length,
    newCount,
    updatedCount,
    errorCount,
  };
}
