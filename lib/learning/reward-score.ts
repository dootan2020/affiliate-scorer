// Phase 4: Reward score calculation từ metrics

interface MetricsInput {
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  saves?: number | null;
  completionRate?: number | null;
  orders?: number | null;
  commissionAmount?: number | null;
}

/**
 * Tính reward score từ metrics.
 * Views dùng log scale (100K views không gấp 10x giá trị 10K views).
 * Shares + saves quan trọng hơn likes.
 * Orders là ultimate metric — weight cao nhất.
 */
export function calculateReward(metrics: MetricsInput): number {
  let reward = 0;

  // Views (log scale)
  if (metrics.views) {
    reward += Math.log(1 + metrics.views) * 1.0;
  }

  // Engagement (shares + saves quan trọng hơn likes)
  if (metrics.shares) reward += metrics.shares * 0.5;
  if (metrics.saves) reward += metrics.saves * 0.3;
  if (metrics.likes) reward += Math.log(1 + metrics.likes) * 0.3;

  // Comments = intent mua
  if (metrics.comments) reward += metrics.comments * 0.2;

  // Completion rate (từ extension — 0-1)
  if (metrics.completionRate) {
    reward += metrics.completionRate * 5;
  }

  // Orders — weight cao nhất
  if (metrics.orders) reward += metrics.orders * 10;

  // Commission (tiền thật)
  if (metrics.commissionAmount) {
    reward += Math.log(1 + metrics.commissionAmount / 1000) * 2;
  }

  return Math.round(reward * 100) / 100;
}
