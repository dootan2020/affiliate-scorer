// Phase 3: POST /api/production/create-batch — Tạo batch sản xuất từ assets
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { createProductionBatchSchema } from "@/lib/validations/schemas-content";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const validation = await validateBody(request, createProductionBatchSchema);
    if (validation.error) return validation.error;
    const { assetIds, notes } = validation.data;

    // Atomic: tạo batch + gán assets trong 1 transaction
    const batch = await prisma.$transaction(async (tx) => {
      const newBatch = await tx.productionBatch.create({
        data: {
          targetVideoCount: assetIds.length,
          notes: notes || null,
        },
      });

      await tx.contentAsset.updateMany({
        where: { id: { in: assetIds } },
        data: { productionBatchId: newBatch.id },
      });

      return newBatch;
    });

    return NextResponse.json({
      data: batch,
      message: `Đã tạo batch với ${assetIds.length} video`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
