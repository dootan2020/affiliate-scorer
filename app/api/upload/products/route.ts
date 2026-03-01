// POST /api/upload/products — Parse file, return batchId immediately, process in background.
import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/db";
import { parseFile } from "@/lib/parsers/parse-file";
import { detectFormat } from "@/lib/parsers/detect-format";
import { parseFastMoss } from "@/lib/parsers/fastmoss";
import { parseKaloData } from "@/lib/parsers/kalodata";
import { parseWithMapping } from "@/lib/parsers/map-parser";
import { deduplicateProducts } from "@/lib/utils/dedup";
import { processProductBatch } from "@/lib/import/process-product-batch";
import type { NormalizedProduct } from "@/lib/utils/normalize";
import type { ColumnMapping } from "@/lib/parsers/ai-detect";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const mappingJson = formData.get("mapping") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Vui lòng chọn file để upload" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File quá lớn. Tối đa 10MB." }, { status: 413 });
    }

    // Parse + validate (fast, sync-safe)
    const { headers, rows } = await parseFile(file);
    const format = detectFormat(headers);

    let products: NormalizedProduct[];
    let sourceLabel: string;

    if (mappingJson) {
      const mapping = JSON.parse(mappingJson) as ColumnMapping;
      if (!mapping.name) {
        return NextResponse.json({ error: "Mapping phải có trường 'name'" }, { status: 400 });
      }
      const source = format === "kalodata" ? "kalodata" : "fastmoss";
      products = parseWithMapping(rows, mapping, source);
      sourceLabel = format === "unknown" ? "Custom" : format === "fastmoss" ? "FastMoss" : "KaloData";
    } else if (format === "fastmoss") {
      products = parseFastMoss(rows);
      sourceLabel = "FastMoss";
    } else if (format === "kalodata") {
      products = parseKaloData(rows);
      sourceLabel = "KaloData";
    } else {
      return NextResponse.json(
        { error: "Không nhận diện được định dạng file. Vui lòng dùng Preview để xem mapping." },
        { status: 400 },
      );
    }

    if (products.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm nào trong file" }, { status: 400 });
    }

    const deduplicated = deduplicateProducts(products);

    // Create batch record with "pending" status
    const batch = await prisma.importBatch.create({
      data: {
        source: format === "unknown" ? "custom" : format,
        fileName: file.name,
        recordCount: deduplicated.length,
        status: "pending",
      },
    });

    // Schedule background processing — runs AFTER response is sent
    // Uses Next.js after() API which extends Vercel function lifetime
    after(() => processProductBatch(batch.id, deduplicated));

    // Return immediately — client will poll for progress
    return NextResponse.json({
      data: {
        batchId: batch.id,
        format: format === "unknown" ? "custom" : format,
        totalParsed: products.length,
        afterDedup: deduplicated.length,
        source: sourceLabel,
      },
      message: `Đang import ${deduplicated.length} sản phẩm từ ${sourceLabel}...`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
