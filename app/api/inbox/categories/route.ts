import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** GET — distinct categories from ProductIdentity for filter dropdown */
export async function GET(): Promise<NextResponse> {
  try {
    const results = await prisma.productIdentity.findMany({
      where: {
        category: { not: null },
        inboxState: { not: "archived" },
      },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    const categories = results
      .map((r) => r.category)
      .filter((c): c is string => c !== null);

    return NextResponse.json({ data: categories });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
