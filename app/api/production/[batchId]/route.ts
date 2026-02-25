// Phase 3: GET /api/production/[batchId] — Xem batch + assets
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
