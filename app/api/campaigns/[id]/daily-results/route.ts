import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface DailyResultEntry {
  date: string;
  spend: number;
  orders: number;
  revenue: number;
  clicks?: number;
  notes?: string;
}

interface AddDailyResultBody {
  date: string;
  spend: number;
  orders: number;
  revenue?: number;
  clicks?: number;
  notes?: string;
}

interface PatchDailyResultBody {
  date: string;
  spend?: number;
  orders?: number;
  revenue?: number;
  clicks?: number;
  notes?: string;
}

/**
 * Recalculate campaign totals from dailyResults array.
 */
function recalcTotals(results: DailyResultEntry[]): {
  totalSpend: number;
  totalRevenue: number;
  totalOrders: number;
  roas: number | null;
  profitLoss: number;
} {
  const totalSpend = results.reduce((sum, r) => sum + (r.spend ?? 0), 0);
  const totalRevenue = results.reduce((sum, r) => sum + (r.revenue ?? 0), 0);
  const totalOrders = results.reduce((sum, r) => sum + (r.orders ?? 0), 0);
  const roas = totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : null;
  const profitLoss = totalRevenue - totalSpend;

  return { totalSpend, totalRevenue, totalOrders, roas, profitLoss };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = (await request.json()) as AddDailyResultBody;

    // Validate required fields
    if (!body.date || body.spend === undefined || body.orders === undefined) {
      return NextResponse.json(
        { error: "date, spend, va orders la bat buoc", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    // Validate date format
    const parsedDate = new Date(body.date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "date khong hop le. Dung format YYYY-MM-DD", code: "INVALID_DATE" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { product: { select: { price: true, commissionRate: true } } },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Khong tim thay campaign", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Estimate revenue if not provided
    let revenue = body.revenue;
    if (revenue === undefined || revenue === null) {
      if (campaign.product) {
        revenue = Math.round(body.orders * campaign.product.price * campaign.product.commissionRate / 100);
      } else {
        revenue = 0;
      }
    }

    // Build new daily result entry
    const newEntry: DailyResultEntry = {
      date: body.date,
      spend: body.spend,
      orders: body.orders,
      revenue,
      ...(body.clicks !== undefined && { clicks: body.clicks }),
      ...(body.notes !== undefined && { notes: body.notes }),
    };

    // Append to existing dailyResults
    const existingResults = (campaign.dailyResults as unknown as DailyResultEntry[]) ?? [];
    const updatedResults = [...existingResults, newEntry];
    const totals = recalcTotals(updatedResults);

    // Update campaign with new daily results and recalculated totals
    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        dailyResults: JSON.parse(JSON.stringify(updatedResults)),
        ...totals,
      },
    });

    // Create FinancialRecord for ads_spend
    if (body.spend > 0) {
      await prisma.financialRecord.create({
        data: {
          type: "ads_spend",
          amount: body.spend,
          source: campaign.platform,
          campaignId: id,
          productId: campaign.productId ?? undefined,
          date: parsedDate,
          notes: `Chi phi quang cao campaign: ${campaign.name}`,
        },
      });
    }

    // Create FinancialRecord for commission_received if revenue provided
    if (revenue > 0) {
      await prisma.financialRecord.create({
        data: {
          type: "commission_received",
          amount: revenue,
          source: campaign.platform,
          campaignId: id,
          productId: campaign.productId ?? undefined,
          date: parsedDate,
          notes: `Hoa hong tu campaign: ${campaign.name}`,
        },
      });
    }

    return NextResponse.json(
      { message: "Da them ket qua ngay", data: updated },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi them daily result:", error);
    return NextResponse.json(
      { error: message, code: "CREATE_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = (await request.json()) as PatchDailyResultBody;

    if (!body.date) {
      return NextResponse.json(
        { error: "date la bat buoc de xac dinh ket qua can cap nhat", code: "MISSING_DATE" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json(
        { error: "Khong tim thay campaign", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const existingResults = (campaign.dailyResults as unknown as DailyResultEntry[]) ?? [];
    const entryIndex = existingResults.findIndex((r) => r.date === body.date);

    if (entryIndex === -1) {
      return NextResponse.json(
        { error: `Khong tim thay ket qua ngay ${body.date}`, code: "ENTRY_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Track old values for financial record updates
    const oldEntry = existingResults[entryIndex];

    // Merge updates into the existing entry
    const updatedEntry: DailyResultEntry = {
      ...oldEntry,
      ...(body.spend !== undefined && { spend: body.spend }),
      ...(body.orders !== undefined && { orders: body.orders }),
      ...(body.revenue !== undefined && { revenue: body.revenue }),
      ...(body.clicks !== undefined && { clicks: body.clicks }),
      ...(body.notes !== undefined && { notes: body.notes }),
    };

    existingResults[entryIndex] = updatedEntry;
    const totals = recalcTotals(existingResults);

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        dailyResults: JSON.parse(JSON.stringify(existingResults)),
        ...totals,
      },
    });

    // Update corresponding FinancialRecords for this date+campaign
    const parsedDate = new Date(body.date);
    const nextDate = new Date(parsedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Update ads_spend record if spend changed
    if (body.spend !== undefined && body.spend !== oldEntry.spend) {
      const spendRecord = await prisma.financialRecord.findFirst({
        where: {
          campaignId: id,
          type: "ads_spend",
          date: { gte: parsedDate, lt: nextDate },
        },
      });

      if (spendRecord) {
        await prisma.financialRecord.update({
          where: { id: spendRecord.id },
          data: { amount: body.spend },
        });
      }
    }

    // Update commission_received record if revenue changed
    if (body.revenue !== undefined && body.revenue !== oldEntry.revenue) {
      const revenueRecord = await prisma.financialRecord.findFirst({
        where: {
          campaignId: id,
          type: "commission_received",
          date: { gte: parsedDate, lt: nextDate },
        },
      });

      if (revenueRecord) {
        await prisma.financialRecord.update({
          where: { id: revenueRecord.id },
          data: { amount: body.revenue },
        });
      }
    }

    return NextResponse.json({
      message: "Da cap nhat ket qua ngay",
      data: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi cap nhat daily result:", error);
    return NextResponse.json(
      { error: message, code: "UPDATE_ERROR" },
      { status: 500 }
    );
  }
}
