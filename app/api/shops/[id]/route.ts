import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { updateShopSchema } from "@/lib/validations/schemas-shops";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const shop = await prisma.shop.findUnique({ where: { id } });

    if (!shop) {
      return NextResponse.json(
        { error: "Không tìm thấy shop", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Count products with matching shopName
    const productCount = await prisma.product.count({
      where: { shopName: shop.name },
    });

    return NextResponse.json({
      data: { ...shop, productCount },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi lấy chi tiết shop:", error);
    return NextResponse.json(
      { error: message, code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const validation = await validateBody(request, updateShopSchema);
    if (validation.error) return validation.error;
    const body = validation.data;

    // Check shop exists
    const existing = await prisma.shop.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy shop", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const updated = await prisma.shop.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.platform !== undefined && { platform: body.platform }),
        ...(body.commissionReliability !== undefined && { commissionReliability: body.commissionReliability }),
        ...(body.supportQuality !== undefined && { supportQuality: body.supportQuality }),
        ...(body.samplePolicy !== undefined && { samplePolicy: body.samplePolicy }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    return NextResponse.json({
      message: "Đã cập nhật shop",
      data: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi cập nhật shop:", error);
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

    const existing = await prisma.shop.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy shop", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    await prisma.shop.delete({ where: { id } });

    return NextResponse.json({ message: "Đã xóa shop" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi xóa shop:", error);
    return NextResponse.json(
      { error: message, code: "DELETE_ERROR" },
      { status: 500 }
    );
  }
}
