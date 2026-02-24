import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy,
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
    });

    return NextResponse.json({ data: campaigns });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi lay danh sach campaigns:", error);
    return NextResponse.json(
      { error: message, code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

interface CreateCampaignBody {
  name: string;
  platform: string;
  productId?: string;
  plannedBudgetDaily?: number;
  plannedDurationDays?: number;
  affiliateLink?: string;
  contentUrl?: string;
  contentType?: string;
  contentNotes?: string;
  status?: string;
}

function buildDefaultChecklist(
  platform: string,
  plannedDurationDays: number | undefined
): ChecklistItem[] {
  const duration = plannedDurationDays ?? 7;
  return [
    { label: "Lay link affiliate", dueDay: 0, completed: false, completedAt: null },
    { label: "Quay video content", dueDay: 0, completed: false, completedAt: null },
    { label: `Dang content len ${platform}`, dueDay: 1, completed: false, completedAt: null },
    { label: "Bat quang cao", dueDay: 1, completed: false, completedAt: null },
    { label: "Review ket qua ngay 3", dueDay: 3, completed: false, completedAt: null },
    { label: "Quyet dinh tang/giam budget", dueDay: 5, completed: false, completedAt: null },
    { label: `Ket luan sau ${duration} ngay`, dueDay: duration, completed: false, completedAt: null },
  ];
}

interface ChecklistItem {
  label: string;
  dueDay: number;
  completed: boolean;
  completedAt: string | null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CreateCampaignBody;

    // Validate required fields
    if (!body.name || !body.platform) {
      return NextResponse.json(
        { error: "name va platform la bat buoc", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

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
        checklist: JSON.parse(JSON.stringify(checklist)),
        dailyResults: [],
        startedAt: isRunning ? new Date() : null,
      },
      include: { product: { select: { name: true } } },
    });

    return NextResponse.json(
      { message: "Da tao campaign", data: campaign },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi tao campaign:", error);
    return NextResponse.json(
      { error: message, code: "CREATE_ERROR" },
      { status: 500 }
    );
  }
}
