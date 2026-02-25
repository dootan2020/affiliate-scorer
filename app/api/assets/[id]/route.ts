// Phase 3: PATCH /api/assets/[id] — Update asset status, published_url
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const VALID_STATUSES = ["draft", "produced", "rendered", "published", "logged", "archived", "failed"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      status?: string;
      publishedUrl?: string;
      postId?: string;
      scriptText?: string;
      captionText?: string;
      ctaText?: string;
    };

    // Validate status
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Status không hợp lệ. Cho phép: ${VALID_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }

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

    return NextResponse.json({
      data: updated,
      message: `Đã cập nhật asset ${updated.assetCode}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
