// Phase 2: GET/PUT /api/inbox/[id] — chi tiết + cập nhật product identity
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { updateInboxItemSchema } from "@/lib/validations/schemas-content";
import { validateTransition } from "@/lib/state-machines/transitions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const identity = await prisma.productIdentity.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            aiScore: true,
            aiRank: true,
            sales7d: true,
            salesTotal: true,
            totalKOL: true,
            imageUrl: true,
            category: true,
            price: true,
            commissionRate: true,
          },
        },
        urls: true,
        inboxItems: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!identity) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }

    return NextResponse.json({ data: identity });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PUT — cập nhật metadata, state, personal notes */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const validation = await validateBody(request, updateInboxItemSchema);
    if (validation.error) return validation.error;
    const body = validation.data;

    // Chỉ cho phép update các fields sau
    const allowedFields = [
      "title", "shopName", "category", "price", "commissionRate",
      "imageUrl", "description", "inboxState",
      "personalNotes", "personalRating", "personalTags",
    ];

    const updateData: Record<string, unknown> = {};
    const rawBody = body as Record<string, unknown>;
    for (const field of allowedFields) {
      if (field in rawBody) {
        updateData[field] = rawBody[field];
      }
    }

    // Nếu có metadata mới → chuyển state sang enriched (trừ khi đã cao hơn)
    const hasMetadata = ["title", "shopName", "category", "price", "commissionRate"].some(
      (f) => f in rawBody && rawBody[f] !== null && rawBody[f] !== "",
    );

    // Validate explicit inboxState transition
    if (updateData.inboxState && typeof updateData.inboxState === "string") {
      const current = await prisma.productIdentity.findUnique({
        where: { id },
        select: { inboxState: true },
      });
      if (current) {
        const check = validateTransition("inboxState", current.inboxState, updateData.inboxState as string);
        if (!check.valid) {
          return NextResponse.json({ error: check.error }, { status: 400 });
        }
      }
    }

    // Auto-enrich: new → enriched when metadata is added
    if (hasMetadata && !updateData.inboxState) {
      const current = await prisma.productIdentity.findUnique({
        where: { id },
        select: { inboxState: true },
      });
      if (current && current.inboxState === "new") {
        updateData.inboxState = "enriched";
      }
    }

    const updated = await prisma.productIdentity.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
