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

  // Engagement — all log-scale to prevent viral outlier distortion
  if (metrics.shares) reward += Math.log(1 + metrics.shares) * 2;
  if (metrics.saves) reward += Math.log(1 + metrics.saves) * 1.5;
  if (metrics.likes) reward += Math.log(1 + metrics.likes) * 0.3;

  // Comments = intent mua (log-scale)
  if (metrics.comments) reward += Math.log(1 + metrics.comments) * 1;

  // Completion rate (từ extension — 0-1)
  if (metrics.completionRate) {
    reward += metrics.completionRate * 5;
  }

  // Orders — log-scale, still highest weight
  if (metrics.orders) reward += Math.log(1 + metrics.orders) * 5;

  // Commission (tiền thật)
  if (metrics.commissionAmount) {
    reward += Math.log(1 + metrics.commissionAmount / 1000) * 2;
  }

  // Fix E2: Cap reward to prevent viral video distortion (e.g. 39,000+ score)
  return Math.min(100, Math.round(reward * 100) / 100);
}
