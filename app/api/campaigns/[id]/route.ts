import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { updateCampaignSchema } from "@/lib/validations/schemas-campaigns";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, price: true, commissionRate: true, imageUrl: true } },
        contentPosts: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Không tìm thấy campaign", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi lay chi tiet campaign:", error);
    return NextResponse.json(
      { error: message, code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const validation = await validateBody(request, updateCampaignSchema);
    if (validation.error) return validation.error;
    const body = validation.data;

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy campaign", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Build update data from provided fields
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.platform !== undefined) updateData.platform = body.platform;
    if (body.productId !== undefined) updateData.productId = body.productId;
    if (body.plannedBudgetDaily !== undefined) updateData.plannedBudgetDaily = body.plannedBudgetDaily;
    if (body.plannedDurationDays !== undefined) updateData.plannedDurationDays = body.plannedDurationDays;
    if (body.affiliateLink !== undefined) updateData.affiliateLink = body.affiliateLink;
    if (body.contentUrl !== undefined) updateData.contentUrl = body.contentUrl;
    if (body.contentType !== undefined) updateData.contentType = body.contentType;
    if (body.contentNotes !== undefined) updateData.contentNotes = body.contentNotes;
    if (body.checklist !== undefined) updateData.checklist = body.checklist;
    if (body.verdict !== undefined) updateData.verdict = body.verdict;
    if (body.lessonsLearned !== undefined) updateData.lessonsLearned = body.lessonsLearned;

    // Handle status transitions
    if (body.status !== undefined) {
      updateData.status = body.status;

      // If changing to "running" and startedAt is null, set startedAt
      if (body.status === "running" && !existing.startedAt) {
        updateData.startedAt = new Date();
      }

      // If changing to "completed", set endedAt
      if (body.status === "completed") {
        updateData.endedAt = new Date();
      }
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: updateData,
      include: {
        product: { select: { id: true, name: true } },
        contentPosts: true,
      },
    });

    return NextResponse.json({
      message: "Đã cập nhật campaign",
      data: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi cap nhat campaign:", error);
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

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy campaign", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    await prisma.campaign.delete({ where: { id } });

    return NextResponse.json({ message: "Đã xóa campaign" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi xoa campaign:", error);
    return NextResponse.json(
      { error: message, code: "DELETE_ERROR" },
      { status: 500 }
    );
  }
}
