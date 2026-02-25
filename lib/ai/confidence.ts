import { prisma } from "@/lib/db";

export interface ConfidenceMetrics {
  productsCount: number;
  productsWithNotes: number;
  campaignsTotal: number;
  campaignsCompleted: number;
  financialRecords: number;
  contentPosts: number;
  shopsRated: number;
  daysActive: number;
  uploadsCount: number;
}

export interface ConfidenceLevel {
  level: number;
  label: string;
  percent: number;
  metrics: ConfidenceMetrics;
  nextLevel: { label: string; needs: string[] } | null;
}

const LABELS = ["Cơ bản", "Sơ khởi", "Trung bình", "Cao", "Chuyên gia"] as const;

const THRESHOLDS = [15, 30, 55, 75] as const;

function computePercent(metrics: ConfidenceMetrics): number {
  const products = Math.min(metrics.productsCount / 50, 1) * 10;
  const notes = Math.min(metrics.productsWithNotes / 10, 1) * 10;
  const campaigns = Math.min(metrics.campaignsCompleted / 5, 1) * 25;
  const financial = Math.min(metrics.financialRecords / 20, 1) * 15;
  const content = Math.min(metrics.contentPosts / 5, 1) * 10;
  const shops = Math.min(metrics.shopsRated / 5, 1) * 5;
  const days = Math.min(metrics.daysActive / 30, 1) * 15;
  const uploads = Math.min(metrics.uploadsCount / 10, 1) * 10;

  return Math.round(products + notes + campaigns + financial + content + shops + days + uploads);
}

function resolveLevel(percent: number): number {
  if (percent >= THRESHOLDS[3]) return 4;
  if (percent >= THRESHOLDS[2]) return 3;
  if (percent >= THRESHOLDS[1]) return 2;
  if (percent >= THRESHOLDS[0]) return 1;
  return 0;
}

function buildNextLevel(
  level: number,
  metrics: ConfidenceMetrics,
): { label: string; needs: string[] } | null {
  if (level >= 4) return null;

  const needs: string[] = [];
  if (metrics.productsCount < 50) needs.push(`Thêm ${50 - metrics.productsCount} sản phẩm`);
  if (metrics.productsWithNotes < 10) needs.push(`Ghi note cho ${10 - metrics.productsWithNotes} sản phẩm`);
  if (metrics.campaignsCompleted < 5) needs.push(`Hoàn thành ${5 - metrics.campaignsCompleted} chiến dịch`);
  if (metrics.financialRecords < 20) needs.push(`Thêm ${20 - metrics.financialRecords} giao dịch tài chính`);
  if (metrics.contentPosts < 5) needs.push(`Thêm ${5 - metrics.contentPosts} bài đăng content`);
  if (metrics.shopsRated < 5) needs.push(`Đánh giá ${5 - metrics.shopsRated} shop`);
  if (metrics.uploadsCount < 10) needs.push(`Upload ${10 - metrics.uploadsCount} file dữ liệu`);

  return { label: LABELS[level + 1] ?? "Chuyên gia", needs: needs.slice(0, 3) };
}

export async function calculateConfidence(): Promise<ConfidenceLevel> {
  const [
    productsCount,
    productsWithNotes,
    campaignsTotal,
    campaignsCompleted,
    financialRecords,
    contentPosts,
    shopsRated,
    uploadsCount,
    oldestProduct,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { personalNotes: { not: null } } }),
    prisma.campaign.count(),
    prisma.campaign.count({ where: { status: "completed" } }),
    prisma.financialRecord.count(),
    prisma.contentPost.count(),
    prisma.shop.count({ where: { commissionReliability: { not: null } } }),
    prisma.importBatch.count(),
    prisma.product.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
  ]);

  const daysActive = oldestProduct
    ? Math.floor((Date.now() - oldestProduct.createdAt.getTime()) / 86_400_000)
    : 0;

  const metrics: ConfidenceMetrics = {
    productsCount,
    productsWithNotes,
    campaignsTotal,
    campaignsCompleted,
    financialRecords,
    contentPosts,
    shopsRated,
    daysActive,
    uploadsCount,
  };

  const percent = computePercent(metrics);
  const level = resolveLevel(percent);

  return {
    level,
    label: LABELS[level],
    percent,
    metrics,
    nextLevel: buildNextLevel(level, metrics),
  };
}
