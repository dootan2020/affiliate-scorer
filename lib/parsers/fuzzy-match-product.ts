import { prisma } from "@/lib/db";

// Cache products to avoid repeated DB queries during a single import
let productCache: Array<{ id: string; name: string }> | null = null;

export async function loadProductCache(): Promise<void> {
  productCache = await prisma.product.findMany({
    select: { id: true, name: true },
  });
}

export function clearProductCache(): void {
  productCache = null;
}

function removeTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function normalizeForMatch(str: string): string {
  return removeTones(str.toLowerCase())
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function fuzzyMatchProduct(searchText: string): string | null {
  if (!productCache || productCache.length === 0) return null;

  const normalized = normalizeForMatch(searchText);
  if (!normalized) return null;

  // 1. Exact match (after normalization)
  for (const p of productCache) {
    if (normalizeForMatch(p.name) === normalized) return p.id;
  }

  // 2. Contains match — campaign name contains product name or vice versa
  for (const p of productCache) {
    const pNorm = normalizeForMatch(p.name);
    if (normalized.includes(pNorm) || pNorm.includes(normalized)) return p.id;
  }

  // 3. Word overlap with Jaccard similarity threshold
  const searchWords = new Set(
    normalized.split(" ").filter((w) => w.length > 2)
  );
  if (searchWords.size === 0) return null;

  let bestScore = 0;
  let bestId: string | null = null;

  for (const p of productCache) {
    const pWords = new Set(
      normalizeForMatch(p.name).split(" ").filter((w) => w.length > 2)
    );
    if (pWords.size === 0) continue;

    const intersection = [...searchWords].filter((w) => pWords.has(w)).length;
    const union = new Set([...searchWords, ...pWords]).size;
    const score = union === 0 ? 0 : intersection / union;

    if (score > bestScore && score >= 0.5) {
      bestScore = score;
      bestId = p.id;
    }
  }

  return bestId;
}
