import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { createCampaignSchema } from "@/lib/validations/schemas-campaigns";
import { toJsonValue } from "@/lib/utils/typed-json";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const platform = searchParams.get("platform");
    const sort = searchParams.get("sort") ?? "newest";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (platform) where.platform = platform;

    // Determine sort order
    let orderBy: Record<string, string>;
    switch (sort) {
      case "roas":
        orderBy = { roas: "desc" };
        break;
      case "profit":
        orderBy = { profitLoss: "desc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50", 10));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy,
        take: limit,
        skip,
        select: {
          id: true,
          name: true,
          platform: true,
          status: true,
          totalSpend: true,
          totalRevenue: true,
          totalOrders: true,
          roas: true,
          profitLoss: true,
          productId: true,
          product: { select: { name: true } },
          startedAt: true,
          createdAt: true,
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return NextResponse.json({ data: campaigns, total, page, limit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi lấy danh sách campaigns:", error);
    return NextResponse.json(
      { error: message, code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

interface ChecklistItem {
  label: string;
  dueDay: number;
  completed: boolean;
  completedAt: string | null;
}

function buildDefaultChecklist(
  platform: string,
  plannedDurationDays: number | undefined
): ChecklistItem[] {
  const duration = plannedDurationDays ?? 7;
  return [
    { label: "Lấy link affiliate", dueDay: 0, completed: false, completedAt: null },
    { label: "Quay video content", dueDay: 0, completed: false, completedAt: null },
    { label: `Đăng content lên ${platform}`, dueDay: 1, completed: false, completedAt: null },
    { label: "Bật quảng cáo", dueDay: 1, completed: false, completedAt: null },
    { label: "Review kết quả ngày 3", dueDay: 3, completed: false, completedAt: null },
    { label: "Quyết định tăng/giảm budget", dueDay: 5, completed: false, completedAt: null },
    { label: `Kết luận sau ${duration} ngày`, dueDay: duration, completed: false, completedAt: null },
  ];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const validation = await validateBody(request, createCampaignSchema);
    if (validation.error) return validation.error;
    const body = validation.data;

    const checklist = buildDefaultChecklist(body.platform, body.plannedDurationDays);
    const isRunning = body.status === "running";

    const campaign = await prisma.campaign.create({
      data: {
        name: body.name,
        platform: body.platform,
        productId: body.productId ?? null,
        plannedBudgetDaily: body.plannedBudgetDaily ?? null,
        plannedDurationDays: body.plannedDurationDays ?? null,
        affiliateLink: body.affiliateLink ?? null,
        contentUrl: body.contentUrl ?? null,
        contentType: body.contentType ?? null,
        contentNotes: body.contentNotes ?? null,
        status: body.status ?? "planning",
        checklist: toJsonValue(checklist),
        dailyResults: [],
        startedAt: isRunning ? new Date() : null,
      },
      include: { product: { select: { name: true } } },
    });

    return NextResponse.json(
      { message: "Đã tạo campaign", data: campaign },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi tạo campaign:", error);
    return NextResponse.json(
      { error: message, code: "CREATE_ERROR" },
      { status: 500 }
    );
  }
}
