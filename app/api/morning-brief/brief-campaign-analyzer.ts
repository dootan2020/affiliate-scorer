interface BriefItem {
  priority: "urgent" | "opportunity" | "prepare" | "routine";
  icon: string;
  text: string;
  actionHref: string;
}

interface DailyResultEntry {
  date: string;
  spend: number;
  orders: number;
  revenue: number;
  clicks?: number;
  notes?: string;
}

interface ChecklistItem {
  label: string;
  dueDay: number;
  completed: boolean;
  completedAt: string | null;
}

interface CampaignWithProduct {
  id: string;
  name: string;
  status: string;
  roas: number | null;
  dailyResults: unknown;
  checklist: unknown;
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
    const results =
      (campaign.dailyResults as unknown as DailyResultEntry[]) ?? [];
    const campaignHref = `/campaigns/${campaign.id}`;

    // URGENT: last 3 daily results all have spend > revenue
    if (results.length >= 3) {
      const lastThree = results.slice(-3);
      const allLosing = lastThree.every((r) => r.spend > r.revenue);
      if (allLosing) {
        items.push({
          priority: "urgent",
          icon: "AlertTriangle",
          text: `${campaign.name}: 3 ngay lien tuc lo — nen tam dung`,
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
        text: `${campaign.name}: ROAS ${campaign.roas} — co the tang budget`,
        actionHref: campaignHref,
      });
    }

    // ROUTINE: missing yesterday's result
    const hasYesterday = results.some((r) => r.date === yesterdayStr);
    if (!hasYesterday) {
      items.push({
        priority: "routine",
        icon: "ClipboardList",
        text: `${campaign.name}: chua nhap ket qua hom qua`,
        actionHref: `${campaignHref}#daily-results`,
      });
    }

    // Due checklist items
    const checklist =
      (campaign.checklist as unknown as ChecklistItem[]) ?? [];
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
            text: `${campaign.name}: "${item.label}" da den han`,
            actionHref: campaignHref,
          });
        }
      }
    }
  }

  return items;
}
