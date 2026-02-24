import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

interface UpdateShopBody {
  name?: string;
  platform?: string;
  commissionReliability?: number | null;
  supportQuality?: number | null;
  samplePolicy?: string | null;
  notes?: string | null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = (await request.json()) as UpdateShopBody;

    // Check shop exists
    const existing = await prisma.shop.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy shop", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Validate commissionReliability if provided
    if (body.commissionReliability !== undefined && body.commissionReliability !== null) {
      if (
        !Number.isInteger(body.commissionReliability) ||
        body.commissionReliability < 1 ||
        body.commissionReliability > 5
      ) {
        return NextResponse.json(
          { error: "commissionReliability phải là số nguyên từ 1 đến 5", code: "INVALID_RATING" },
          { status: 400 }
        );
      }
    }

    // Validate supportQuality if provided
    if (body.supportQuality !== undefined && body.supportQuality !== null) {
      if (
        !Number.isInteger(body.supportQuality) ||
        body.supportQuality < 1 ||
        body.supportQuality > 5
      ) {
        return NextResponse.json(
          { error: "supportQuality phải là số nguyên từ 1 đến 5", code: "INVALID_RATING" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.shop.update({
      where: { id },
      data: body,
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
