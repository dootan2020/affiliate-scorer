// GET /api/briefs?status=active|completed&limit=50&page=1
// Lists briefs with product info and assets for the production page
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const TERMINAL_STATUSES = ["published", "archived"];

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "active";
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const skip = (page - 1) * limit;

    const includeRelations = {
      productIdentity: {
        select: {
          id: true,
          title: true,
          shopName: true,
          imageUrl: true,
          price: true,
          productIdExternal: true,
          combinedScore: true,
          product: { select: { shopRating: true, salesTotal: true } },
          urls: { select: { url: true, urlType: true } },
        },
      },
      assets: {
        orderBy: { createdAt: "asc" as const },
        select: {
          id: true, assetCode: true, format: true, hookText: true, hookType: true,
          angle: true, scriptText: true, captionText: true, hashtags: true,
          ctaText: true, videoPrompts: true, complianceStatus: true,
          complianceNotes: true, status: true,
        },
      },
    };

    let briefs;
    let total: number;

    if (status === "active") {
      // Active: not replaced AND has at least one non-terminal asset
      briefs = await prisma.contentBrief.findMany({
        where: {
          status: { not: "replaced" },
          assets: { some: { status: { notIn: TERMINAL_STATUSES } } },
        },
        include: includeRelations,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      });
      total = await prisma.contentBrief.count({
        where: {
          status: { not: "replaced" },
          assets: { some: { status: { notIn: TERMINAL_STATUSES } } },
        },
      });
    } else {
      // Completed: replaced OR all assets terminal
      briefs = await prisma.contentBrief.findMany({
        where: {
          OR: [
            { status: "replaced" },
            { assets: { every: { status: { in: TERMINAL_STATUSES } } } },
          ],
        },
        include: includeRelations,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      });
      total = await prisma.contentBrief.count({
        where: {
          OR: [
            { status: "replaced" },
            { assets: { every: { status: { in: TERMINAL_STATUSES } } } },
          ],
        },
      });
    }

    return NextResponse.json({
      data: briefs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[briefs/list]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
