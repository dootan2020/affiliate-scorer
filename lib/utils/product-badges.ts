/**
 * Product badge computation from historical snapshot comparison.
 * Compares current product data with the most recent snapshot to determine change badges.
 */

export interface ProductBadge {
  type: "new" | "sales_up" | "sales_down" | "competition_up" | "commission_change" | "negative" | "tested";
  emoji: string;
  label: string;
  detail?: string;
}

interface SnapshotData {
  price: number;
  commissionRate: number;
  sales7d: number | null;
  salesTotal: number | null;
  totalKOL: number | null;
}

interface CurrentData {
  price: number;
  commissionRate: number;
  sales7d: number | null;
  salesTotal: number | null;
  totalKOL: number | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

/** Compute badges by comparing current product data with previous snapshot */
export function computeBadges(
  current: CurrentData,
  previousSnapshot: SnapshotData | null
): ProductBadge[] {
  const badges: ProductBadge[] = [];

  // 🆕 New product — no previous snapshot
  if (!previousSnapshot) {
    badges.push({ type: "new", emoji: "🆕", label: "Mới" });
    return badges;
  }

  // 📈📉 Sales change
  if (current.sales7d !== null && previousSnapshot.sales7d !== null && previousSnapshot.sales7d > 0) {
    const change = ((current.sales7d - previousSnapshot.sales7d) / previousSnapshot.sales7d) * 100;
    if (change >= 50) {
      badges.push({
        type: "sales_up",
        emoji: "📈",
        label: "Tăng mạnh",
        detail: `+${Math.round(change)}% bán 7 ngày`,
      });
    } else if (change <= -30) {
      badges.push({
        type: "sales_down",
        emoji: "📉",
        label: "Giảm",
        detail: `${Math.round(change)}% bán 7 ngày`,
      });
    }
  }

  // ⚠️ Competition surge (KOL count increase)
  if (current.totalKOL !== null && previousSnapshot.totalKOL !== null && previousSnapshot.totalKOL > 0) {
    const kolChange = ((current.totalKOL - previousSnapshot.totalKOL) / previousSnapshot.totalKOL) * 100;
    if (kolChange >= 100) {
      badges.push({
        type: "competition_up",
        emoji: "⚠️",
        label: "Cạnh tranh tăng",
        detail: `KOL tăng ${Math.round(kolChange)}%`,
      });
    }
  }

  // 💰 Commission change
  if (previousSnapshot.commissionRate > 0) {
    const commChange = ((current.commissionRate - previousSnapshot.commissionRate) / previousSnapshot.commissionRate) * 100;
    if (Math.abs(commChange) >= 10) {
      badges.push({
        type: "commission_change",
        emoji: commChange > 0 ? "💰" : "💰",
        label: commChange > 0 ? "HH tăng" : "HH giảm",
        detail: `${commChange > 0 ? "+" : ""}${Math.round(commChange)}%`,
      });
    }
  }

  return badges;
}

/** B5: Negative signal detection from multiple snapshots */
export function detectNegativeSignals(
  current: { totalKOL: number | null; commissionRate: number; sales7d: number | null },
  snapshots: Array<{ totalKOL: number | null; commissionRate: number; sales7d: number | null }>
): ProductBadge[] {
  const badges: ProductBadge[] = [];

  // KOL tripled in one period → "Sắp bão hòa"
  if (snapshots.length >= 1 && current.totalKOL !== null) {
    const prev = snapshots[0]?.totalKOL;
    if (prev !== null && prev > 0 && current.totalKOL / prev >= 3) {
      badges.push({
        type: "negative",
        emoji: "⛔",
        label: "Sắp bão hòa",
        detail: `KOL tăng x${(current.totalKOL / prev).toFixed(1)}`,
      });
    }
  }

  // Commission dropping across snapshots → "Shop cắt budget"
  if (snapshots.length >= 2) {
    const rates = [current.commissionRate, ...snapshots.map((s) => s.commissionRate)];
    const consecutiveDrops = rates.slice(1).filter((r, i) => rates[i] > r).length;
    if (consecutiveDrops >= 2) {
      badges.push({
        type: "negative",
        emoji: "⛔",
        label: "Shop cắt budget",
        detail: "Commission giảm liên tục",
      });
    }
  }

  return badges;
}

/** B6: "Đã Test" badge based on feedback ROAS */
export function getTestedBadge(
  roas: number | null
): ProductBadge | null {
  if (roas === null) return null;
  if (roas >= 2) {
    return { type: "tested", emoji: "✅", label: "Đã test", detail: `ROAS ${roas.toFixed(1)}x` };
  }
  if (roas >= 1) {
    return { type: "tested", emoji: "⚡", label: "TB", detail: `ROAS ${roas.toFixed(1)}x` };
  }
  return { type: "tested", emoji: "❌", label: "Test lỗ", detail: `ROAS ${roas.toFixed(1)}x` };
}

/** B8: Time decay weight for feedback learning */
export function getTimeDecayWeight(feedbackDate: Date): number {
  const now = new Date();
  const daysDiff = (now.getTime() - feedbackDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysDiff <= 14) return 1.0;     // ≤ 2 weeks
  if (daysDiff <= 28) return 0.7;     // 2-4 weeks
  if (daysDiff <= 60) return 0.4;     // 1-2 months
  return 0.2;                          // > 2 months
}

/** Compute real trending score from two snapshots */
export function computeRealTrending(
  currentSales7d: number | null,
  previousSales7d: number | null
): number | null {
  if (currentSales7d === null || previousSales7d === null) return null;
  if (previousSales7d === 0) return currentSales7d > 0 ? 100 : 0;
  return ((currentSales7d - previousSales7d) / previousSales7d) * 100;
}
