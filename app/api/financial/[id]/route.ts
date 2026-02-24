import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface UpdateFinancialBody {
  type?: string;
  amount?: number;
  source?: string;
  productId?: string | null;
  campaignId?: string | null;
  date?: string;
  notes?: string | null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = (await request.json()) as UpdateFinancialBody;

    // Check record exists
    const existing = await prisma.financialRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy bản ghi tài chính", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Validate amount if provided
    if (body.amount !== undefined) {
      if (typeof body.amount !== "number" || isNaN(body.amount)) {
        return NextResponse.json(
          { error: "amount phải là số hợp lệ", code: "INVALID_AMOUNT" },
          { status: 400 }
        );
      }
    }

    // Parse date if provided
    const updateData: Record<string, unknown> = { ...body };
    if (body.date !== undefined) {
      const parsedDate = new Date(body.date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: "date không hợp lệ. Dùng format ISO", code: "INVALID_DATE" },
          { status: 400 }
        );
      }
      updateData.date = parsedDate;
    }

    const updated = await prisma.financialRecord.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Đã cập nhật bản ghi tài chính",
      data: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi cập nhật bản ghi tài chính:", error);
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

    const existing = await prisma.financialRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy bản ghi tài chính", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    await prisma.financialRecord.delete({ where: { id } });

    return NextResponse.json({ message: "Đã xóa bản ghi tài chính" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi xóa bản ghi tài chính:", error);
    return NextResponse.json(
      { error: message, code: "DELETE_ERROR" },
      { status: 500 }
    );
  }
}
