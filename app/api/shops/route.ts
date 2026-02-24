import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  try {
    const shops = await prisma.shop.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ data: shops });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi lấy danh sách shop:", error);
    return NextResponse.json(
      { error: message, code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

interface CreateShopBody {
  name: string;
  platform: string;
  commissionReliability?: number;
  supportQuality?: number;
  samplePolicy?: string;
  notes?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CreateShopBody;

    // Validate required fields
    if (!body.name || !body.platform) {
      return NextResponse.json(
        { error: "Tên shop và platform là bắt buộc", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    // Validate commissionReliability if provided
    if (body.commissionReliability !== undefined) {
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
    if (body.supportQuality !== undefined) {
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

    const shop = await prisma.shop.create({
      data: {
        name: body.name,
        platform: body.platform,
        commissionReliability: body.commissionReliability ?? null,
        supportQuality: body.supportQuality ?? null,
        samplePolicy: body.samplePolicy ?? null,
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json(
      { message: "Đã tạo shop mới", data: shop },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi tạo shop:", error);
    return NextResponse.json(
      { error: message, code: "CREATE_ERROR" },
      { status: 500 }
    );
  }
}
