import { prisma } from "@/lib/db";
import { toJsonValue } from "@/lib/utils/typed-json";
import type {
  ImportedFinancialRecord,
} from "./types";

interface MergeResult {
  financialRecordsCreated: number;
}

/**
 * Merge imported data into database.
 * Campaign creation/update removed — Content Factory workflow uses
 * Product + ProductIdentity created via /api/upload/products.
 */
export async function mergeImportedData(
  financialRecords: ImportedFinancialRecord[],
  _dataImportId: string,
): Promise<MergeResult> {
  let financialRecordsCreated = 0;

  // Save financial records
  for (const record of financialRecords) {
    await prisma.financialRecord.create({
      data: {
        type: record.type,
        amount: record.amount,
        source: record.source,
        productId: record.productId,
        campaignId: record.campaignId,
        date: record.date,
        notes: record.notes,
        metadata: record.metadata
          ? toJsonValue(record.metadata)
          : undefined,
      },
    });
    financialRecordsCreated++;
  }

  return { financialRecordsCreated };
}
