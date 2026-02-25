import { prisma } from "@/lib/db";

export type LifecycleStage = "new" | "rising" | "hot" | "peak" | "declining" | "dead" | "unknown";

export interface LifecycleResult {
  stage: LifecycleStage;
  salesChange: number;
  kolChange: number;
  message: string;
  stageIndex: number;
}

const STAGE_INDEX: Record<LifecycleStage, number> = {
  new: 0,
  rising: 1,
  hot: 2,
  peak: 3,
  declining: 4,
  dead: 5,
  unknown: -1,
};

const MESSAGES: Record<LifecycleStage, string> = {
  new: "Sản phẩm mới — chưa đủ dữ liệu để đánh giá xu hướng.",
  rising: "Doanh số tăng mạnh, ít cạnh tranh — cửa sổ vàng để tham gia!",
  hot: "Sản phẩm đang hot với nhiều KOL tham gia — cạnh tranh cao.",
  peak: "Sản phẩm đã bão hòa — tăng trưởng chậm lại.",
  declining: "Doanh số đang giảm — cần xem xét tiếp tục hay dừng.",
  dead: "Sản phẩm suy giảm mạnh — nên ngừng quảng bá.",
  unknown: "Chưa đủ dữ liệu lịch sử để phân tích vòng đời.",
};

function pctChange(current: number | null, previous: number | null): number {
  const cur = current ?? 0;
  const prev = previous ?? 0;
  if (prev === 0) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
}

function determineStage(
  salesTotal: number | null,
  salesChange: number,
  kolChange: number,
): LifecycleStage {
  if ((salesTotal ?? 0) < 1000) return "new";
  if (salesChange > 50 && kolChange < 30) return "rising";
  if (salesChange > 20 && kolChange > 50) return "hot";
  if (salesChange < -50) return "dead";
  if (salesChange < -20) return "declining";
  if (salesChange >= -10 && salesChange <= 10) return "peak";
  return "peak";
}

export async function getProductLifecycle(productId: string): Promise<LifecycleResult> {
  const snapshots = await prisma.productSnapshot.findMany({
    where: { productId },
    orderBy: { snapshotDate: "desc" },
    take: 2,
    select: {
      sales7d: true,
      salesTotal: true,
      totalKOL: true,
      snapshotDate: true,
    },
  });

  if (snapshots.length < 2) {
    return {
      stage: "unknown",
      salesChange: 0,
      kolChange: 0,
      message: MESSAGES.unknown,
      stageIndex: STAGE_INDEX.unknown,
    };
  }

  const [latest, previous] = snapshots;
  const salesChange = pctChange(latest.sales7d, previous.sales7d);
  const kolChange = pctChange(latest.totalKOL, previous.totalKOL);
  const stage = determineStage(latest.salesTotal, salesChange, kolChange);

  return {
    stage,
    salesChange: Math.round(salesChange * 10) / 10,
    kolChange: Math.round(kolChange * 10) / 10,
    message: MESSAGES[stage],
    stageIndex: STAGE_INDEX[stage],
  };
}
