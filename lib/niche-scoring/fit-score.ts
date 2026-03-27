import type { CategoryStats, UserProfile } from "./types";
import type { CategoryTag } from "./category-tags";

/**
 * Compute fit score based on user constraints.
 *
 * Base scores:
 *   both = 70, manual = 60, ai_video = 50
 *
 * Modifiers adjust based on content type, buy preference, experience, target.
 */
export function computeFitScore(
  stats: CategoryStats,
  tags: CategoryTag[],
  profile: UserProfile,
  medianVideosPerKOL: number
): number {
  // Base score depends on content type flexibility
  const baseScores: Record<string, number> = {
    both: 70,
    manual: 60,
    ai_video: 50,
  };
  let score = baseScores[profile.contentType] ?? 50;

  const isAI = profile.contentType === "ai_video";
  const isManual = profile.contentType === "manual";
  const hasTag = (t: CategoryTag): boolean => tags.includes(t);

  // --- Content type modifiers ---
  if (isAI) {
    if (
      hasTag("product_photo") ||
      hasTag("text_review") ||
      hasTag("render_scene")
    ) {
      score += 25; // AI-friendly categories
    }
    if (hasTag("demo_required")) score -= 30;
    if (hasTag("fashion")) score -= 15;
    if (hasTag("lifestyle")) score -= 10;
  }

  if (isManual && hasTag("demo_required")) {
    score += 10; // Manual creators have advantage in demo categories
  }

  // --- Buy product modifier ---
  // Heavy penalty: can't demo without buying the product
  if (!profile.buyProduct && hasTag("demo_required")) {
    score -= 40;
  }

  // --- Experience modifiers ---
  if (profile.experience === "new") {
    const videosPerKOL =
      stats.totalKOL > 0 ? stats.totalVideos / stats.totalKOL : 0;
    if (videosPerKOL > medianVideosPerKOL) {
      score -= 15; // High competition penalizes new creators
    }
    if (stats.newSurgeRatio > 0.3) {
      score += 10; // Growing market = easier entry for new creators
    }
  }

  // --- Target income modifiers ---
  if (profile.targetIncome >= 50_000_000) {
    if (stats.revPerOrder < 5000) score -= 20;
    if (stats.revPerOrder > 15000) score += 15;
  }

  return Math.max(0, Math.min(100, score));
}
