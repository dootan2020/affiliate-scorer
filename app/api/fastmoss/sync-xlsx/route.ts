// POST /api/fastmoss/sync-xlsx — receive XLSX from extension export, parse, upsert
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseFastMoss } from "@/lib/parsers/fastmoss";
import { parseFile } from "@/lib/parsers/parse-file";
import { syncProducts } from "@/lib/fastmoss/sync-products";

export async function POST(request: Request): Promise<NextResponse> {
  const secret = request.headers.get("x-auth-secret");
  if (!secret || secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const categoryCode = formData.get("category_code") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const syncLog = await prisma.fastMossSyncLog.create({
    data: {
      syncType: "products",
      status: "running",
      metadata: { source: "xlsx-export", categoryCode } as any,
    },
  });
  const startTime = Date.now();

  try {
    // Parse XLSX using existing infrastructure
    const { rows } = await parseFile(file);
    const products = parseFastMoss(rows);

    if (products.length === 0) {
      await prisma.fastMossSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "completed",
          recordCount: 0,
          newCount: 0,
          updatedCount: 0,
          errorCount: 0,
          completedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, recordCount: 0, newCount: 0, updatedCount: 0, errorCount: 0 });
    }

    // Bridge: NormalizedProduct → raw format for syncProducts
    const catId = categoryCode ? parseInt(categoryCode, 10) : undefined;
    const rawProducts = products.map((p) => ({
      product_id: extractProductId(p.fastmossUrl) || `xlsx-${hashString(p.name || "")}`,
      title: p.name,
      cover: p.imageUrl,
      price_vnd: p.price,
      commission_rate_num: p.commissionRate,
      shop_name: p.shopName,
      category_name: p.category ? [p.category] : [],
      category_id: catId,
      day28_sold_count: p.sales7d,
      sale_amount: p.revenueTotal,
      relate_author_count: p.totalKOL,
      relate_video_count: p.totalVideos,
      relate_live_count: p.totalLivestreams,
      _crawl_category_id: catId,
    }));

    const result = await syncProducts(rawProducts, syncLog.id);
    const duration = Math.round((Date.now() - startTime) / 1000);

    await prisma.fastMossSyncLog.update({
      where: { id: syncLog.id },
      data: { ...result, status: "completed", duration, completedAt: new Date() },
    });

    return NextResponse.json({ success: true, ...result, duration, source: "xlsx" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await prisma.fastMossSyncLog.update({
      where: { id: syncLog.id },
      data: { status: "failed", errorLog: msg, completedAt: new Date() },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Extract product ID from FastMoss URL: /e-commerce/detail/1234567890 */
function extractProductId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/detail\/(\d+)/);
  return match ? match[1] : null;
}

/** Simple string hash for fallback product IDs */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}
