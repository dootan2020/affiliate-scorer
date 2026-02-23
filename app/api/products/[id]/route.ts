import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ScoreBreakdown } from "@/lib/scoring/formula";

interface ProductDetailResponse {
  id: string;
  name: string;
  url: string | null;
  category: string;
  price: number;
  commissionRate: number;
  commissionVND: number;
  platform: string;
  salesTotal: number | null;
  salesGrowth7d: number | null;
  salesGrowth30d: number | null;
  revenue7d: number | null;
  revenue30d: number | null;
  affiliateCount: number | null;
  creatorCount: number | null;
  topVideoViews: number | null;
  shopName: string | null;
  shopRating: number | null;
  aiScore: number | null;
  aiRank: number | null;
  scoreBreakdown: ScoreBreakdown | null;
  scoringVersion: string | null;
  contentSuggestion: string | null;
  platformAdvice: string | null;
  source: string;
  importBatchId: string;
  dataDate: Date;
  createdAt: Date;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Không tìm thấy sản phẩm", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    let parsedBreakdown: ScoreBreakdown | null = null;
    if (product.scoreBreakdown) {
      try {
        parsedBreakdown = JSON.parse(product.scoreBreakdown) as ScoreBreakdown;
      } catch {
        parsedBreakdown = null;
      }
    }

    const detail: ProductDetailResponse = {
      ...product,
      scoreBreakdown: parsedBreakdown,
    };

    return NextResponse.json({ data: detail });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
    return NextResponse.json(
      {
        error: "Lỗi khi tải chi tiết sản phẩm. Vui lòng thử lại.",
        code: "FETCH_ERROR",
      },
      { status: 500 }
    );
  }
}
