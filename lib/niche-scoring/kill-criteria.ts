import type { CategoryStats, KillResult, UserProfile } from "./types";
import type { CategoryTag } from "./category-tags";

/**
 * Evaluate kill criteria for a category.
 * Kill = score becomes 0, category shown at bottom with reason.
 *
 * Adjusted: buyProduct=false + demo_required is NOT a kill — just a fit penalty.
 * Only ai_video + demo_required is a hard kill.
 */
export function evaluateKillCriteria(
  stats: CategoryStats,
  profile: UserProfile | null,
  tags: CategoryTag[]
): KillResult {
  const reasons: string[] = [];

  // Commission too low to be viable
  if (stats.avgCommission < 3) {
    reasons.push("Commission TB < 3%");
  }

  // Too few products with actual sales — unreliable data
  if (stats.withSales < 10) {
    reasons.push("Quá ít SP có doanh số");
  }

  // AI video only + demo required = hard kill (can't demo with AI)
  if (
    profile?.contentType === "ai_video" &&
    tags.includes("demo_required")
  ) {
    reasons.push("Ngách cần demo — không phù hợp video AI");
  }

  return { killed: reasons.length > 0, reasons };
}
