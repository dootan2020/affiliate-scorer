import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface UpdateContentPostBody {
  url?: string;
  platform?: string;
  campaignId?: string | null;
  productId?: string | null;
  contentType?: string | null;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  notes?: string | null;
  postedAt?: string | null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = (await request.json()) as UpdateContentPostBody;

    const existing = await prisma.contentPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Khong tim thay content post", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (body.url !== undefined) updateData.url = body.url;
    if (body.platform !== undefined) updateData.platform = body.platform;
    if (body.campaignId !== undefined) updateData.campaignId = body.campaignId;
    if (body.productId !== undefined) updateData.productId = body.productId;
    if (body.contentType !== undefined) updateData.contentType = body.contentType;
    if (body.views !== undefined) updateData.views = body.views;
    if (body.likes !== undefined) updateData.likes = body.likes;
    if (body.comments !== undefined) updateData.comments = body.comments;
    if (body.shares !== undefined) updateData.shares = body.shares;
    if (body.notes !== undefined) updateData.notes = body.notes;

    if (body.postedAt !== undefined) {
      if (body.postedAt === null) {
        updateData.postedAt = null;
      } else {
        const parsed = new Date(body.postedAt);
        if (isNaN(parsed.getTime())) {
          return NextResponse.json(
            { error: "postedAt khong hop le", code: "INVALID_DATE" },
            { status: 400 }
          );
        }
        updateData.postedAt = parsed;
      }
    }

    const updated = await prisma.contentPost.update({
      where: { id },
      data: updateData,
      include: {
        campaign: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      message: "Da cap nhat content post",
      data: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi cap nhat content post:", error);
    return NextResponse.json(
      { error: message, code: "UPDATE_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const existing = await prisma.contentPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Khong tim thay content post", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    await prisma.contentPost.delete({ where: { id } });

    return NextResponse.json({ message: "Da xoa content post" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi xoa content post:", error);
    return NextResponse.json(
      { error: message, code: "DELETE_ERROR" },
      { status: 500 }
    );
  }
}
