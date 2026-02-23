import { prisma } from "@/lib/db";
import type { FbAdsFeedbackEntry } from "@/lib/parsers/fb-ads";
import type { TikTokAdsFeedbackEntry } from "@/lib/parsers/tiktok-ads";
import type { ShopeeAffiliateFeedbackEntry } from "@/lib/parsers/shopee-affiliate";

export type FeedbackEntry =
  | FbAdsFeedbackEntry
  | TikTokAdsFeedbackEntry
  | ShopeeAffiliateFeedbackEntry;

export interface MappedFeedback {
  entry: FeedbackEntry;
  productId: string | null;
  productName: string | null;
  aiScoreAtSelection: number | null;
  confidence: number;
  autoMapped: boolean;
}

function removeTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function normalizeForCompare(str: string): string {
  return removeTones(str.toLowerCase())
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const na = normalizeForCompare(a);
  const nb = normalizeForCompare(b);

  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) {
    const longer = Math.max(na.length, nb.length);
    const shorter = Math.min(na.length, nb.length);
    return shorter / longer;
  }

  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

function getEntryName(entry: FeedbackEntry): string {
  if ("campaignName" in entry) return entry.campaignName;
  if ("productName" in entry) return entry.productName;
  return "";
}

export async function mapFeedbackToProducts(
  feedbackEntries: FeedbackEntry[]
): Promise<MappedFeedback[]> {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, aiScore: true },
  });

  return feedbackEntries.map((entry): MappedFeedback => {
    const entryName = getEntryName(entry);
    if (!entryName || products.length === 0) {
      return { entry, productId: null, productName: null, aiScoreAtSelection: null, confidence: 0, autoMapped: false };
    }

    let bestScore = 0;
    let bestProduct: { id: string; name: string; aiScore: number | null } | null = null;

    for (const product of products) {
      const score = similarity(entryName, product.name);
      if (score > bestScore) {
        bestScore = score;
        bestProduct = product;
      }
    }

    const autoMapped = bestScore >= 0.7;

    return {
      entry,
      productId: autoMapped && bestProduct ? bestProduct.id : null,
      productName: bestProduct?.name ?? null,
      aiScoreAtSelection: autoMapped && bestProduct ? (bestProduct.aiScore ?? null) : null,
      confidence: bestScore,
      autoMapped,
    };
  });
}
