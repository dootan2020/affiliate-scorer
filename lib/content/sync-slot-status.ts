// Sync ContentSlot status when linked ContentAsset status changes.
// Bidirectional: asset going forward OR backward updates slot accordingly.
// TODO v2: Thêm manualOverride flag để user skip slot không bị sync ghi đè

import { prisma } from "@/lib/db";

const ASSET_TO_SLOT_STATUS: Record<string, string> = {
  draft: "planned",
  produced: "produced",
  rendered: "rendered",
  published: "published",
  archived: "skipped",
  logged: "published",
  failed: "skipped",
};

/**
 * Find all ContentSlots linked to this asset and update their status.
 * Also propagates isWinner if provided.
 */
export async function syncSlotStatusFromAsset(
  contentAssetId: string,
  assetStatus: string,
  isWinner?: boolean,
): Promise<number> {
  const slotStatus = ASSET_TO_SLOT_STATUS[assetStatus];
  if (!slotStatus) return 0;

  const data: Record<string, unknown> = { status: slotStatus };
  if (isWinner !== undefined) {
    data.notes = isWinner ? "🏆 Winner" : null;
  }

  const result = await prisma.contentSlot.updateMany({
    where: { contentAssetId },
    data,
  });

  return result.count;
}
