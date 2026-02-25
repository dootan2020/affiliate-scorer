import { prisma } from "@/lib/db";
import { detectAnomalies } from "@/lib/ai/anomaly-detection";

interface BriefItem {
  priority: "urgent" | "opportunity" | "prepare" | "routine";
  icon: string;
  text: string;
  actionHref: string;
}

/** Add anomaly-based items to the morning brief */
export async function getAnomalyItems(): Promise<BriefItem[]> {
  const items: BriefItem[] = [];
  const anomalies = await detectAnomalies();

  for (const anomaly of anomalies) {
    const href = anomaly.campaignId
      ? `/campaigns/${anomaly.campaignId}`
      : "/campaigns";

    if (anomaly.severity === "urgent") {
      items.push({
        priority: "urgent",
        icon: "AlertOctagon",
        text: anomaly.message,
        actionHref: href,
      });
    } else {
      items.push({
        priority: anomaly.severity === "warning" ? "opportunity" : "routine",
        icon: "AlertTriangle",
        text: anomaly.message,
        actionHref: href,
      });
    }
  }

  return items;
}

/** Find new products discovered in the last 3 days */
export async function getNewProductItems(
  now: Date
): Promise<BriefItem[]> {
  const items: BriefItem[] = [];
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const newProducts = await prisma.product.findMany({
    where: {
      firstSeenAt: { gte: threeDaysAgo },
      aiScore: { not: null },
    },
    orderBy: { aiScore: "desc" },
    take: 3,
    select: { id: true, name: true, aiScore: true },
  });

  if (newProducts.length > 0) {
    const productNames = newProducts
      .map((p) => p.name.substring(0, 20))
      .join(", ");
    items.push({
      priority: "routine",
      icon: "Sparkles",
      text: `${newProducts.length} SP mới: ${productNames}`,
      actionHref: "/products?sort=newest",
    });
  }

  return items;
}
