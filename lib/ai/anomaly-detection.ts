import { prisma } from "@/lib/db";

export interface Anomaly {
  type: "roas_declining" | "consecutive_loss" | "overspend" | "competition_spike" | "sales_drop";
  severity: "urgent" | "warning" | "info";
  campaignName: string | null;
  productName: string | null;
  message: string;
  suggestion: string;
  campaignId: string | null;
}

interface DailyResult {
  date: string;
  spend: number;
  revenue: number;
  orders: number;
}

interface CampaignData {
  id: string;
  name: string;
  dailyResults: unknown;
  plannedBudgetDaily: number | null;
  productId: string | null;
  product: { name: string } | null;
}

interface SnapshotData {
  productId: string;
  totalKOL: number | null;
  sales7d: number | null;
}

const SEVERITY_ORDER: Record<Anomaly["severity"], number> = { urgent: 0, warning: 1, info: 2 };

function getRecentDays(dailyResults: DailyResult[], count: number): DailyResult[] {
  return dailyResults.slice(-count);
}

function getDailyResults(campaign: CampaignData): DailyResult[] {
  return (campaign.dailyResults as DailyResult[] | null) ?? [];
}

// Fetch tất cả data 1 lần, truyền vào từng check function
function checkRoasDeclining(campaigns: CampaignData[]): Anomaly[] {
  const results: Anomaly[] = [];
  for (const campaign of campaigns) {
    const days = getRecentDays(getDailyResults(campaign), 3);
    if (days.length < 3) continue;

    const roasValues = days.map((d) => (d.spend > 0 ? d.revenue / d.spend : 0));
    const isDecl = roasValues[0] > roasValues[1] && roasValues[1] > roasValues[2];

    if (isDecl && roasValues[2] < 1) {
      results.push({
        type: "roas_declining",
        severity: "warning",
        campaignName: campaign.name,
        productName: null,
        message: `ROAS giảm liên tục 3 ngày (${roasValues.map((v) => v.toFixed(1)).join(" → ")})`,
        suggestion: "Xem xét điều chỉnh content hoặc target audience",
        campaignId: campaign.id,
      });
    }
  }
  return results;
}

function checkConsecutiveLoss(campaigns: CampaignData[]): Anomaly[] {
  const results: Anomaly[] = [];
  for (const campaign of campaigns) {
    const days = getRecentDays(getDailyResults(campaign), 3);
    if (days.length < 3) continue;

    const allLosing = days.every((d) => d.spend > d.revenue);
    if (allLosing) {
      const totalLoss = days.reduce((s, d) => s + (d.spend - d.revenue), 0);
      results.push({
        type: "consecutive_loss",
        severity: "urgent",
        campaignName: campaign.name,
        productName: null,
        message: `Lỗ liên tục 3 ngày (tổng lỗ: ${totalLoss.toLocaleString()} VND)`,
        suggestion: "Tạm dừng chiến dịch và đánh giá lại chiến lược",
        campaignId: campaign.id,
      });
    }
  }
  return results;
}

function checkOverspend(campaigns: CampaignData[]): Anomaly[] {
  const results: Anomaly[] = [];
  for (const campaign of campaigns) {
    const planned = campaign.plannedBudgetDaily ?? 0;
    if (planned <= 0) continue;

    const days = getRecentDays(getDailyResults(campaign), 1);
    if (days.length === 0) continue;

    const latestSpend = days[0].spend;
    if (latestSpend > planned * 1.5) {
      results.push({
        type: "overspend",
        severity: "warning",
        campaignName: campaign.name,
        productName: null,
        message: `Chi tiêu ${latestSpend.toLocaleString()} VND vượt ${Math.round((latestSpend / planned - 1) * 100)}% so với kế hoạch`,
        suggestion: `Đặt lại budget giới hạn ${planned.toLocaleString()} VND/ngày`,
        campaignId: campaign.id,
      });
    }
  }
  return results;
}

function checkCompetitionSpike(
  campaigns: CampaignData[],
  snapshotMap: Map<string, SnapshotData[]>,
): Anomaly[] {
  const results: Anomaly[] = [];
  for (const campaign of campaigns) {
    if (!campaign.productId) continue;
    const snapshots = snapshotMap.get(campaign.productId);
    if (!snapshots || snapshots.length < 2) continue;

    const [latest, prev] = snapshots;
    const prevKOL = prev.totalKOL ?? 0;
    const latestKOL = latest.totalKOL ?? 0;

    if (prevKOL > 0 && ((latestKOL - prevKOL) / prevKOL) > 0.5) {
      results.push({
        type: "competition_spike",
        severity: "warning",
        campaignName: campaign.name,
        productName: campaign.product?.name ?? null,
        message: `KOL tăng từ ${prevKOL} lên ${latestKOL} (+${Math.round(((latestKOL - prevKOL) / prevKOL) * 100)}%)`,
        suggestion: "Cạnh tranh tăng — xem xét tăng chất lượng content để khác biệt hóa",
        campaignId: campaign.id,
      });
    }
  }
  return results;
}

function checkSalesDrop(
  campaigns: CampaignData[],
  snapshotMap: Map<string, SnapshotData[]>,
): Anomaly[] {
  const results: Anomaly[] = [];
  for (const campaign of campaigns) {
    if (!campaign.productId) continue;
    const snapshots = snapshotMap.get(campaign.productId);
    if (!snapshots || snapshots.length < 2) continue;

    const [latest, prev] = snapshots;
    const prevSales = prev.sales7d ?? 0;
    const latestSales = latest.sales7d ?? 0;

    if (prevSales > 0 && ((latestSales - prevSales) / prevSales) < -0.3) {
      const dropPct = Math.round(((prevSales - latestSales) / prevSales) * 100);
      results.push({
        type: "sales_drop",
        severity: "warning",
        campaignName: campaign.name,
        productName: campaign.product?.name ?? null,
        message: `Doanh số 7 ngày giảm ${dropPct}% (${prevSales} → ${latestSales})`,
        suggestion: "Sản phẩm đang suy giảm — xem xét chuyển sang sản phẩm khác",
        campaignId: campaign.id,
      });
    }
  }
  return results;
}

export async function detectAnomalies(): Promise<Anomaly[]> {
  // Fetch tất cả campaigns 1 lần duy nhất
  const campaigns = await prisma.campaign.findMany({
    where: { status: "running" },
    select: {
      id: true,
      name: true,
      dailyResults: true,
      plannedBudgetDaily: true,
      productId: true,
      product: { select: { name: true } },
    },
  });

  // Fetch snapshots cho tất cả products liên quan (1 query thay vì N)
  const productIds = campaigns
    .map((c) => c.productId)
    .filter((id): id is string => id !== null);

  const allSnapshots = productIds.length > 0
    ? await prisma.productSnapshot.findMany({
        where: { productId: { in: productIds } },
        orderBy: { snapshotDate: "desc" },
        select: { productId: true, totalKOL: true, sales7d: true },
      })
    : [];

  // Group snapshots by productId (max 2 per product)
  const snapshotMap = new Map<string, SnapshotData[]>();
  for (const snap of allSnapshots) {
    const existing = snapshotMap.get(snap.productId);
    if (!existing) {
      snapshotMap.set(snap.productId, [snap]);
    } else if (existing.length < 2) {
      existing.push(snap);
    }
  }

  // Chạy tất cả checks synchronously, mỗi function trả về mảng riêng
  const anomalies: Anomaly[] = [
    ...checkRoasDeclining(campaigns),
    ...checkConsecutiveLoss(campaigns),
    ...checkOverspend(campaigns),
    ...checkCompetitionSpike(campaigns, snapshotMap),
    ...checkSalesDrop(campaigns, snapshotMap),
  ];

  return anomalies.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
