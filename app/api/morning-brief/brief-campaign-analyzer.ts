import type { JsonValue } from "@/app/generated/prisma/internal/prismaNamespace";
import { parseDailyResults, parseChecklist } from "@/lib/utils/typed-json";

interface BriefItem {
  priority: "urgent" | "opportunity" | "prepare" | "routine";
  icon: string;
  text: string;
  actionHref: string;
}

interface CampaignWithProduct {
  id: string;
  name: string;
  status: string;
  roas: number | null;
  dailyResults: JsonValue;
  checklist: JsonValue;
  startedAt: Date | null;
  product: { name: string } | null;
}

/** Analyze active campaigns and return morning brief items */
export function analyzeCampaigns(
  campaigns: CampaignWithProduct[],
  yesterdayStr: string,
  now: Date
): BriefItem[] {
  const items: BriefItem[] = [];

  for (const campaign of campaigns) {
    const results = parseDailyResults(campaign.dailyResults);
    const campaignHref = `/campaigns/${campaign.id}`;

    // URGENT: last 3 daily results all have spend > revenue
    if (results.length >= 3) {
      const lastThree = results.slice(-3);
      const allLosing = lastThree.every((r) => r.spend > r.revenue);
      if (allLosing) {
        items.push({
          priority: "urgent",
          icon: "AlertTriangle",
          text: `${campaign.name}: 3 ngày liên tục lỗ — nên tạm dừng`,
          actionHref: campaignHref,
        });
      }
    }

    // OPPORTUNITY: roas >= 2.5 and 3+ daily results
    if (
      campaign.roas !== null &&
      campaign.roas >= 2.5 &&
      results.length >= 3
    ) {
      items.push({
        priority: "opportunity",
        icon: "TrendingUp",
        text: `${campaign.name}: ROAS ${campaign.roas} — có thể tăng budget`,
        actionHref: campaignHref,
      });
    }

    // ROUTINE: missing yesterday's result
    const hasYesterday = results.some((r) => r.date === yesterdayStr);
    if (!hasYesterday) {
      items.push({
        priority: "routine",
        icon: "ClipboardList",
        text: `${campaign.name}: chưa nhập kết quả hôm qua`,
        actionHref: `${campaignHref}#daily-results`,
      });
    }

    // Due checklist items
    const checklist = parseChecklist(campaign.checklist);
    if (campaign.startedAt) {
      const startDate = new Date(campaign.startedAt);
      const daysSinceStart = Math.floor(
        (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      for (const item of checklist) {
        if (!item.completed && item.dueDay <= daysSinceStart) {
          items.push({
            priority: "routine",
            icon: "CheckSquare",
            text: `${campaign.name}: "${item.label}" đã đến hạn`,
            actionHref: campaignHref,
          });
        }
      }
    }
  }

  return items;
}
