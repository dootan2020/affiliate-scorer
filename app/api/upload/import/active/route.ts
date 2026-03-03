// GET /api/upload/import/active — Return most recent non-terminal ImportBatch.
// Used by /sync page to auto-resume polling after navigation.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  try {
    // Non-terminal: import or scoring still in progress
    const batch = await prisma.importBatch.findFirst({
      where: {
        OR: [
          { status: { in: ["pending", "processing"] } },
          {
            status: { in: ["completed", "partial"] },
            scoringStatus: { in: ["pending", "processing"] },
          },
        ],
      },
      orderBy: { importDate: "desc" },
      select: {
        id: true,
        fileName: true,
        source: true,
        recordCount: true,
      },
    });

    return NextResponse.json({ data: batch });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
