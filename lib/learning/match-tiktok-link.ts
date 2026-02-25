// Phase 4: Match TikTok video link → ContentAsset
import { prisma } from "@/lib/db";

interface MatchResult {
  assetId: string | null;
  assetCode: string | null;
  productTitle: string | null;
  format: string | null;
  hookType: string | null;
  matchMethod: "post_id" | "published_url" | "none";
}

/** Extract post_id từ TikTok URL */
export function extractPostId(url: string): string | null {
  const match = url.match(/video\/(\d+)/);
  return match?.[1] || null;
}

/** Match TikTok link → asset */
export async function matchTikTokLink(url: string): Promise<MatchResult> {
  const postId = extractPostId(url);

  // 1. Match by post_id
  if (postId) {
    const asset = await prisma.contentAsset.findFirst({
      where: { postId },
      include: { productIdentity: { select: { title: true } } },
    });
    if (asset) {
      return {
        assetId: asset.id,
        assetCode: asset.assetCode,
        productTitle: asset.productIdentity?.title || null,
        format: asset.format,
        hookType: asset.hookType,
        matchMethod: "post_id",
      };
    }
  }

  // 2. Match by published_url (normalized)
  const normalizedUrl = url.split("?")[0]; // Strip query params
  const asset = await prisma.contentAsset.findFirst({
    where: {
      publishedUrl: { contains: normalizedUrl },
    },
    include: { productIdentity: { select: { title: true } } },
  });

  if (asset) {
    return {
      assetId: asset.id,
      assetCode: asset.assetCode,
      productTitle: asset.productIdentity?.title || null,
      format: asset.format,
      hookType: asset.hookType,
      matchMethod: "published_url",
    };
  }

  // 3. Không match
  return {
    assetId: null,
    assetCode: null,
    productTitle: null,
    format: null,
    hookType: null,
    matchMethod: "none",
  };
}
