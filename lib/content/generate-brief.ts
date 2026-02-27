// Phase 3: Generate content brief cho 1 SP bằng Claude API
// Output: 5 angles + 10 hooks + 3 scripts (each with video prompts + caption)

import { callAI } from "@/lib/ai/call-ai";
import { prisma } from "@/lib/db";
import { checkCompliance } from "./compliance";

export interface ProductInput {
  id: string;
  title: string | null;
  category: string | null;
  price: number | null;
  commissionRate: number | string | null;
  description: string | null;
  imageUrl: string | null;
  shopName: string | null;
  shopRating: number | null;
  salesTotal: number | null;
  combinedScore: number | null;
  lifecycleStage: string | null;
  deltaType: string | null;
}

interface GeneratedScript {
  format: string;
  format_name: string;
  duration_s: number;
  hook: string;
  hook_type: string;
  body: string;
  cta: string;
  full_script: string;
  scenes: Array<{
    scene: number;
    start_s: number;
    end_s: number;
    description: string;
    prompt_kling: string;
    prompt_veo3: string;
    text_overlay: string;
    audio_note: string;
  }>;
  caption: string;
  hashtags: string[];
  cta_caption: string;
}

interface GeneratedBrief {
  angles: string[];
  hooks: Array<{ text: string; type: string }>;
  scripts: GeneratedScript[];
}

const SYSTEM_PROMPT = `Bạn là chuyên gia content TikTok affiliate Việt Nam với 5 năm kinh nghiệm.
Bạn tạo content briefs chuyên nghiệp, sáng tạo, phù hợp với audience TikTok VN (gen Z, 18-35).
Output luôn là JSON hợp lệ, không có markdown code fences, không giải thích thêm.`;

function formatVND(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)} triệu`;
  if (price >= 1_000) return `${Math.round(price / 1_000)}K`;
  return price.toLocaleString("vi-VN") + "đ";
}

function formatSalesCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)} triệu`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

function formatTrending(deltaType: string | null, lifecycleStage: string | null): string {
  const parts: string[] = [];

  if (deltaType) {
    const deltaMap: Record<string, string> = {
      "NEW": "Sản phẩm mới",
      "SURGE": "Đang tăng mạnh",
      "COOL": "Đang giảm",
      "STABLE": "Ổn định",
      "REAPPEAR": "Quay lại trending",
    };
    parts.push(deltaMap[deltaType] || deltaType);
  }

  if (lifecycleStage) {
    const stageMap: Record<string, string> = {
      "new": "giai đoạn mới",
      "rising": "đang lên",
      "hot": "đang hot",
      "peak": "đỉnh cao",
      "declining": "đang giảm",
    };
    parts.push(stageMap[lifecycleStage] || lifecycleStage);
  }

  return parts.length > 0 ? parts.join(" — ") : "chưa rõ";
}

/** Build prompt cho Claude API */
function buildBriefPrompt(product: ProductInput): string {
  return `
SẢN PHẨM:
- Tên: ${product.title || "Chưa có tên"}
- Giá: ${product.price ? formatVND(product.price) : "chưa rõ"}
- Danh mục: ${product.category || "chưa rõ"}
- Commission: ${product.commissionRate ? product.commissionRate + "%" : "chưa rõ"}
- Mô tả: ${product.description || "không có"}
- Shop: ${product.shopName || "chưa rõ"}${product.shopRating ? " (" + product.shopRating + " sao)" : ""}
- Đã bán: ${product.salesTotal ? formatSalesCount(product.salesTotal) : "chưa rõ"}
- Xu hướng: ${formatTrending(product.deltaType, product.lifecycleStage)}
- Điểm tiềm năng: ${product.combinedScore ? product.combinedScore + "/100" : "chưa rõ"}

YÊU CẦU:
Tạo content brief đầy đủ cho sản phẩm này. Output JSON với cấu trúc:

{
  "angles": ["5 góc tiếp cận khác nhau — mỗi góc 1 câu ngắn"],
  "hooks": [
    {"text": "câu hook 3 giây gây tò mò", "type": "result|price|compare|myth|problem|unbox|trend"},
    ... (10 hooks)
  ],
  "scripts": [
    {
      "format": "review_short",
      "format_name": "Review ngắn",
      "duration_s": 20,
      "hook": "câu hook 3 giây",
      "hook_type": "result",
      "body": "nội dung chính 10-20 giây",
      "cta": "call to action 3 giây",
      "full_script": "toàn bộ script viết liền",
      "scenes": [
        {
          "scene": 1, "start_s": 0, "end_s": 3,
          "description": "mô tả scene bằng tiếng Việt",
          "prompt_kling": "English prompt for Kling AI - visual, camera, lighting",
          "prompt_veo3": "English prompt for Veo3 - motion, style, atmosphere",
          "text_overlay": "text hiện trên video (nếu có)",
          "audio_note": "voiceover/music note"
        }
      ],
      "caption": "caption TikTok 100-150 ký tự, có emoji",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "cta_caption": "Link ở bio"
    },
    ... (3 scripts với 3 format khác nhau)
  ]
}

QUY TẮC:
- Tiếng Việt tự nhiên, gen Z, thân thiện
- Hook PHẢI gây tò mò trong 3 giây đầu
- CTA luôn có: "Link ở bio" hoặc "Giỏ hàng màu vàng"
- KHÔNG claim y tế, KHÔNG so sánh tiêu cực với brand cụ thể
- Video 15-30 giây (TikTok sweet spot)
- Mỗi script khác angle, khác hook type, khác format
- Scene prompts bằng tiếng Anh cho Kling/Veo3
- Mỗi scene 2-5 giây, tổng = duration_s
- Hashtags mix: niche + trending + product (8-12 tags)
- Luôn có: #tiktokmademebuyit #reviewsanpham
- Nếu SP đã bán nhiều (>1000) → dùng hook social proof: "đã bán XX.XXX đơn"
- Nếu shop rating cao (>4.5) → nhắc đánh giá: "shop X sao với N+ đánh giá"
- Nếu đang SURGE/trending → dùng hook trending: "đang viral trên TikTok"
- Nếu giá rẻ (<100K) → dùng hook giá: "dưới 100K mà chất lượng bất ngờ"
- Nếu commission cao (>15%) → đây là SP đáng push, brief nên hấp dẫn hơn
- Adapt tone theo xu hướng: rising/hot → urgent, stable → review dài hơn, declining → skip trending angle
- Output CHỈ JSON, không có text khác`.trim();
}

/** Strip markdown fences from AI response */
function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  return cleaned;
}

/** Call AI with retry — validates JSON response before returning */
async function callAIWithRetry(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  taskType: "content_brief",
  maxRetries: number = 2,
): Promise<{ text: string; modelUsed: string; parsed: GeneratedBrief }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await callAI(systemPrompt, userPrompt, maxTokens, taskType);
      const cleaned = stripMarkdownFences(result.text);
      const parsed = JSON.parse(cleaned) as GeneratedBrief;

      // Validate brief has required content
      if (!parsed.scripts || parsed.scripts.length === 0) {
        throw new Error("AI tạo brief không có script nào");
      }
      if (!parsed.hooks || parsed.hooks.length === 0) {
        throw new Error("AI tạo brief không có hook nào");
      }

      return { text: cleaned, modelUsed: result.modelUsed, parsed };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[generateBrief] Lần thử ${attempt}/${maxRetries} thất bại:`, lastError.message);

      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw new Error(
    `AI trả kết quả không hợp lệ sau ${maxRetries} lần thử. ${lastError?.message || ""}`,
  );
}

/** Generate brief cho 1 SP → lưu DB */
export async function generateBrief(product: ProductInput): Promise<string> {
  const startTime = Date.now();
  const prompt = buildBriefPrompt(product);

  const { modelUsed, parsed: brief } = await callAIWithRetry(
    SYSTEM_PROMPT, prompt, 6000, "content_brief",
  );
  const generationTimeMs = Date.now() - startTime;

  // Lưu ContentBrief
  const savedBrief = await prisma.contentBrief.create({
    data: {
      productIdentityId: product.id,
      angles: JSON.parse(JSON.stringify(brief.angles)),
      hooks: JSON.parse(JSON.stringify(brief.hooks)),
      scripts: JSON.parse(JSON.stringify(brief.scripts)),
      aiModel: modelUsed,
      promptUsed: prompt,
      generationTimeMs,
    },
  });

  // Tạo ContentAssets từ scripts
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  // Đếm số asset hôm nay để tạo mã
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const existingCount = await prisma.contentAsset.count({
    where: { createdAt: { gte: todayStart } },
  });

  for (let i = 0; i < brief.scripts.length; i++) {
    const script = brief.scripts[i];
    const assetNum = existingCount + i + 1;
    const assetCode = `A-${today}-${String(assetNum).padStart(4, "0")}`;

    // Compliance check
    const fullText = [script.full_script, script.caption, script.cta].join(" ");
    const compliance = checkCompliance(fullText);

    await prisma.contentAsset.create({
      data: {
        assetCode,
        productIdentityId: product.id,
        briefId: savedBrief.id,
        hookText: script.hook,
        hookType: script.hook_type,
        format: script.format,
        angle: brief.angles[i] || brief.angles[0],
        scriptText: script.full_script,
        captionText: script.caption,
        hashtags: script.hashtags,
        ctaText: script.cta_caption || script.cta,
        videoPrompts: script.scenes,
        complianceStatus: compliance.status,
        complianceNotes: compliance.hits.length > 0
          ? compliance.hits.map((h) => `[${h.level}] ${h.word}`).join("; ")
          : null,
        status: "draft",
      },
    });
  }

  // Update identity state → briefed
  await prisma.productIdentity.update({
    where: { id: product.id },
    data: { inboxState: "briefed" },
  });

  return savedBrief.id;
}
