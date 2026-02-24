import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    // Default to current month
    const now = new Date();
    let year = now.getFullYear();
    let mon = now.getMonth() + 1;

    if (month) {
      const parts = month.split("-").map(Number);
      if (!parts[0] || !parts[1] || parts[1] < 1 || parts[1] > 12) {
        return NextResponse.json(
          { error: "Tháng không hợp lệ. Dùng format YYYY-MM", code: "INVALID_MONTH" },
          { status: 400 }
        );
      }
      year = parts[0];
      mon = parts[1];
    }

    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 1);

    const records = await prisma.financialRecord.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
      },
    });

    // Calculate income: types containing "commission" or "income"
    const totalIncome = records
      .filter((r) => {
        const t = r.type.toLowerCase();
        return t.includes("commission") || t.includes("income");
      })
      .reduce((sum, r) => sum + r.amount, 0);

    // Calculate expense: types containing "spend" or "cost"
    const totalExpense = records
      .filter((r) => {
        const t = r.type.toLowerCase();
        return t.includes("spend") || t.includes("cost");
      })
      .reduce((sum, r) => sum + r.amount, 0);

    const profitLoss = totalIncome - totalExpense;

    return NextResponse.json({
      data: {
        month: `${year}-${String(mon).padStart(2, "0")}`,
        totalIncome,
        totalExpense,
        profitLoss,
        recordCount: records.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi tính tổng hợp tài chính:", error);
    return NextResponse.json(
      { error: message, code: "SUMMARY_ERROR" },
      { status: 500 }
    );
  }
}
