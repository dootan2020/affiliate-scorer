// lib/fastmoss/sync-products.ts — upsert FastMoss product data into ProductIdentity

import { prisma } from "@/lib/db";

// Map L1 English category names → codes (from FastMoss filterInfo API)
const CATEGORY_NAME_TO_CODE: Record<string, number> = {
  "Beauty & Personal Care": 14,
  "Womenswear & Underwear": 2,
  "Health": 25,
  "Fashion Accessories": 8,
  "Sports & Outdoor": 9,
  "Phones & Electronics": 16,
  "Home Supplies": 10,
  "Food & Beverages": 24,
  "Automotive & Motorcycle": 23,
  "Menswear & Underwear": 3,
  "Collectibles": 30,
  "Toys & Hobbies": 19,
  "Kitchenware": 11,
  "Home Improvement": 22,
  "Computers & Office Equipment": 15,
  "Luggage & Bags": 7,
  "Shoes": 6,
  "Tools & Hardware": 21,
  "Textiles & Soft Furnishings": 12,
  "Household Appliances": 13,
  "Pet Supplies": 17,
  "Jewelry Accessories": 28,
  "Books, Magazines & Audio": 26,
  "Baby & Maternity": 18,
  "Furniture": 20,
  "Kids' Fashion": 4,
  "Muslim Fashion": 5,
  "Pre-Owned": 31,
  "Virtual Products": 27,
};

interface SyncProductsResult {
  recordCount: number;
  newCount: number;
  updatedCount: number;
  errorCount: number;
}

const CHUNK_SIZE = 50;

/**
 * Normalize raw FastMoss API item to consistent field set.
 * Handles field name variants across endpoints:
 *   search (product_list[]), saleRank (rank_list[]), newProduct (list[]),
 *   hotGoodsVideoGroupByProduct (product_list[])
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeProduct(raw: any): {
  productId: string | null;
  fields: Record<string, unknown>;
} {
  // --- Product ID: id (search) | product_id (rank/new/video) | uid
  const productId = String(raw.product_id || raw.id || raw.uid || "");
  if (!productId) return { productId: null, fields: {} };

  // --- Image: img (search) | cover (rank/new/video)
  const imageUrl = raw.img || raw.cover || undefined;

  // --- Title
  const title = raw.title || raw.product_name || raw.goods_name || undefined;

  // --- Price: parse from formatted strings like "99,000₫", "Rp42,000", or numeric
  const price = parsePrice(raw.price_vnd ?? raw.real_price ?? raw.format_price ?? raw.price ?? raw.floor_price);

  // --- Commission rate: parse from "5%", "-", or numeric
  const commissionRate = parseCommission(raw.commission_rate_num ?? raw.crate ?? raw.commission_rate);

  // --- Shop name
  const shopName = raw.shop_name || raw.shop_info?.name || undefined;

  // --- Category: category_name[] | all_category_name[] (could be array or string)
  const catNames = toStringArray(raw.category_name ?? raw.all_category_name);
  const category = catNames[0] || undefined;
  const fastmossCategory = catNames.length > 0 ? catNames.join(" > ") : undefined;

  // --- Category ID: from raw fields or _crawl_category_id (injected by extension)
  let fastmossCategoryId: number | undefined = toInt(
    raw.category_id ?? raw.first_cid ?? raw.l1_cid ?? raw._crawl_category_id
  );
  if (!fastmossCategoryId && category) {
    fastmossCategoryId = CATEGORY_NAME_TO_CODE[category];
  }

  // --- Counts: variant field names across endpoints
  const day28SoldCount = toInt(raw.day28_sold_count ?? raw.sold_count);
  const day28Revenue = toFloat(raw.sale_amount ?? raw.sold_amount);
  const relateAuthorCount = toInt(raw.relate_author_cnt ?? raw.relate_author_count ?? raw.author_count ?? raw.total_author_count);
  const relateVideoCount = toInt(raw.relate_video_cnt ?? raw.relate_video_count ?? raw.aweme_count ?? raw.video_count ?? raw.total_aweme_count);
  const relateLiveCount = toInt(raw.relate_live_count ?? raw.live_count ?? raw.total_live_count);

  // --- Ranking fields (only from goods/v3/base detail)
  const viralIndex = toInt(raw.viral_index);
  const popularityIndex = toInt(raw.popularity_index);
  const countryRank = toInt(raw.country_rank);
  const categoryRank = toInt(raw.category_rank);

  // --- Other
  const soldCountIncRate = raw.sold_count_inc_rate != null ? String(raw.sold_count_inc_rate) : undefined;
  const productRating = toFloat(raw.product_rating);
  const isPromoted = Boolean(raw.is_promoted || raw.is_ad);

  return {
    productId,
    fields: {
      title,
      imageUrl,
      price: price != null ? Math.round(price) : undefined,
      commissionRate: commissionRate ?? undefined,
      shopName,
      category,
      fastmossCategoryId,
      fastmossCategory,
      viralIndex,
      popularityIndex,
      countryRank,
      categoryRank,
      day28SoldCount,
      day28Revenue: day28Revenue ?? undefined,
      relateAuthorCount,
      relateVideoCount,
      relateLiveCount,
      soldCountIncRate,
      productRating: productRating ?? undefined,
      isPromoted,
      lastFastmossSync: new Date(),
    },
  };
}

/** Parse price from formatted string "99,000₫" or number → number | null */
function parsePrice(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === "number") return val;
  // Strip currency symbols, commas, spaces
  const cleaned = String(val).replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/** Parse commission from "5%", "-", or number → number | null */
function parseCommission(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === "number") return val;
  const str = String(val).trim();
  if (str === "-" || str === "" || str === "N/A") return null;
  const num = parseFloat(str.replace("%", ""));
  return isNaN(num) ? null : num;
}

/** Convert to int or undefined */
function toInt(val: unknown): number | undefined {
  if (val == null) return undefined;
  const n = typeof val === "number" ? val : parseInt(String(val), 10);
  return isNaN(n) ? undefined : n;
}

/** Convert to float or null */
function toFloat(val: unknown): number | null {
  if (val == null) return null;
  const n = typeof val === "number" ? val : parseFloat(String(val));
  return isNaN(n) ? null : n;
}

/** Ensure value is string array */
function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string" && val) return [val];
  return [];
}

/** Strip undefined values so Prisma doesn't overwrite existing data with undefined */
function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) result[k] = v;
  }
  return result;
}

async function processChunk(
  chunk: unknown[]
): Promise<{ newCount: number; updatedCount: number; errorCount: number }> {
  let newCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  const results = await Promise.allSettled(
    chunk.map(async (raw) => {
      const { productId, fields } = normalizeProduct(raw);
      if (!productId) throw new Error("Missing product ID");

      const data = stripUndefined(fields);

      try {
        const existing = await prisma.productIdentity.findUnique({
          where: { fastmossProductId: productId },
          select: { id: true },
        });

        if (existing) {
          await prisma.productIdentity.update({
            where: { id: existing.id },
            data,
          });
          return "updated";
        } else {
          await prisma.productIdentity.create({
            data: {
              fastmossProductId: productId,
              inboxState: "enriched",
              fingerprintHash: `fm-${productId}`,
              ...data,
            },
          });
          return "new";
        }
      } catch (err) {
        // Handle duplicate fingerprintHash race condition — try update instead
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Unique constraint") && msg.includes("fingerprintHash")) {
          await prisma.productIdentity.update({
            where: { fastmossProductId: productId },
            data,
          });
          return "updated";
        }
        throw err;
      }
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled") {
      if (r.value === "new") newCount++;
      else updatedCount++;
    } else {
      errorCount++;
      console.error("[syncProducts] item error:", r.reason?.message ?? r.reason);
    }
  }

  return { newCount, updatedCount, errorCount };
}

export async function syncProducts(
  data: unknown[],
  _syncLogId: string
): Promise<SyncProductsResult> {
  let newCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    const result = await processChunk(chunk);
    newCount += result.newCount;
    updatedCount += result.updatedCount;
    errorCount += result.errorCount;
  }

  return { recordCount: data.length, newCount, updatedCount, errorCount };
}
