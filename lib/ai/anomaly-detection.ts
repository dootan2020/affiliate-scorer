import { prisma } from "@/lib/db";

export interface Anomaly {
  type: "reward_declining" | "low_performers" | "competition_spike" | "sales_drop";
  severity: "urgent" | "warning" | "info";
  productName: string | null;
  message: string;
  suggestion: string;
  identityId: string | null;
}

const SEVERITY_ORDER: Record<Anomaly["severity"], number> = { urgent: 0, warning: 1, info: 2 };

/**
 * Detect anomalies based on ContentAsset metrics and ProductSnapshot data.
 * Replaces Campaign-based anomaly detection with Content Factory workflow.
 */
export async function detectAnomalies(): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];

  // 1. Reward declining — published assets with rewardScore going down
  const publishedAssets = await prisma.contentAsset.findMany({
    where: { status: "published", metrics: { some: {} } },
    select: {
      assetCode: true,
      productIdentityId: true,
      productIdentity: { select: { title: true } },
      metrics: {
        orderBy: { capturedAt: "desc" },
        take: 3,
        select: { rewardScore: true },
      },
    },
    take: 50,
    orderBy: { publishedAt: "desc" },
  });

  for (const asset of publishedAssets) {
    const rewards = asset.metrics.map((m) => Number(m.rewardScore));
    if (rewards.length < 3) continue;

    const declining = rewards[0] < rewards[1] && rewards[1] < rewards[2];
    if (declining && rewards[0] < 0) {
      anomalies.push({
        type: "reward_declining",
        severity: "warning",
        productName: asset.productIdentity?.title ?? null,
        message: `Video ${asset.assetCode} reward giảm liên tục (${rewards.map((r) => r.toFixed(1)).join(" → ")})`,
        suggestion: "Xem xét thay đổi hook hoặc format cho sản phẩm này",
        identityId: asset.productIdentityId,
      });
    }
  }

  // 2. Low performers — assets with very low views after publishing
  const lowPerformers = await prisma.contentAsset.findMany({
    where: {
      status: "published",
      publishedAt: { not: null },
      metrics: { some: { views: { lt: 100 } } },
    },
    select: {
      assetCode: true,
      productIdentityId: true,
      productIdentity: { select: { title: true } },
      metrics: {
        orderBy: { capturedAt: "desc" },
        take: 1,
        select: { views: true, rewardScore: true },
      },
    },
    take: 10,
    orderBy: { publishedAt: "desc" },
  });

  for (const asset of lowPerformers) {
    const latestViews = asset.metrics[0]?.views ?? 0;
    const reward = Number(asset.metrics[0]?.rewardScore ?? 0);
    if (latestViews < 100 && reward < -0.5) {
      anomalies.push({
        type: "low_performers",
        severity: "info",
        productName: asset.productIdentity?.title ?? null,
        message: `Video ${asset.assetCode} chỉ ${latestViews} views, reward ${reward.toFixed(1)}`,
        suggestion: "Cân nhắc thay đổi content strategy cho sản phẩm này",
        identityId: asset.productIdentityId,
      });
    }
  }

  // 3. Competition spike — products with KOL count increasing >50%
  const identities = await prisma.productIdentity.findMany({
    where: { inboxState: { in: ["scored", "briefed", "published"] }, product: { isNot: null } },
    select: {
      id: true,
      title: true,
      product: { select: { id: true, name: true } },
    },
    take: 50,
  });

  const productIds = identities
    .filter((i) => i.product)
    .map((i) => i.product!.id);

  if (productIds.length > 0) {
    const allSnapshots = await prisma.productSnapshot.findMany({
      where: { productId: { in: productIds } },
      orderBy: { snapshotDate: "desc" },
      select: { productId: true, totalKOL: true, sales7d: true },
    });

    // Group snapshots by productId (max 2 per product)
    const snapshotMap = new Map<string, Array<{ totalKOL: number | null; sales7d: number | null }>>();
    for (const snap of allSnapshots) {
      const existing = snapshotMap.get(snap.productId);
      if (!existing) {
        snapshotMap.set(snap.productId, [snap]);
      } else if (existing.length < 2) {
        existing.push(snap);
      }
    }

    for (const identity of identities) {
      if (!identity.product) continue;
      const snapshots = snapshotMap.get(identity.product.id);
      if (!snapshots || snapshots.length < 2) continue;

      const [latest, prev] = snapshots;

      // Competition spike
      const prevKOL = prev.totalKOL ?? 0;
      const latestKOL = latest.totalKOL ?? 0;
      if (prevKOL > 0 && (latestKOL - prevKOL) / prevKOL > 0.5) {
        anomalies.push({
          type: "competition_spike",
          severity: "warning",
          productName: identity.title ?? identity.product.name,
          message: `KOL tăng từ ${prevKOL} lên ${latestKOL} (+${Math.round(((latestKOL - prevKOL) / prevKOL) * 100)}%)`,
          suggestion: "Cạnh tranh tăng — xem xét tăng chất lượng content để khác biệt hóa",
          identityId: identity.id,
        });
      }

      // Sales drop
      const prevSales = prev.sales7d ?? 0;
      const latestSales = latest.sales7d ?? 0;
      if (prevSales > 0 && (latestSales - prevSales) / prevSales < -0.3) {
        const dropPct = Math.round(((prevSales - latestSales) / prevSales) * 100);
        anomalies.push({
          type: "sales_drop",
          severity: "warning",
          productName: identity.title ?? identity.product.name,
          message: `Doanh số 7 ngày giảm ${dropPct}% (${prevSales} → ${latestSales})`,
          suggestion: "Sản phẩm đang suy giảm — xem xét chuyển sang sản phẩm khác",
          identityId: identity.id,
        });
      }
    }
  }

  return anomalies.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
