import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** GET — list content assets with optional status filter */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status"); // comma-separated
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: Record<string, unknown> = {};
    if (statusParam) {
      const statuses = statusParam.split(",").map((s) => s.trim());
      where.status = { in: statuses };
    }

    const assets = await prisma.contentAsset.findMany({
      where,
      select: {
        id: true,
        assetCode: true,
        format: true,
        contentType: true,
        videoFormat: true,
        hookText: true,
        status: true,
        productIdentity: {
          select: { id: true, title: true, imageUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    });

    return NextResponse.json({ data: assets });
  } catch {
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}
