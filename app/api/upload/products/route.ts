import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseFile } from "@/lib/parsers/parse-file";
import { detectFormat } from "@/lib/parsers/detect-format";
import { parseFastMoss } from "@/lib/parsers/fastmoss";
import { parseKaloData } from "@/lib/parsers/kalodata";
import { deduplicateProducts } from "@/lib/utils/dedup";
import type { NormalizedProduct } from "@/lib/utils/normalize";

export async function POST(
  request: Request
): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Vui lòng chọn file để upload" },
        { status: 400 }
      );
    }

    const { headers, rows } = await parseFile(file);
    const format = detectFormat(headers);

    if (format !== "fastmoss" && format !== "kalodata") {
      return NextResponse.json(
        {
          error: `Không nhận diện được định dạng file. Vui lòng upload file từ FastMoss hoặc KaloData.`,
        },
        { status: 400 }
      );
    }

    let products: NormalizedProduct[];
    if (format === "fastmoss") {
      products = parseFastMoss(rows);
    } else {
      products = parseKaloData(rows);
    }

    if (products.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy sản phẩm nào trong file" },
        { status: 400 }
      );
    }

    const deduplicated = deduplicateProducts(products);

    const batch = await prisma.importBatch.create({
      data: {
        source: format,
        fileName: file.name,
        recordCount: deduplicated.length,
      },
    });

    const created = await prisma.product.createMany({
      data: deduplicated.map((p) => ({
        name: p.name,
        url: p.url,
        category: p.category,
        price: p.price,
        commissionRate: p.commissionRate,
        commissionVND: p.commissionVND,
        platform: p.platform,
        salesTotal: p.salesTotal,
        salesGrowth7d: p.salesGrowth7d,
        salesGrowth30d: p.salesGrowth30d,
        revenue7d: p.revenue7d,
        revenue30d: p.revenue30d,
        affiliateCount: p.affiliateCount,
        creatorCount: p.creatorCount,
        topVideoViews: p.topVideoViews,
        shopName: p.shopName,
        shopRating: p.shopRating,
        source: p.source,
        importBatchId: batch.id,
        dataDate: p.dataDate,
      })),
    });

    return NextResponse.json({
      data: {
        batchId: batch.id,
        format,
        totalParsed: products.length,
        afterDedup: deduplicated.length,
        saved: created.count,
      },
      message: `Đã import ${created.count} sản phẩm từ ${format === "fastmoss" ? "FastMoss" : "KaloData"}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
