import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/production/active-count
 * Returns count of ContentAssets with status "draft" or "produced" (active work items).
 */
export async function GET(): Promise<NextResponse> {
  try {
    const count = await prisma.contentAsset.count({
      where: { status: { in: ["draft", "produced"] } },
    });

    return NextResponse.json({ total: count, pagination: { total: count } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
