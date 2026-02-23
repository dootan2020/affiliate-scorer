import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseFile } from "@/lib/parsers/parse-file";
import { detectFormat } from "@/lib/parsers/detect-format";
import { parseFastMoss } from "@/lib/parsers/fastmoss";
import { parseKaloData } from "@/lib/parsers/kalodata";
import { parseWithMapping } from "@/lib/parsers/map-parser";
import { deduplicateProducts } from "@/lib/utils/dedup";
import type { NormalizedProduct } from "@/lib/utils/normalize";
import type { ColumnMapping } from "@/lib/parsers/ai-detect";

export async function POST(
  request: Request
): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const mappingJson = formData.get("mapping") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Vui lòng chọn file để upload" },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File quá lớn. Tối đa 10MB." },
        { status: 413 }
      );
    }

    const { headers, rows } = await parseFile(file);
    const format = detectFormat(headers);

    let products: NormalizedProduct[];
    let sourceLabel: string;

    if (mappingJson) {
      const mapping = JSON.parse(mappingJson) as ColumnMapping;
      if (!mapping.name) {
        return NextResponse.json(
          { error: "Mapping phải có trường 'name' (tên sản phẩm)" },
          { status: 400 }
        );
      }
      const source = format === "kalodata" ? "kalodata" : "fastmoss";
      products = parseWithMapping(rows, mapping, source);
      sourceLabel =
        format === "unknown"
          ? "Custom"
          : format === "fastmoss"
            ? "FastMoss"
            : "KaloData";
    } else if (format === "fastmoss") {
      products = parseFastMoss(rows);
      sourceLabel = "FastMoss";
    } else if (format === "kalodata") {
      products = parseKaloData(rows);
      sourceLabel = "KaloData";
    } else {
      return NextResponse.json(
        {
          error:
            "Không nhận diện được định dạng file. Vui lòng dùng Preview để xem mapping trước khi import.",
        },
        { status: 400 }
      );
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
        source: format === "unknown" ? "custom" : format,
        fileName: file.name,
        recordCount: deduplicated.length,
      },
    });

    let created = 0;
    let updated = 0;

    for (const p of deduplicated) {
      // Try to find existing product by name + shopName
      const existing = await prisma.product.findFirst({
        where: {
          name: p.name,
          shopName: p.shopName ?? undefined,
        },
        select: {
          id: true,
          price: true,
          commissionRate: true,
          sales7d: true,
          salesTotal: true,
          revenue7d: true,
          revenueTotal: true,
          totalKOL: true,
          totalVideos: true,
          kolOrderRate: true,
          productStatus: true,
          importBatchId: true,
        },
      });

      if (existing) {
        // Save old data as snapshot before updating
        await prisma.productSnapshot.create({
          data: {
            productId: existing.id,
            importBatchId: existing.importBatchId,
            price: existing.price,
            commissionRate: existing.commissionRate,
            sales7d: existing.sales7d,
            salesTotal: existing.salesTotal,
            revenue7d: existing.revenue7d,
            revenueTotal: existing.revenueTotal,
            totalKOL: existing.totalKOL,
            totalVideos: existing.totalVideos,
            kolOrderRate: existing.kolOrderRate,
            productStatus: existing.productStatus,
          },
        });

        // Update product with new data
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            price: p.price,
            commissionRate: p.commissionRate,
            commissionVND: p.commissionVND,
            category: p.category,
            salesTotal: p.salesTotal,
            sales7d: p.sales7d,
            salesGrowth7d: p.salesGrowth7d,
            salesGrowth30d: p.salesGrowth30d,
            revenue7d: p.revenue7d,
            revenue30d: p.revenue30d,
            revenueTotal: p.revenueTotal,
            totalKOL: p.totalKOL,
            kolOrderRate: p.kolOrderRate,
            totalVideos: p.totalVideos,
            totalLivestreams: p.totalLivestreams,
            imageUrl: p.imageUrl,
            tiktokUrl: p.tiktokUrl,
            fastmossUrl: p.fastmossUrl,
            shopFastmossUrl: p.shopFastmossUrl,
            productStatus: p.productStatus,
            listingDate: p.listingDate,
            lastSeenAt: new Date(),
            importBatchId: batch.id,
            dataDate: p.dataDate,
          },
        });
        updated++;
      } else {
        // Create new product
        await prisma.product.create({
          data: {
            name: p.name,
            url: p.url,
            category: p.category,
            price: p.price,
            commissionRate: p.commissionRate,
            commissionVND: p.commissionVND,
            platform: p.platform,
            salesTotal: p.salesTotal,
            sales7d: p.sales7d,
            salesGrowth7d: p.salesGrowth7d,
            salesGrowth30d: p.salesGrowth30d,
            revenue7d: p.revenue7d,
            revenue30d: p.revenue30d,
            revenueTotal: p.revenueTotal,
            totalKOL: p.totalKOL,
            kolOrderRate: p.kolOrderRate,
            totalVideos: p.totalVideos,
            totalLivestreams: p.totalLivestreams,
            affiliateCount: p.affiliateCount,
            creatorCount: p.creatorCount,
            topVideoViews: p.topVideoViews,
            imageUrl: p.imageUrl,
            tiktokUrl: p.tiktokUrl,
            fastmossUrl: p.fastmossUrl,
            shopFastmossUrl: p.shopFastmossUrl,
            shopName: p.shopName,
            shopRating: p.shopRating,
            productStatus: p.productStatus,
            listingDate: p.listingDate,
            source: p.source,
            importBatchId: batch.id,
            dataDate: p.dataDate,
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      data: {
        batchId: batch.id,
        format: format === "unknown" ? "custom" : format,
        totalParsed: products.length,
        afterDedup: deduplicated.length,
        created,
        updated,
      },
      message: `Đã import ${created + updated} sản phẩm từ ${sourceLabel} (${created} mới, ${updated} cập nhật)`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
