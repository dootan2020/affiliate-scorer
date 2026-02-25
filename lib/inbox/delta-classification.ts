// Phase 2: Delta classification — so sánh snapshot mới vs cũ
// NEW | SURGE | COOL | STABLE | REAPPEAR

export type DeltaType = "NEW" | "SURGE" | "COOL" | "STABLE" | "REAPPEAR";

interface SnapshotData {
  sales7d: number | null;
  revenue7d: number | null;
}

/**
 * Phân loại delta dựa trên snapshot hiện tại vs trước đó
 * @param current - Snapshot mới nhất
 * @param previous - Snapshot trước đó (null = SP mới)
 * @param reappearing - SP đã mất rồi xuất hiện lại
 */
export function classifyDelta(
  current: SnapshotData,
  previous: SnapshotData | null,
  reappearing?: boolean,
): DeltaType {
  // Chưa có snapshot trước → SP mới
  if (!previous) return "NEW";

  // SP xuất hiện lại sau khi mất
  if (reappearing) return "REAPPEAR";

  const prevSales = previous.sales7d ?? 0;
  const currSales = current.sales7d ?? 0;

  // Nếu trước đó sales = 0, chỉ kiểm tra có bán được không
  if (prevSales === 0) {
    return currSales > 0 ? "SURGE" : "STABLE";
  }

  const salesChange = (currSales - prevSales) / prevSales;

  if (salesChange > 0.5) return "SURGE";   // Tăng >50%
  if (salesChange < -0.3) return "COOL";    // Giảm >30%
  return "STABLE";
}

/**
 * Tính delta cho 1 product dựa trên lịch sử snapshots
 */
export function classifyProductDelta(
  currentSales7d: number | null,
  currentRevenue7d: number | null,
  snapshots: Array<{ sales7d: number | null; revenue7d: number | null; snapshotDate: Date }>,
): DeltaType {
  if (snapshots.length === 0) return "NEW";

  // Sắp xếp theo thời gian giảm dần
  const sorted = [...snapshots].sort(
    (a, b) => b.snapshotDate.getTime() - a.snapshotDate.getTime(),
  );

  const latestSnapshot = sorted[0];

  // Check REAPPEAR: nếu SP mất khỏi 2 snapshots gần nhất rồi quay lại
  // (sales = 0 liên tiếp rồi lại > 0)
  if (sorted.length >= 2) {
    const prevTwo = sorted.slice(0, 2);
    const bothZero = prevTwo.every((s) => (s.sales7d ?? 0) === 0);
    if (bothZero && (currentSales7d ?? 0) > 0) {
      return "REAPPEAR";
    }
  }

  return classifyDelta(
    { sales7d: currentSales7d, revenue7d: currentRevenue7d },
    { sales7d: latestSnapshot.sales7d, revenue7d: latestSnapshot.revenue7d },
  );
}

/** Tổng kết delta cho batch upload */
export interface DeltaSummary {
  NEW: number;
  SURGE: number;
  COOL: number;
  STABLE: number;
  REAPPEAR: number;
}

export function createEmptyDeltaSummary(): DeltaSummary {
  return { NEW: 0, SURGE: 0, COOL: 0, STABLE: 0, REAPPEAR: 0 };
}
