import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  try {
    const imports = await prisma.dataImport.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        sourceType: true,
        fileName: true,
        status: true,
        rowsTotal: true,
        rowsImported: true,
        rowsError: true,
        productsCreated: true,
        productsUpdated: true,
        financialRecordsCreated: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: imports });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[import/history] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
