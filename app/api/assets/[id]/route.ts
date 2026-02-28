// Phase 3: PATCH /api/assets/[id] — Update asset status, published_url
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { updateAssetSchema } from "@/lib/validations/schemas-content";
import { syncSlotStatusFromAsset } from "@/lib/content/sync-slot-status";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const validation = await validateBody(request, updateAssetSchema);
    if (validation.error) return validation.error;
    const body = validation.data;

    const existing = await prisma.contentAsset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy asset" },
        { status: 404 },
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;
    if (body.publishedUrl) {
      updateData.publishedUrl = body.publishedUrl;
      updateData.publishedAt = new Date();
    }
    if (body.postId) updateData.postId = body.postId;
    if (body.scriptText !== undefined) updateData.scriptText = body.scriptText;
    if (body.captionText !== undefined) updateData.captionText = body.captionText;
    if (body.ctaText !== undefined) updateData.ctaText = body.ctaText;

    const updated = await prisma.contentAsset.update({
      where: { id },
      data: updateData,
    });

    // Sync linked calendar slots when status changes
    if (body.status) {
      await syncSlotStatusFromAsset(id, body.status);
    }

    return NextResponse.json({
      data: updated,
      message: `Đã cập nhật asset ${updated.assetCode}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
