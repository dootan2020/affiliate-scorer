import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseFile } from "@/lib/parsers/parse-file";
import { detectFormat } from "@/lib/parsers/detect-format";
import { parseFbAds } from "@/lib/parsers/fb-ads";
import { parseTikTokAds } from "@/lib/parsers/tiktok-ads";
import { parseShopeeAffiliate } from "@/lib/parsers/shopee-affiliate";
import { mapFeedbackToProducts } from "@/lib/utils/mapper";
import type { FeedbackEntry } from "@/lib/utils/mapper";
import type { FbAdsFeedbackEntry } from "@/lib/parsers/fb-ads";
import type { TikTokAdsFeedbackEntry } from "@/lib/parsers/tiktok-ads";
import type { ShopeeAffiliateFeedbackEntry } from "@/lib/parsers/shopee-affiliate";

function isFbAds(entry: FeedbackEntry): entry is FbAdsFeedbackEntry {
  return "adPlatform" in entry && entry.adPlatform === "facebook";
}

function isTikTokAds(entry: FeedbackEntry): entry is TikTokAdsFeedbackEntry {
  return "adPlatform" in entry && entry.adPlatform === "tiktok";
}

function isShopeeAffiliate(entry: FeedbackEntry): entry is ShopeeAffiliateFeedbackEntry {
  return "salesPlatform" in entry && entry.salesPlatform === "shopee";
}

export async function POST(request: Request): Promise<NextResponse> {
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

    if (format !== "fb_ads" && format !== "tiktok_ads" && format !== "shopee_affiliate") {
      return NextResponse.json(
        { error: `Không nhận diện được định dạng feedback. Hỗ trợ: Facebook Ads, TikTok Ads, Shopee Affiliate.` },
        { status: 400 }
      );
    }

    let entries: FeedbackEntry[];
    if (format === "fb_ads") {
      entries = parseFbAds(rows);
    } else if (format === "tiktok_ads") {
      entries = parseTikTokAds(rows);
    } else {
      entries = parseShopeeAffiliate(rows);
    }

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy dữ liệu nào trong file" },
        { status: 400 }
      );
    }

    const mapped = await mapFeedbackToProducts(entries);
    const autoMapped = mapped.filter((m) => m.autoMapped && m.productId);

    const saved = await Promise.all(
      autoMapped.map(async ({ entry, productId, aiScoreAtSelection }) => {
        if (!productId) return null;

        const base = {
          productId,
          aiScoreAtSelection: aiScoreAtSelection ?? 0,
          overallSuccess: "moderate" as const,
        };

        if (isFbAds(entry)) {
          return prisma.feedback.create({
            data: {
              ...base,
              adPlatform: entry.adPlatform,
              adImpressions: entry.adImpressions,
              adClicks: entry.adClicks,
              adCTR: entry.adCTR,
              adCPC: entry.adCPC,
              adConversions: entry.adConversions,
              adCostPerConv: entry.adCostPerConv,
              adROAS: entry.adROAS,
              adSpend: entry.adSpend,
            },
          });
        }

        if (isTikTokAds(entry)) {
          return prisma.feedback.create({
            data: {
              ...base,
              adPlatform: entry.adPlatform,
              adImpressions: entry.adImpressions,
              adClicks: entry.adClicks,
              adConversions: entry.adConversions,
              adSpend: entry.adSpend,
              orgViews: entry.orgViews,
              orgWatchTimeAvg: entry.orgWatchTimeAvg,
            },
          });
        }

        if (isShopeeAffiliate(entry)) {
          return prisma.feedback.create({
            data: {
              ...base,
              salesPlatform: entry.salesPlatform,
              commissionEarned: entry.commissionEarned,
              conversionRate: entry.conversionRate,
              orders: entry.orders,
              revenue: entry.revenue,
            },
          });
        }

        return null;
      })
    );

    const savedCount = saved.filter(Boolean).length;

    return NextResponse.json({
      data: {
        format,
        totalParsed: entries.length,
        autoMapped: autoMapped.length,
        saved: savedCount,
        mappings: mapped.map((m) => ({
          entryName: "campaignName" in m.entry ? m.entry.campaignName : (m.entry as ShopeeAffiliateFeedbackEntry).productName,
          productName: m.productName,
          confidence: Math.round(m.confidence * 100),
          autoMapped: m.autoMapped,
        })),
      },
      message: `Đã lưu ${savedCount} bản ghi feedback (${autoMapped.length}/${entries.length} tự động ghép)`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
