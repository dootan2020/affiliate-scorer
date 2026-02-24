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

const SEVERITY_ORDER: Record<Anomaly["severity"], number> = { urgent: 0, warning: 1, info: 2 };

function getRecentDays(dailyResults: DailyResult[], count: number): DailyResult[] {
  return dailyResults.slice(-count);
}

async function checkRoasDeclining(anomalies: Anomaly[]): Promise<void> {
  const campaigns = await prisma.campaign.findMany({
    where: { status: "running" },
    select: { id: true, name: true, dailyResults: true },
  });

  for (const campaign of campaigns) {
    const days = getRecentDays((campaign.dailyResults as unknown as DailyResult[]) ?? [], 3);
    if (days.length < 3) continue;

    const roasValues = days.map((d) => (d.spend > 0 ? d.revenue / d.spend : 0));
    const isDecl = roasValues[0] > roasValues[1] && roasValues[1] > roasValues[2];

    if (isDecl && roasValues[2] < 1) {
      anomalies.push({
        type: "roas_declining",
        severity: "warning",
        campaignName: campaign.name,
        productName: null,
        message: `ROAS giam lien tuc 3 ngay (${roasValues.map((v) => v.toFixed(1)).join(" → ")})`,
        suggestion: "Xem xet dieu chinh content hoac target audience",
        campaignId: campaign.id,
      });
    }
  }
}

async function checkConsecutiveLoss(anomalies: Anomaly[]): Promise<void> {
  const campaigns = await prisma.campaign.findMany({
    where: { status: "running" },
    select: { id: true, name: true, dailyResults: true },
  });

  for (const campaign of campaigns) {
    const days = getRecentDays((campaign.dailyResults as unknown as DailyResult[]) ?? [], 3);
    if (days.length < 3) continue;

    const allLosing = days.every((d) => d.spend > d.revenue);
    if (allLosing) {
      const totalLoss = days.reduce((s, d) => s + (d.spend - d.revenue), 0);
      anomalies.push({
        type: "consecutive_loss",
        severity: "urgent",
        campaignName: campaign.name,
        productName: null,
        message: `Lo lien tuc 3 ngay (tong lo: ${totalLoss.toLocaleString()} VND)`,
        suggestion: "Tam dung chien dich va danh gia lai chien luoc",
        campaignId: campaign.id,
      });
    }
  }
}

async function checkOverspend(anomalies: Anomaly[]): Promise<void> {
  const campaigns = await prisma.campaign.findMany({
    where: { status: "running", plannedBudgetDaily: { not: null } },
    select: { id: true, name: true, plannedBudgetDaily: true, dailyResults: true },
  });

  for (const campaign of campaigns) {
    const planned = campaign.plannedBudgetDaily ?? 0;
    if (planned <= 0) continue;

    const days = getRecentDays((campaign.dailyResults as unknown as DailyResult[]) ?? [], 1);
    if (days.length === 0) continue;

    const latestSpend = days[0].spend;
    if (latestSpend > planned * 1.5) {
      anomalies.push({
        type: "overspend",
        severity: "warning",
        campaignName: campaign.name,
        productName: null,
        message: `Chi tieu ${latestSpend.toLocaleString()} VND vuot ${Math.round((latestSpend / planned - 1) * 100)}% so voi ke hoach`,
        suggestion: `Dat lai budget gioi han ${planned.toLocaleString()} VND/ngay`,
        campaignId: campaign.id,
      });
    }
  }
}

async function checkCompetitionSpike(anomalies: Anomaly[]): Promise<void> {
  const campaigns = await prisma.campaign.findMany({
    where: { status: "running", productId: { not: null } },
    select: { id: true, name: true, productId: true, product: { select: { name: true } } },
  });

  for (const campaign of campaigns) {
    if (!campaign.productId) continue;

    const snapshots = await prisma.productSnapshot.findMany({
      where: { productId: campaign.productId },
      orderBy: { snapshotDate: "desc" },
      take: 2,
      select: { totalKOL: true },
    });

    if (snapshots.length < 2) continue;

    const [latest, prev] = snapshots;
    const prevKOL = prev.totalKOL ?? 0;
    const latestKOL = latest.totalKOL ?? 0;

    if (prevKOL > 0 && ((latestKOL - prevKOL) / prevKOL) > 0.5) {
      anomalies.push({
        type: "competition_spike",
        severity: "warning",
        campaignName: campaign.name,
        productName: campaign.product?.name ?? null,
        message: `KOL tang tu ${prevKOL} len ${latestKOL} (+${Math.round(((latestKOL - prevKOL) / prevKOL) * 100)}%)`,
        suggestion: "Canh tranh tang — xem xet tang chat luong content de khac biet hoa",
        campaignId: campaign.id,
      });
    }
  }
}

async function checkSalesDrop(anomalies: Anomaly[]): Promise<void> {
  const campaigns = await prisma.campaign.findMany({
    where: { status: "running", productId: { not: null } },
    select: { id: true, name: true, productId: true, product: { select: { name: true } } },
  });

  for (const campaign of campaigns) {
    if (!campaign.productId) continue;

    const snapshots = await prisma.productSnapshot.findMany({
      where: { productId: campaign.productId },
      orderBy: { snapshotDate: "desc" },
      take: 2,
      select: { sales7d: true },
    });

    if (snapshots.length < 2) continue;

    const [latest, prev] = snapshots;
    const prevSales = prev.sales7d ?? 0;
    const latestSales = latest.sales7d ?? 0;

    if (prevSales > 0 && ((latestSales - prevSales) / prevSales) < -0.3) {
      const dropPct = Math.round(((prevSales - latestSales) / prevSales) * 100);
      anomalies.push({
        type: "sales_drop",
        severity: "warning",
        campaignName: campaign.name,
        productName: campaign.product?.name ?? null,
        message: `Doanh so 7 ngay giam ${dropPct}% (${prevSales} → ${latestSales})`,
        suggestion: "San pham dang suy giam — xem xet chuyen sang san pham khac",
        campaignId: campaign.id,
      });
    }
  }
}

export async function detectAnomalies(): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];

  await Promise.all([
    checkConsecutiveLoss(anomalies),
    checkRoasDeclining(anomalies),
    checkOverspend(anomalies),
    checkCompetitionSpike(anomalies),
    checkSalesDrop(anomalies),
  ]);

  return anomalies.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
