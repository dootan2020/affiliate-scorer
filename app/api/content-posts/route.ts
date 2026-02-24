import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const productId = searchParams.get("productId");

    const where: Record<string, unknown> = {};
    if (campaignId) where.campaignId = campaignId;
    if (productId) where.productId = productId;

    const posts = await prisma.contentPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        campaign: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: posts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi lay danh sach content posts:", error);
    return NextResponse.json(
      { error: message, code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

interface CreateContentPostBody {
  url: string;
  platform: string;
  campaignId?: string;
  productId?: string;
  contentType?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  notes?: string;
  postedAt?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CreateContentPostBody;

    // Validate required fields
    if (!body.url || !body.platform) {
      return NextResponse.json(
        { error: "url va platform la bat buoc", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    // Parse postedAt if provided
    let postedAt: Date | null = null;
    if (body.postedAt) {
      postedAt = new Date(body.postedAt);
      if (isNaN(postedAt.getTime())) {
        return NextResponse.json(
          { error: "postedAt khong hop le", code: "INVALID_DATE" },
          { status: 400 }
        );
      }
    }

    const post = await prisma.contentPost.create({
      data: {
        url: body.url,
        platform: body.platform,
        campaignId: body.campaignId ?? null,
        productId: body.productId ?? null,
        contentType: body.contentType ?? null,
        views: body.views ?? null,
        likes: body.likes ?? null,
        comments: body.comments ?? null,
        shares: body.shares ?? null,
        notes: body.notes ?? null,
        postedAt,
      },
      include: {
        campaign: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { message: "Da tao content post", data: post },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi tao content post:", error);
    return NextResponse.json(
      { error: message, code: "CREATE_ERROR" },
      { status: 500 }
    );
  }
}
