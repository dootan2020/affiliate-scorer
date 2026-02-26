import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseFile } from "@/lib/parsers/parse-file";
import { detectFormat } from "@/lib/parsers/detect-format";
import { parseTikTokAds } from "@/lib/parsers/tiktok-ads";
import type { TikTokAdsFeedbackEntry } from "@/lib/parsers/tiktok-ads";

// ─── Types ───────────────────────────────────────────────────────────────────

type FeedbackEntry = TikTokAdsFeedbackEntry;

function getEntryName(entry: FeedbackEntry): string {
  if ("campaignName" in entry) return entry.campaignName;
  return "";
}

function calculateOverallSuccess(entry: FeedbackEntry): string {
  const conversions = entry.adConversions ?? 0;
  const spend = entry.adSpend ?? 0;
  if (conversions >= 5) return "success";
  if (conversions > 0 && spend > 0 && (conversions / spend) * 100000 >= 2) return "success";
  if (conversions > 0) return "moderate";
  return "poor";
}

// ─── Fuzzy matching ───────────────────────────────────────────────────────────

function normalizeForCompare(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const na = normalizeForCompare(a);
  const nb = normalizeForCompare(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) {
    return Math.min(na.length, nb.length) / Math.max(na.length, nb.length);
  }
  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

// ─── Route ───────────────────────────────────────────────────────────────────

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

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File quá lớn. Tối đa 10MB." },
        { status: 413 }
      );
    }

    const { headers, rows } = await parseFile(file);
    const format = detectFormat(headers);

    if (format !== "tiktok_ads") {
      return NextResponse.json(
        { error: "Không nhận diện được định dạng feedback. Hỗ trợ: TikTok Ads." },
        { status: 400 }
      );
    }

    const entries: FeedbackEntry[] = parseTikTokAds(rows);

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy dữ liệu nào trong file" },
        { status: 400 }
      );
    }

    // Fuzzy match to products
    const products = await prisma.product.findMany({
      select: { id: true, name: true, aiScore: true },
    });

    const mapped = entries.map((entry) => {
      const entryName = getEntryName(entry);
      if (!entryName || products.length === 0) {
        return { entry, productId: null, productName: null, aiScoreAtSelection: null, confidence: 0, autoMapped: false };
      }
      let bestScore = 0;
      let bestProduct: { id: string; name: string; aiScore: number | null } | null = null;
      for (const product of products) {
        const score = similarity(entryName, product.name);
        if (score > bestScore) { bestScore = score; bestProduct = product; }
      }
      const autoMapped = bestScore >= 0.7;
      return {
        entry,
        productId: autoMapped && bestProduct ? bestProduct.id : null,
        productName: bestProduct?.name ?? null,
        aiScoreAtSelection: autoMapped && bestProduct ? (bestProduct.aiScore ?? null) : null,
        confidence: bestScore,
        autoMapped,
      };
    });

    const autoMapped = mapped.filter((m) => m.autoMapped && m.productId);

    const saved = await Promise.all(
      autoMapped.map(async ({ entry, productId, aiScoreAtSelection }) => {
        if (!productId) return null;
        return prisma.feedback.create({
          data: {
            productId,
            aiScoreAtSelection: aiScoreAtSelection ?? 0,
            overallSuccess: calculateOverallSuccess(entry),
            adPlatform: entry.adPlatform,
            adImpressions: entry.adImpressions,
            adClicks: entry.adClicks,
            adConversions: entry.adConversions,
            adSpend: entry.adSpend,
            orgViews: entry.orgViews,
            orgWatchTimeAvg: entry.orgWatchTimeAvg,
          },
        });
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
          entryName: getEntryName(m.entry),
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
