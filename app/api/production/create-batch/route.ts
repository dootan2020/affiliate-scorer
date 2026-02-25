// Phase 3: POST /api/production/create-batch — Tạo batch sản xuất từ assets
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { assetIds?: string[]; notes?: string };

    if (!body.assetIds || body.assetIds.length === 0) {
      return NextResponse.json(
        { error: "Thiếu danh sách assetIds" },
        { status: 400 },
      );
    }

    // Tạo batch
    const batch = await prisma.productionBatch.create({
      data: {
        targetVideoCount: body.assetIds.length,
        notes: body.notes || null,
      },
    });

    // Gán assets vào batch
    await prisma.contentAsset.updateMany({
      where: { id: { in: body.assetIds } },
      data: { productionBatchId: batch.id },
    });

    return NextResponse.json({
      data: batch,
      message: `Đã tạo batch với ${body.assetIds.length} video`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
