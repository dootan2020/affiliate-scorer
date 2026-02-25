import { prisma } from "@/lib/db";
import { getProductLifecycle } from "@/lib/ai/lifecycle";
import type { Product } from "@/lib/types/product";

export interface WinProbability {
  total: number;
  market: number;
  personalFit: number;
  timing: number;
  risk: number;
  confidenceLevel: number;
  insights: string[];
}

type ProductWithRelations = Product & {
  personalRating?: number | null;
  personalTags?: string[];
  shopTrustScore?: number | null;
};

function scoreMarket(p: ProductWithRelations, ins: string[]): number {
  let t = 0;
  const rate = p.commissionRate;
  const commPts = rate >= 10 ? 10 : rate >= 7 ? 7 : rate >= 4 ? 4 : 2;
  t += commPts;
  ins.push(`Hoa hồng ${rate}% → +${commPts} điểm`);

  const s7d = p.sales7d ?? 0;
  const sTotal = p.salesTotal ?? 1;
  const ratio = sTotal > 0 ? s7d / sTotal : 0;
  const momPts = ratio > 0.1 ? 10 : ratio > 0.05 ? 7 : ratio > 0.02 ? 4 : 2;
  t += momPts;
  ins.push(`Đã bán mới (${(ratio * 100).toFixed(1)}%) → +${momPts} điểm`);

  const price = p.price;
  const pricePts = price >= 100_000 && price <= 500_000 ? 10
    : price >= 50_000 && price < 100_000 ? 6
    : price > 500_000 && price <= 1_000_000 ? 5 : 2;
  t += pricePts;
  ins.push(`Giá ${Math.round(price / 1000)}K → +${pricePts} điểm`);

  const kol = p.totalKOL ?? 0;
  const kolPts = kol < 10 ? 10 : kol < 30 ? 7 : kol < 60 ? 4 : 2;
  t += kolPts;
  ins.push(`${kol} KOL cạnh tranh → +${kolPts} điểm`);
  return Math.min(40, t);
}

async function scorePersonalFit(
  p: ProductWithRelations, cl: number, ins: string[],
): Promise<number> {
  let t = 0;
  if (cl < 1) return 0;

  const catCamps = await prisma.campaign.findMany({
    where: { status: "completed", verdict: { not: null }, product: { category: p.category } },
    select: { roas: true },
  });
  if (catCamps.length > 0) {
    const avg = catCamps.reduce((s, c) => s + (c.roas ?? 0), 0) / catCamps.length;
    const pts = avg > 2 ? 10 : avg > 1 ? 5 : -5;
    t += pts;
    ins.push(`ROAS category "${p.category}": ${avg.toFixed(1)}x → ${pts > 0 ? "+" : ""}${pts}`);
  }
  if (cl < 2) return Math.max(0, Math.min(30, t));

  const profCamps = await prisma.campaign.findMany({
    where: { status: "completed", verdict: "profitable" },
    select: { product: { select: { price: true } } },
  });
  if (profCamps.length > 0) {
    const prices = profCamps.filter((c) => c.product).map((c) => c.product!.price);
    if (prices.length > 0) {
      const inRange = p.price >= Math.min(...prices) * 0.8 && p.price <= Math.max(...prices) * 1.2;
      if (inRange) { t += 8; ins.push("Giá nằm trong sweet spot của bạn → +8"); }
    }
  }

  const topContent = await prisma.contentPost.groupBy({
    by: ["contentType"],
    where: { contentType: { not: null }, campaign: { verdict: "profitable" } },
    _count: true,
    orderBy: { _count: { contentType: "desc" } },
    take: 1,
  });
  if (topContent.length > 0 && topContent[0].contentType) {
    t += 5;
    ins.push(`Content thành công nhất: "${topContent[0].contentType}" → +5`);
  }
  if (cl < 3) return Math.max(0, Math.min(30, t));

  const sr = p.shopRating ?? p.shopTrustScore ?? null;
  if (sr !== null) {
    const pts = sr >= 4 ? 5 : sr <= 2 ? -5 : 0;
    t += pts;
    if (pts !== 0) ins.push(`Shop rating ${sr} → ${pts > 0 ? "+" : ""}${pts}`);
  }
  return Math.max(0, Math.min(30, t));
}

async function scoreTiming(p: ProductWithRelations, ins: string[]): Promise<number> {
  let t = 0;
  const now = new Date();
  const in14d = new Date(now.getTime() + 14 * 86_400_000);
  const event = await prisma.calendarEvent.findFirst({
    where: { startDate: { gte: now, lte: in14d } },
    select: { name: true },
  });
  if (event) { t += 5; ins.push(`Sự kiện "${event.name}" sắp diễn ra → +5`); }

  const lc = await getProductLifecycle(p.id);
  const lcPts = lc.stage === "rising" ? 5 : lc.stage === "hot" ? 3
    : lc.stage === "peak" ? 1 : lc.stage === "declining" ? -3 : 0;
  t += lcPts;
  if (lcPts !== 0) ins.push(`Vòng đời: ${lc.stage} → ${lcPts > 0 ? "+" : ""}${lcPts}`);

  const g = p.salesGrowth7d ?? 0;
  const gPts = g > 50 ? 5 : g > 20 ? 3 : g < 0 ? -2 : 0;
  t += gPts;
  if (gPts !== 0) ins.push(`Tăng trưởng 7d: ${g.toFixed(0)}% → ${gPts > 0 ? "+" : ""}${gPts}`);
  return Math.max(0, Math.min(15, t));
}

async function scoreRisk(p: ProductWithRelations, ins: string[]): Promise<number> {
  let d = 0;
  const snaps = await prisma.productSnapshot.findMany({
    where: { productId: p.id },
    orderBy: { snapshotDate: "desc" },
    take: 2,
    select: { totalKOL: true },
  });
  if (snaps.length >= 2) {
    const prev = snaps[1].totalKOL ?? 0;
    const cur = snaps[0].totalKOL ?? 0;
    if (prev > 0 && (cur - prev) / prev > 0.5) {
      d += 5;
      ins.push("KOL tăng đột biến > 50% → -5 (rủi ro bão hòa)");
    }
  }

  if ((p.shopRating ?? 5) < 3) {
    d += 5;
    ins.push(`Shop rating thấp (${p.shopRating}) → -5`);
  }

  const catProds = await prisma.product.findMany({
    where: { category: p.category }, select: { id: true }, take: 50,
  });
  const pIds = catProds.map((x) => x.id);
  if (pIds.length >= 3) {
    const catSnaps = await prisma.productSnapshot.findMany({
      where: { productId: { in: pIds } },
      orderBy: { snapshotDate: "desc" },
      take: pIds.length * 2,
      select: { productId: true, sales7d: true },
    });
    const byProd = new Map<string, number[]>();
    for (const s of catSnaps) {
      const l = byProd.get(s.productId) ?? [];
      l.push(s.sales7d ?? 0);
      byProd.set(s.productId, l);
    }
    let dec = 0, tot = 0;
    byProd.forEach((sales) => {
      if (sales.length >= 2) { tot++; if (sales[0] < sales[1]) dec++; }
    });
    if (tot >= 3 && dec / tot > 0.6) {
      d += 5;
      ins.push("Category đang có xu hướng giảm → -5");
    }
  }
  return Math.min(15, d);
}

export async function calculateWinProbability(
  product: ProductWithRelations,
  confidenceLevel: number,
): Promise<WinProbability> {
  const insights: string[] = [];
  const market = scoreMarket(product, insights);
  const personalFit = await scorePersonalFit(product, confidenceLevel, insights);
  const timing = await scoreTiming(product, insights);
  const risk = await scoreRisk(product, insights);
  const total = Math.max(0, Math.min(100, market + personalFit + timing - risk));
  return { total, market, personalFit, timing, risk, confidenceLevel, insights };
}
