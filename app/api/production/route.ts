// GET /api/production — list/count production batches with optional status filter
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Map client-friendly status names to DB values */
const STATUS_MAP: Record<string, string> = {
  in_progress: "active",
  active: "active",
  done: "done",
  completed: "done",
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const status = request.nextUrl.searchParams.get("status");
    const where = status && STATUS_MAP[status] ? { status: STATUS_MAP[status] } : {};

    const total = await prisma.productionBatch.count({ where });

    return NextResponse.json({ total, pagination: { total } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
