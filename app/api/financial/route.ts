import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // e.g. "2026-02"
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};

    // Filter by month if provided (e.g. "2026-02")
    if (month) {
      const [year, mon] = month.split("-").map(Number);
      if (!year || !mon || mon < 1 || mon > 12) {
        return NextResponse.json(
          { error: "Tháng không hợp lệ. Dùng format YYYY-MM", code: "INVALID_MONTH" },
          { status: 400 }
        );
      }
      const startDate = new Date(year, mon - 1, 1);
      const endDate = new Date(year, mon, 1);
      where.date = { gte: startDate, lt: endDate };
    }

    // Filter by type if provided
    if (type) {
      where.type = type;
    }

    const records = await prisma.financialRecord.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ data: records });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi lấy danh sách tài chính:", error);
    return NextResponse.json(
      { error: message, code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

interface CreateFinancialBody {
  type: string;
  amount: number;
  source: string;
  productId?: string;
  campaignId?: string;
  date: string;
  notes?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CreateFinancialBody;

    // Validate required fields
    if (!body.type || body.amount === undefined || !body.source || !body.date) {
      return NextResponse.json(
        { error: "type, amount, source, và date là bắt buộc", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    // Validate amount is a number
    if (typeof body.amount !== "number" || isNaN(body.amount)) {
      return NextResponse.json(
        { error: "amount phải là số hợp lệ", code: "INVALID_AMOUNT" },
        { status: 400 }
      );
    }

    // Validate date
    const parsedDate = new Date(body.date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "date không hợp lệ. Dùng format ISO", code: "INVALID_DATE" },
        { status: 400 }
      );
    }

    const record = await prisma.financialRecord.create({
      data: {
        type: body.type,
        amount: body.amount,
        source: body.source,
        productId: body.productId ?? null,
        campaignId: body.campaignId ?? null,
        date: parsedDate,
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json(
      { message: "Đã tạo bản ghi tài chính", data: record },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi tạo bản ghi tài chính:", error);
    return NextResponse.json(
      { error: message, code: "CREATE_ERROR" },
      { status: 500 }
    );
  }
}
