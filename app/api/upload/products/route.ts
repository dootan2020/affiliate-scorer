import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseFile } from "@/lib/parsers/parse-file";
import { detectFormat } from "@/lib/parsers/detect-format";
import { parseFastMoss } from "@/lib/parsers/fastmoss";
import { parseKaloData } from "@/lib/parsers/kalodata";
import { parseWithMapping } from "@/lib/parsers/map-parser";
import { deduplicateProducts } from "@/lib/utils/dedup";
import { scoreProducts } from "@/lib/ai/scoring";
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

    const SNAPSHOT_FIELDS = {
      id: true, price: true, commissionRate: true, sales7d: true,
      salesTotal: true, revenue7d: true, revenueTotal: true,
      totalKOL: true, totalVideos: true, kolOrderRate: true,
      productStatus: true, importBatchId: true,
    } as const;

    for (const p of deduplicated) {
      // 1) Primary: match by tiktokUrl (most reliable unique key)
      // 2) Fallback: match by name + shopName
      const existing = await findExistingProduct(p);

      if (existing) {
        // Only create snapshot when data actually changed
        const dataChanged =
          existing.price !== p.price ||
          existing.commissionRate !== p.commissionRate ||
          existing.sales7d !== p.sales7d ||
          existing.salesTotal !== p.salesTotal ||
          existing.revenue7d !== p.revenue7d ||
          existing.revenueTotal !== p.revenueTotal ||
          existing.totalKOL !== p.totalKOL ||
          existing.totalVideos !== p.totalVideos ||
          existing.kolOrderRate !== p.kolOrderRate ||
          existing.productStatus !== p.productStatus;

        if (dataChanged) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          // Max 1 snapshot per product per day
          const todaySnap = await prisma.productSnapshot.findFirst({
            where: {
              productId: existing.id,
              snapshotDate: { gte: today, lt: tomorrow },
            },
            select: { id: true },
          });

          const snapData = {
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
          };

          if (todaySnap) {
            await prisma.productSnapshot.update({
              where: { id: todaySnap.id },
              data: snapData,
            });
          } else {
            await prisma.productSnapshot.create({
              data: { productId: existing.id, ...snapData },
            });
          }
        }

        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: p.name,
            url: p.url,
            category: p.category,
            price: p.price,
            commissionRate: p.commissionRate,
            commissionVND: p.commissionVND,
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
            shopName: p.shopName ?? undefined,
            productStatus: p.productStatus,
            listingDate: p.listingDate,
            lastSeenAt: new Date(),
            importBatchId: batch.id,
            dataDate: p.dataDate,
          },
        });
        updated++;
      } else {
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

    async function findExistingProduct(p: NormalizedProduct) {
      // Primary: tiktokUrl is the most reliable unique identifier
      if (p.tiktokUrl) {
        const byUrl = await prisma.product.findFirst({
          where: { tiktokUrl: p.tiktokUrl },
          select: SNAPSHOT_FIELDS,
        });
        if (byUrl) return byUrl;
      }

      // Fallback: name + shopName (case-insensitive)
      const byName = await prisma.product.findFirst({
        where: {
          name: { equals: p.name, mode: "insensitive" },
          ...(p.shopName
            ? { shopName: { equals: p.shopName, mode: "insensitive" } }
            : { shopName: null }),
        },
        select: SNAPSHOT_FIELDS,
      });
      return byName;
    }

    // Auto-trigger scoring in background (fire-and-forget)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey !== "sk-ant-...") {
      scoreProducts({ batchId: batch.id }).catch((err) => {
        console.error("Auto-scoring failed (non-blocking):", err);
      });
    }

    return NextResponse.json({
      data: {
        batchId: batch.id,
        format: format === "unknown" ? "custom" : format,
        totalParsed: products.length,
        afterDedup: deduplicated.length,
        created,
        updated,
        scoringTriggered: !!apiKey && apiKey !== "sk-ant-...",
      },
      message: `Đã import ${created + updated} sản phẩm từ ${sourceLabel} (${created} mới, ${updated} cập nhật)`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
