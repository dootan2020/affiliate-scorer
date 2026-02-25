// Phase 3: POST /api/briefs/generate — Generate content brief cho 1 SP
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateBrief } from "@/lib/content/generate-brief";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { productIdentityId?: string };

    if (!body.productIdentityId) {
      return NextResponse.json(
        { error: "Thiếu productIdentityId" },
        { status: 400 },
      );
    }

    // Lấy product identity
    const identity = await prisma.productIdentity.findUnique({
      where: { id: body.productIdentityId },
    });

    if (!identity) {
      return NextResponse.json(
        { error: "Không tìm thấy sản phẩm" },
        { status: 404 },
      );
    }

    // Generate brief
    const briefId = await generateBrief({
      id: identity.id,
      title: identity.title,
      category: identity.category,
      price: identity.price ? Number(identity.price) : null,
      commissionRate: identity.commissionRate ? String(identity.commissionRate) : null,
      description: identity.description,
      imageUrl: identity.imageUrl,
    });

    // Lấy brief vừa tạo
    const brief = await prisma.contentBrief.findUnique({
      where: { id: briefId },
      include: {
        assets: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({
      data: brief,
      message: `Đã tạo brief với ${(brief?.scripts as unknown[])?.length || 0} scripts`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[briefs/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
