import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(): Promise<NextResponse> {
  try {
    const products = await prisma.product.findMany({
      where: { aiScore: { not: null } },
      orderBy: { aiScore: "desc" },
      take: 100,
    });

    if (products.length === 0) {
      return NextResponse.json(
        { error: "Chưa có sản phẩm nào được chấm điểm" },
        { status: 404 }
      );
    }

    const headers = [
      "Rank",
      "Tên sản phẩm",
      "AI Score",
      "Giá (VND)",
      "Hoa hồng (%)",
      "Hoa hồng (VND)",
      "Platform",
      "Danh mục",
      "Tăng trưởng 7d (%)",
      "Số affiliates",
      "Gợi ý nội dung",
    ];

    const rows = products.map((p) => [
      String(p.aiRank ?? ""),
      escapeCsvField(p.name),
      String(p.aiScore ?? ""),
      String(Math.round(p.price)),
      String(p.commissionRate),
      String(Math.round(p.commissionVND)),
      escapeCsvField(p.platform),
      escapeCsvField(p.category),
      p.salesGrowth7d != null ? String(p.salesGrowth7d) : "",
      p.affiliateCount != null ? String(p.affiliateCount) : "",
      escapeCsvField((p.contentSuggestion ?? "").replace(/\n/g, " ")),
    ]);

    const csvContent =
      "\uFEFF" +
      headers.map(escapeCsvField).join(",") +
      "\n" +
      rows.map((row) => row.join(",")).join("\n");

    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pastr-${date}.csv"`,
      },
    });
  } catch (error) {
    console.error("Lỗi khi export CSV:", error);
    return NextResponse.json(
      { error: "Lỗi khi tạo file export" },
      { status: 500 }
    );
  }
}
