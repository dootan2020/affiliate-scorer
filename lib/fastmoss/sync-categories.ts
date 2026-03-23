// lib/fastmoss/sync-categories.ts — upsert FastMoss category data

import { prisma } from "@/lib/db";

interface FastMossCategory {
  code: number;
  name: string;
  nameVi?: string;
  parentCode?: number;
  level: number;
  rank?: number;
  productCount?: number;
}

interface SyncCategoriesResult {
  recordCount: number;
  newCount: number;
  updatedCount: number;
  errorCount: number;
}

export async function syncCategories(
  data: unknown[],
  region: string,
  _syncLogId: string
): Promise<SyncCategoriesResult> {
  const categories = data as FastMossCategory[];
  let newCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  const results = await Promise.allSettled(
    categories.map(async (cat) => {
      const existing = await prisma.fastMossCategory.findUnique({
        where: { code_region: { code: cat.code, region } },
        select: { id: true },
      });

      const fields = {
        name: cat.name,
        nameVi: cat.nameVi,
        parentCode: cat.parentCode,
        level: cat.level,
        rank: cat.rank ?? 0,
        productCount: cat.productCount ?? 0,
      };

      if (existing) {
        await prisma.fastMossCategory.update({
          where: { id: existing.id },
          data: fields,
        });
        return "updated";
      } else {
        await prisma.fastMossCategory.create({
          data: { code: cat.code, region, ...fields },
        });
        return "new";
      }
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled") {
      if (r.value === "new") newCount++;
      else updatedCount++;
    } else {
      errorCount++;
      console.error("[syncCategories] error:", r.reason);
    }
  }

  return {
    recordCount: categories.length,
    newCount,
    updatedCount,
    errorCount,
  };
}
