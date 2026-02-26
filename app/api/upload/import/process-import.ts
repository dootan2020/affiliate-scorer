import { prisma } from "@/lib/db";
import { parseFile, type ParsedRow } from "@/lib/parsers/parse-file";
import { detectFormatExtended } from "@/lib/parsers/detect-format";
import { parseTikTokAffiliate } from "@/lib/parsers/affiliate-tiktok";
import { loadProductCache, clearProductCache, fuzzyMatchProduct } from "@/lib/parsers/fuzzy-match-product";
import { mergeImportedData } from "@/lib/parsers/merge-import";
import type { ExtendedFileFormat, ImportParseResult } from "@/lib/parsers/types";

const PRODUCT_REDIRECT_TYPES: ExtendedFileFormat[] = ["fastmoss", "kalodata"];
const UNRESOLVABLE_TYPES: ExtendedFileFormat[] = ["unknown", "generic"];

// Formats that can still be imported (affiliate data only — campaign parsers removed)
const SUPPORTED_IMPORT_TYPES: ExtendedFileFormat[] = ["tiktok_affiliate"];

export interface ImportSummary {
  importId: string;
  format: ExtendedFileFormat;
  confidence: string;
  reason: string;
  rowsTotal: number;
  rowsImported: number;
  rowsSkipped: number;
  rowsError: number;
  campaignsCreated: number;
  campaignsUpdated: number;
  financialRecordsCreated: number;
  errors: Array<{ row: number; message: string }>;
}

/** Route parsed rows to the correct platform-specific parser */
function parseByType(type: ExtendedFileFormat, headers: string[], rows: ParsedRow[]): ImportParseResult {
  switch (type) {
    case "tiktok_affiliate":
      return parseTikTokAffiliate(headers, rows);
    default:
      throw new Error(`Parser chưa hỗ trợ loại: ${type}. Các loại hỗ trợ: ${SUPPORTED_IMPORT_TYPES.join(", ")}`);
  }
}

/** Fuzzy-match financial records to existing products */
async function applyFuzzyMatching(result: ImportParseResult): Promise<void> {
  await loadProductCache();
  try {
    for (const campaign of result.campaigns) {
      if (!campaign.productId) {
        campaign.productId = fuzzyMatchProduct(campaign.name) ?? null;
      }
    }
    for (const record of result.financialRecords) {
      if (record.productId || !record.metadata) continue;
      const meta = record.metadata as Record<string, unknown>;
      const productName = meta["productName"] as string | undefined;
      if (productName) {
        record.productId = fuzzyMatchProduct(productName) ?? null;
      }
    }
  } finally {
    clearProductCache();
  }
}

/** Core import processing logic */
export async function processImport(
  file: File,
  fileTypeOverride?: string | null
): Promise<{ summary: ImportSummary; message: string }> {
  const { headers, rows } = await parseFile(file);
  const detection = detectFormatExtended(headers);
  const detectedType: ExtendedFileFormat =
    (fileTypeOverride as ExtendedFileFormat) || detection.type;

  if (PRODUCT_REDIRECT_TYPES.includes(detectedType)) {
    throw new RedirectError(
      `File "${file.name}" là dữ liệu sản phẩm (${detectedType}). Dùng /api/upload/products.`
    );
  }
  if (UNRESOLVABLE_TYPES.includes(detectedType) && !fileTypeOverride) {
    throw new DetectionError("Không nhận dạng được loại file. Chọn fileType rồi thử lại.");
  }

  const dataImport = await prisma.dataImport.create({
    data: {
      sourceType: detectedType,
      fileName: file.name,
      fileSize: file.size,
      detectedType: detection.type,
      detectionConfidence: detection.confidence,
      userConfirmedType: fileTypeOverride || null,
      status: "processing",
      rowsTotal: rows.length,
    },
  });

  try {
    const parseResult = parseByType(detectedType, headers, rows);
    await applyFuzzyMatching(parseResult);

    const mergeResult = await mergeImportedData(
      parseResult.campaigns,
      parseResult.financialRecords,
      dataImport.id
    );

    const rowsImported = rows.length - parseResult.errors.length;
    await prisma.dataImport.update({
      where: { id: dataImport.id },
      data: {
        status: parseResult.errors.length > 0 ? "partial" : "completed",
        rowsImported,
        rowsError: parseResult.errors.length,
        campaignsCreated: mergeResult.campaignsCreated,
        campaignsUpdated: mergeResult.campaignsUpdated,
        financialRecordsCreated: mergeResult.financialRecordsCreated,
        errorLog: parseResult.errors.length > 0 ? parseResult.errors : undefined,
        completedAt: new Date(),
      },
    });

    const summary: ImportSummary = {
      importId: dataImport.id,
      format: detectedType,
      confidence: detection.confidence,
      reason: detection.reason,
      rowsTotal: rows.length,
      rowsImported,
      rowsSkipped: 0,
      rowsError: parseResult.errors.length,
      campaignsCreated: mergeResult.campaignsCreated,
      campaignsUpdated: mergeResult.campaignsUpdated,
      financialRecordsCreated: mergeResult.financialRecordsCreated,
      errors: parseResult.errors,
    };

    const typeLabel = formatTypeLabel(detectedType);
    const message =
      `Đã import ${rowsImported}/${rows.length} dòng từ ${typeLabel}` +
      ` (${mergeResult.financialRecordsCreated} bản ghi tài chính)`;

    return { summary, message };
  } catch (error) {
    await prisma.dataImport.update({
      where: { id: dataImport.id },
      data: {
        status: "failed",
        errorLog: { message: error instanceof Error ? error.message : "Unknown error" },
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

function formatTypeLabel(type: ExtendedFileFormat): string {
  const labels: Record<string, string> = {
    tiktok_affiliate: "TikTok Affiliate",
  };
  return labels[type] ?? type;
}

/** Custom error for product file redirects */
export class RedirectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RedirectError";
  }
}

/** Custom error for unresolvable detection */
export class DetectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DetectionError";
  }
}
