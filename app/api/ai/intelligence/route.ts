import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateConfidence } from "@/lib/ai/confidence";
import { calculateWinProbability } from "@/lib/ai/win-probability";
import { getProductLifecycle } from "@/lib/ai/lifecycle";
import { getChannelRecommendations } from "@/lib/ai/recommendations";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "productId la bat buoc" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Khong tim thay san pham" },
        { status: 404 }
      );
    }

    const confidence = await calculateConfidence();
    const winProbability = await calculateWinProbability(
      product,
      confidence.level
    );
    const lifecycle = await getProductLifecycle(productId);
    const recommendations = await getChannelRecommendations(
      productId,
      confidence.level
    );

    return NextResponse.json({
      data: {
        confidence: {
          level: confidence.level,
          label: confidence.label,
          percent: confidence.percent,
        },
        winProbability,
        lifecycle,
        recommendations,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi lay AI intelligence:", error);
    return NextResponse.json(
      { error: message, code: "INTELLIGENCE_ERROR" },
      { status: 500 }
    );
  }
}
