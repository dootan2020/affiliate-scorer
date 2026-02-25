// Phase 3: POST /api/briefs/generate — Generate content brief cho 1 SP
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateBrief } from "@/lib/content/generate-brief";
import { validateBody } from "@/lib/validations/validate-body";
import { generateBriefSchema } from "@/lib/validations/schemas-content";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export async function POST(request: Request): Promise<NextResponse> {
  const rl = checkRateLimit("ai:briefs-generate", 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau.", code: "RATE_LIMIT" },
      { status: 429 }
    );
  }

  try {
    const validation = await validateBody(request, generateBriefSchema);
    if (validation.error) return validation.error;
    const { productIdentityId } = validation.data;

    // Lấy product identity
    const identity = await prisma.productIdentity.findUnique({
      where: { id: productIdentityId },
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
