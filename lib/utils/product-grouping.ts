/**
 * B2: Duplicate/Copycat Grouping
 *
 * Groups products with similar names across different shops.
 * Top 10 shows best representative per group (highest commission + best score).
 * Detail page shows "Cũng có ở: Shop A (10%), Shop B (8%)"
 */

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

export interface ProductLike {
  id: string;
  name: string;
  shopName: string | null;
  commissionRate: number;
  aiScore: number | null;
}

export interface ProductWithAlternatives extends ProductLike {
  alternatives: Array<{ shopName: string; commissionRate: number; id: string }>;
}

/**
 * Groups products by name similarity (>80%), picks best representative per group.
 * Returns deduplicated list where each entry may have alternatives.
 */
export function groupDuplicateProducts<T extends ProductLike>(
  products: T[]
): Array<T & { alternatives: Array<{ shopName: string; commissionRate: number; id: string }> }> {
  const groups: Array<T[]> = [];
  const assigned = new Set<number>();

  for (let i = 0; i < products.length; i++) {
    if (assigned.has(i)) continue;

    const group: T[] = [products[i]];
    assigned.add(i);

    for (let j = i + 1; j < products.length; j++) {
      if (assigned.has(j)) continue;
      if (similarity(products[i].name, products[j].name) > 0.8) {
        group.push(products[j]);
        assigned.add(j);
      }
    }

    groups.push(group);
  }

  return groups.map((group) => {
    // Pick representative: highest aiScore, then highest commission
    const sorted = [...group].sort((a, b) => {
      const scoreA = a.aiScore ?? 0;
      const scoreB = b.aiScore ?? 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.commissionRate - a.commissionRate;
    });

    const best = sorted[0];
    const alternatives = sorted
      .slice(1)
      .map((p) => ({
        shopName: p.shopName ?? "Không rõ",
        commissionRate: p.commissionRate,
        id: p.id,
      }));

    return { ...best, alternatives };
  });
}
