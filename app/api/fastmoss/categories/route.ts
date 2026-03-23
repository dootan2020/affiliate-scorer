// GET /api/fastmoss/categories — returns category tree (L1 → L2 → L3)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const region = url.searchParams.get("region") ?? "VN";

  const categories = await prisma.fastMossCategory.findMany({
    where: { region },
    orderBy: [{ level: "asc" }, { rank: "asc" }],
  });

  // Build tree: L1 → L2 → L3
  const l1 = categories.filter((c) => c.level === 1);
  const tree = l1.map((parent) => ({
    ...parent,
    children: categories
      .filter((c) => c.level === 2 && c.parentCode === parent.code)
      .map((l2) => ({
        ...l2,
        children: categories.filter(
          (c) => c.level === 3 && c.parentCode === l2.code
        ),
      })),
  }));

  return NextResponse.json({ categories: tree, total: categories.length });
}
