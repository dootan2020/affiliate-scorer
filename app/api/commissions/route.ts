// Phase 5: POST + GET /api/commissions — Commission tracking
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      amount?: number;
      platform?: string;
      earnedDate?: string;
      productIdentityId?: string;
      contentAssetId?: string;
      notes?: string;
    };

    if (!body.amount || !body.earnedDate) {
      return NextResponse.json(
        { error: "Cần nhập số tiền và ngày" },
        { status: 400 },
      );
    }

    const commission = await prisma.commission.create({
      data: {
        amount: body.amount,
        platform: body.platform || "tiktokshop",
        earnedDate: new Date(body.earnedDate),
        productIdentityId: body.productIdentityId || null,
        contentAssetId: body.contentAssetId || null,
        notes: body.notes || null,
        status: "confirmed",
      },
    });

    return NextResponse.json({
      data: commission,
      message: `Đã lưu commission ${body.amount.toLocaleString()}đ`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const month = searchParams.get("month"); // "2026-02"
    const platform = searchParams.get("platform");
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50", 10));

    const where: Record<string, unknown> = {};
    if (month) {
      const start = new Date(`${month}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      where.earnedDate = { gte: start, lt: end };
    }
    if (platform) where.platform = platform;

    const commissions = await prisma.commission.findMany({
      where,
      orderBy: { earnedDate: "desc" },
      take: limit,
      include: {
        productIdentity: { select: { title: true } },
        contentAsset: { select: { assetCode: true, format: true } },
      },
    });

    return NextResponse.json({ data: commissions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
