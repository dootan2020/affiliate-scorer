import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** POST — archive (soft-delete) multiple ProductIdentity records */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const ids = body.ids as string[];

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Cần ít nhất 1 ID" }, { status: 400 });
    }

    if (ids.length > 100) {
      return NextResponse.json({ error: "Tối đa 100 sản phẩm mỗi lần" }, { status: 400 });
    }

    // Soft delete — set inboxState to "archived"
    const result = await prisma.productIdentity.updateMany({
      where: { id: { in: ids } },
      data: { inboxState: "archived" },
    });

    return NextResponse.json({
      message: `Đã xóa ${result.count} sản phẩm`,
      deleted: result.count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
