import type { NormalizedProduct } from "./normalize";

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function normalizeForCompare(name: string): string {
  return removeVietnameseTones(name).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function similarity(a: string, b: string): number {
  const normA = normalizeForCompare(a);
  const normB = normalizeForCompare(b);
  if (normA === normB) return 1;

  const longer = normA.length > normB.length ? normA : normB;
  const shorter = normA.length > normB.length ? normB : normA;

  if (longer.length === 0) return 1;
  if (longer.includes(shorter)) return shorter.length / longer.length;

  let matches = 0;
  const len = Math.min(shorter.length, longer.length);
  for (let i = 0; i < len; i++) {
    if (shorter[i] === longer[i]) matches++;
  }
  return matches / longer.length;
}

function isPriceSimilar(a: number, b: number): boolean {
  if (a === 0 && b === 0) return true;
  const max = Math.max(a, b);
  if (max === 0) return true;
  return Math.abs(a - b) / max <= 0.1;
}

/**
 * Deduplicate products — O(n) via tiktokUrl Map, fuzzy fallback only for URL-less.
 * FastMoss products always have tiktokUrl, so fuzzy loop is typically skipped.
 */
export function deduplicateProducts(
  products: NormalizedProduct[],
): NormalizedProduct[] {
  const urlMap = new Map<string, NormalizedProduct>();
  const withoutUrl: NormalizedProduct[] = [];

  // Pass 1: O(n) dedup by tiktokUrl
  for (const product of products) {
    if (product.tiktokUrl) {
      const key = product.tiktokUrl.toLowerCase().trim();
      if (!urlMap.has(key)) {
        urlMap.set(key, product);
      }
    } else {
      withoutUrl.push(product);
    }
  }

  const result = Array.from(urlMap.values());

  // Pass 2: O(m²) fuzzy match only for URL-less products (m ≈ 0 for FastMoss)
  for (const product of withoutUrl) {
    const isDuplicate = result.some(
      (existing) =>
        similarity(existing.name, product.name) > 0.8 &&
        isPriceSimilar(existing.price, product.price),
    );
    if (!isDuplicate) {
      result.push(product);
    }
  }

  return result;
}
