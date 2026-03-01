// Phase 3: GET/PATCH /api/production/[batchId] — Xem + cập nhật batch
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateTransition } from "@/lib/state-machines/transitions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> },
): Promise<NextResponse> {
  try {
    const { batchId } = await params;

    const batch = await prisma.productionBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json(
        { error: "Không tìm thấy batch" },
        { status: 404 },
      );
    }

    const assets = await prisma.contentAsset.findMany({
      where: { productionBatchId: batchId },
      include: { productIdentity: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      data: { ...batch, assets },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PATCH — manually update batch status (cancel, etc.) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> },
): Promise<NextResponse> {
  try {
    const { batchId } = await params;
    const body = await request.json();
    const newStatus = body.status as string | undefined;

    if (!newStatus) {
      return NextResponse.json({ error: "Thiếu field status" }, { status: 400 });
    }

    const batch = await prisma.productionBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json({ error: "Không tìm thấy batch" }, { status: 404 });
    }

    const check = validateTransition("batchStatus", batch.status, newStatus);
    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const updated = await prisma.productionBatch.update({
      where: { id: batchId },
      data: { status: newStatus },
    });

    return NextResponse.json({ data: updated, message: `Batch chuyển sang "${newStatus}"` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
