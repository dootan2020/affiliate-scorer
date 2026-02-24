import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface NotesBody {
  notes?: string;
  rating?: number;
  tags?: string[];
  affiliateLink?: string;
  affiliateLinkStatus?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = (await request.json()) as NotesBody;

    // Validate rating if provided
    if (body.rating !== undefined) {
      if (
        !Number.isInteger(body.rating) ||
        body.rating < 1 ||
        body.rating > 5
      ) {
        return NextResponse.json(
          { error: "Rating phải là số nguyên từ 1 đến 5", code: "INVALID_RATING" },
          { status: 400 }
        );
      }
    }

    // Check product exists
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy sản phẩm", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.notes !== undefined) {
      updateData.personalNotes = body.notes;
    }
    if (body.rating !== undefined) {
      updateData.personalRating = body.rating;
    }
    if (body.tags !== undefined) {
      updateData.personalTags = body.tags;
    }
    if (body.affiliateLinkStatus !== undefined) {
      updateData.affiliateLinkStatus = body.affiliateLinkStatus;
    }
    if (body.affiliateLink !== undefined) {
      // If affiliate link changed, set createdAt timestamp
      if (body.affiliateLink !== existing.affiliateLink) {
        updateData.affiliateLink = body.affiliateLink;
        updateData.affiliateLinkCreatedAt = new Date();
      } else {
        updateData.affiliateLink = body.affiliateLink;
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Đã cập nhật ghi chú sản phẩm",
      data: {
        id: updated.id,
        personalNotes: updated.personalNotes,
        personalRating: updated.personalRating,
        personalTags: updated.personalTags,
        affiliateLink: updated.affiliateLink,
        affiliateLinkStatus: updated.affiliateLinkStatus,
        affiliateLinkCreatedAt: updated.affiliateLinkCreatedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi cập nhật ghi chú sản phẩm:", error);
    return NextResponse.json(
      { error: message, code: "UPDATE_ERROR" },
      { status: 500 }
    );
  }
}
