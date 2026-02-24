import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
        { error: "Khong tim thay campaign", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi lay chi tiet campaign:", error);
    return NextResponse.json(
      { error: message, code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

interface UpdateCampaignBody {
  name?: string;
  platform?: string;
  productId?: string | null;
  plannedBudgetDaily?: number | null;
  plannedDurationDays?: number | null;
  affiliateLink?: string | null;
  contentUrl?: string | null;
  contentType?: string | null;
  contentNotes?: string | null;
  status?: string;
  checklist?: unknown;
  verdict?: string | null;
  lessonsLearned?: string | null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = (await request.json()) as UpdateCampaignBody;

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Khong tim thay campaign", code: "NOT_FOUND" },
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
      message: "Da cap nhat campaign",
      data: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi cap nhat campaign:", error);
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
        { error: "Khong tim thay campaign", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    await prisma.campaign.delete({ where: { id } });

    return NextResponse.json({ message: "Da xoa campaign" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi xoa campaign:", error);
    return NextResponse.json(
      { error: message, code: "DELETE_ERROR" },
      { status: 500 }
    );
  }
}
