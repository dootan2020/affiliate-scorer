import { prisma } from "@/lib/db";
import { toJsonValue } from "@/lib/utils/typed-json";
import type {
  ImportedCampaign,
  ImportedDailyResult,
  ImportedFinancialRecord,
} from "./types";

interface MergeResult {
  campaignsCreated: number;
  campaignsUpdated: number;
  financialRecordsCreated: number;
}

export async function mergeImportedData(
  campaigns: ImportedCampaign[],
  financialRecords: ImportedFinancialRecord[],
  dataImportId: string
): Promise<MergeResult> {
  let campaignsCreated = 0;
  let campaignsUpdated = 0;
  let financialRecordsCreated = 0;

  for (const campaign of campaigns) {
    // Find existing campaign by name + platform (case-insensitive)
    const existing = await prisma.campaign.findFirst({
      where: {
        name: { equals: campaign.name, mode: "insensitive" },
        platform: campaign.platform,
      },
    });

    if (existing) {
      // Merge daily results — imported overrides existing
      const existingResults = (Array.isArray(existing.dailyResults) ? existing.dailyResults : []) as unknown as ImportedDailyResult[];
      const merged = mergeDailyResults(existingResults, campaign.dailyResults);

      const totalSpend = merged.reduce((s, r) => s + r.spend, 0);
      const totalRevenue = merged.reduce((s, r) => s + r.revenue, 0);
      const totalOrders = merged.reduce((s, r) => s + r.orders, 0);

      await prisma.campaign.update({
        where: { id: existing.id },
        data: {
          dailyResults: toJsonValue(merged),
          totalSpend: Math.round(totalSpend),
          totalRevenue: Math.round(totalRevenue),
          totalOrders,
          roas: totalSpend > 0 ? totalRevenue / totalSpend : null,
          profitLoss: Math.round(totalRevenue - totalSpend),
          sourceType: campaign.sourceType,
          dataImportId,
          productId: campaign.productId || existing.productId,
        },
      });
      campaignsUpdated++;
    } else {
      // Create new campaign
      const totalSpend = campaign.dailyResults.reduce(
        (s, r) => s + r.spend,
        0
      );
      const totalRevenue = campaign.dailyResults.reduce(
        (s, r) => s + r.revenue,
        0
      );
      const totalOrders = campaign.dailyResults.reduce(
        (s, r) => s + r.orders,
        0
      );

      await prisma.campaign.create({
        data: {
          name: campaign.name,
          platform: campaign.platform,
          status: "completed",
          productId: campaign.productId,
          dailyResults: toJsonValue(campaign.dailyResults),
          totalSpend: Math.round(totalSpend),
          totalRevenue: Math.round(totalRevenue),
          totalOrders,
          roas: totalSpend > 0 ? totalRevenue / totalSpend : null,
          profitLoss: Math.round(totalRevenue - totalSpend),
          sourceType: campaign.sourceType,
          dataImportId,
          startedAt: campaign.startDate
            ? new Date(campaign.startDate)
            : null,
          endedAt: campaign.endDate ? new Date(campaign.endDate) : null,
        },
      });
      campaignsCreated++;
    }
  }

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

  return { campaignsCreated, campaignsUpdated, financialRecordsCreated };
}

function mergeDailyResults(
  existing: ImportedDailyResult[],
  imported: ImportedDailyResult[]
): ImportedDailyResult[] {
  const map = new Map<string, ImportedDailyResult>();

  // Load existing results
  for (const r of existing) {
    map.set(r.date, r);
  }

  // Imported overrides existing (platform data is more accurate than manual)
  for (const r of imported) {
    map.set(r.date, { ...map.get(r.date), ...r });
  }

  return Array.from(map.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
