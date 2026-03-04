// Phase 3: Generate content brief cho 1 SP bằng Claude API
// Output: 5 angles + 10 hooks + 3 scripts (each with video prompts + caption)

import { callAI } from "@/lib/ai/call-ai";
import { prisma } from "@/lib/db";
import { checkCompliance } from "./compliance";
import type { CharacterBibleData } from "./character-bible-types";
import type { FormatTemplateData } from "./format-template-types";
import { buildCharacterBlock, buildFormatBlock } from "./build-character-prompt-block";
import { buildVideoBibleBlock } from "./build-video-bible-prompt-block";
import { runConsistencyQc } from "./consistency-qc";

export interface ChannelContext {
  channelId: string;
  personaName: string;
  personaDesc: string;
  voiceStyle: string;
  targetAudience: string | null;
  editingStyle: string | null;
  niche: string | null;
}

export interface CalendarEventInput {
  name: string;
  startDate: Date;
  eventType: string;
}

export interface SuggestedHookInput {
  type: string;
  template: string;
  example: string;
}

export interface SuggestedFormatInput {
  id: string;
  name: string;
  description: string;
}

export interface BriefOptions {
  channel?: ChannelContext | null;
  contentType?: string | null; // entertainment | education | review | selling
  videoFormat?: string | null; // before_after | product_showcase | slideshow_voiceover | tutorial_steps | comparison | trending_hook
  targetDuration?: number | null; // seconds (15-60)
  characterBible?: CharacterBibleData | null;
  formatTemplate?: FormatTemplateData | null;
  videoBible?: Record<string, unknown> | null;
  bibleVersion?: number | null;
  videoBibleVersion?: number | null;
  calendarEvents?: CalendarEventInput[] | null;
  suggestedHooks?: SuggestedHookInput[] | null;
  suggestedFormats?: SuggestedFormatInput[] | null;
}

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

const CONTENT_TYPE_GOALS: Record<string, string> = {
  entertainment: "Giải trí — mục tiêu: reach, follower. Dùng hook viral, trending, hài hước.",
  education: "Giáo dục — mục tiêu: trust, save. Chia sẻ tips, ingredients, routine.",
  review: "Review — mục tiêu: engagement, soft sell. Trải nghiệm SP, so sánh, cảm nhận thật.",
  selling: "Bán hàng — mục tiêu: conversion. Demo SP, before/after, CTA rõ ràng.",
};

const VIDEO_FORMAT_GUIDE: Record<string, string> = {
  before_after: `Format: Before/After
- Scene 1: Trạng thái "trước" (da/tóc chưa tốt, close-up, ánh sáng tự nhiên)
- Scene 2: Transition effect (smooth morph, magic glow)
- Scene 3: Trạng thái "sau" (da/tóc đẹp, glowing, healthy)
- Scene 4: Product shot (SP xoay, studio lighting, clean background)
- Prompt Kling: nhấn mạnh transformation, smooth transition
- CTA cuối: link sản phẩm`,
  product_showcase: `Format: Product Showcase
- Scene 1: SP xoay 360 chậm, studio lighting, white background
- Scene 2: Close-up texture/chi tiết SP, macro shot
- Scene 3: SP trong bối cảnh lifestyle (bàn trang điểm, phòng tắm)
- Scene 4: Tay cầm SP, mở nắp/bôi (nếu phù hợp)
- Prompt Kling: nhấn mạnh product detail, cinematic lighting`,
  slideshow_voiceover: `Format: Slideshow + Voiceover
- 5-7 slides: mỗi slide = 1 ảnh + text overlay ngắn
- Slide 1: Ảnh SP chính + hook text ("Bạn có biết...?")
- Slide 2-4: Chi tiết benefits + ảnh liên quan
- Slide 5: Kết quả/lifestyle + CTA
- PHẢI có voiceover_script: script TTS đầy đủ cho AI đọc
- Sound style: calm hoặc upbeat tùy tone`,
  tutorial_steps: `Format: Tutorial Steps
- "3 bước skincare" hoặc "cách dùng đúng" dạng slideshow
- Step 1, Step 2, Step 3... rõ ràng
- Mỗi step: text overlay hướng dẫn + ảnh/video minh họa
- Kết: kết quả + CTA sản phẩm`,
  comparison: `Format: Comparison
- So sánh 2 trạng thái: có vs không dùng SP, hoặc SP này vs SP khác (không nêu tên brand khác)
- Split screen hoặc before/after layout
- Text overlay so sánh rõ ràng
- Kết: SP chiến thắng + CTA`,
  trending_hook: `Format: Trending Hook
- 3 giây đầu: hook trending viral (câu hỏi hot, controversy nhẹ, "POV khi...")
- Phần giữa: gắn SP vào context trending 1 cách tự nhiên
- CTA cuối: "Link ở bio" / "Giỏ hàng màu vàng"
- Tone: vui, bắt trend, không quá bán hàng`,
};

/** Build prompt cho Claude API */
function buildBriefPrompt(product: ProductInput, options?: BriefOptions): string {
  const channelBlock = options?.channel ? `
KÊNH TIKTOK:
- Persona: ${options.channel.personaName} — ${options.channel.personaDesc}
- Niche: ${options.channel.niche || "chung"}
- Voice style: ${options.channel.voiceStyle}
- Đối tượng: ${options.channel.targetAudience || "Nữ 18-35, quan tâm skincare"}
- Editing style: ${options.channel.editingStyle || "fast_cut"}
→ Tạo content phù hợp persona, niche và voice style kênh.
` : "";

  const contentTypeBlock = options?.contentType ? `
LOẠI CONTENT: ${CONTENT_TYPE_GOALS[options.contentType] || options.contentType}
→ Tất cả 3 scripts PHẢI theo loại content này.
` : "";

  const videoFormatBlock = options?.videoFormat ? `
VIDEO FORMAT:
${VIDEO_FORMAT_GUIDE[options.videoFormat] || options.videoFormat}
→ Tất cả 3 scripts PHẢI theo format này, mỗi script khác angle/hook.
` : "";

  const durationBlock = options?.targetDuration ? `
THỜI LƯỢNG MỤC TIÊU: ${options.targetDuration} giây
→ Mỗi script duration_s = ${options.targetDuration}. Chia scenes phù hợp.
` : "";

  const characterBlock = options?.characterBible
    ? `\n${buildCharacterBlock(options.characterBible)}\n`
    : "";

  const formatBlock = options?.formatTemplate
    ? `\n${buildFormatBlock(options.formatTemplate)}\n`
    : "";

  const videoBibleBlock = options?.videoBible
    ? `\n${buildVideoBibleBlock(options.videoBible)}\n`
    : "";

  const calendarBlock = options?.calendarEvents && options.calendarEvents.length > 0 ? `
SỰ KIỆN SẮP TỚI (adapt content theo timing):
${options.calendarEvents.map((e) => {
  const dateStr = new Date(e.startDate).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
  return `- ${e.name} (${e.eventType}) — ngày ${dateStr}`;
}).join("\n")}
→ Nên tạo content liên quan đến sự kiện gần nhất nếu phù hợp với sản phẩm.
` : "";

  const exploreExploitBlock = (() => {
    const parts: string[] = [];
    if (options?.suggestedHooks && options.suggestedHooks.length > 0) {
      const splitIdx = Math.round(options.suggestedHooks.length * 0.7);
      const proven = options.suggestedHooks.slice(0, splitIdx);
      const explore = options.suggestedHooks.slice(splitIdx);
      parts.push(`HOOKS GỢI Ý (ưu tiên dùng, có thể thay đổi nếu cần):
- Đã chứng minh: ${proven.map((h) => `"${h.type}"`).join(", ")}
- Khám phá mới: ${explore.map((h) => `"${h.type}"`).join(", ") || "không có"}`);
    }
    if (options?.suggestedFormats && options.suggestedFormats.length > 0) {
      parts.push(`FORMATS GỢI Ý:
${options.suggestedFormats.map((f) => `- ${f.name}: ${f.description}`).join("\n")}`);
    }
    return parts.length > 0 ? "\n" + parts.join("\n\n") + "\n" : "";
  })();

  return `${channelBlock}${characterBlock}${formatBlock}${videoBibleBlock}${calendarBlock}${exploreExploitBlock}${contentTypeBlock}${videoFormatBlock}${durationBlock}
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

/** Generate brief cho 1 SP → lưu DB (atomic transaction) */
export async function generateBrief(product: ProductInput, options?: BriefOptions): Promise<string> {
  // Pre-check: verify product is in a state that allows brief generation
  const identity = await prisma.productIdentity.findUnique({
    where: { id: product.id },
    select: { inboxState: true },
  });

  if (!identity) throw new Error("Không tìm thấy sản phẩm");

  const allowedStates = ["scored", "enriched", "briefed"];
  if (!allowedStates.includes(identity.inboxState)) {
    throw new Error(
      `Không thể tạo brief: sản phẩm đang ở "${identity.inboxState}", cần [${allowedStates.join(", ")}]`,
    );
  }

  // AI call — OUTSIDE transaction (slow, external service)
  const startTime = Date.now();
  const prompt = buildBriefPrompt(product, options);
  const { modelUsed, parsed: brief } = await callAIWithRetry(
    SYSTEM_PROMPT, prompt, 6000, "content_brief",
  );
  const generationTimeMs = Date.now() - startTime;

  // Pre-compute compliance for all scripts (outside transaction)
  const complianceResults = brief.scripts.map((script) => {
    const fullText = [script.full_script, script.caption, script.cta].join(" ");
    return checkCompliance(fullText);
  });

  // Run consistency QC if character bible provided
  const qcResults = brief.scripts.map((script) =>
    runConsistencyQc(
      script.full_script,
      script.hook,
      script.cta,
      options?.characterBible ?? null,
    ),
  );
  // Aggregate QC for the brief overall
  const briefQcOverall = qcResults.some((r) => r.overall === "warn") ? "warn" : "pass";
  const briefQcDetails = qcResults.flatMap((r, i) =>
    r.checks.map((c) => ({ script: i + 1, ...c })),
  );

  // Atomic DB writes: brief + assets + inboxState in single transaction
  const savedBriefId = await prisma.$transaction(async (tx) => {
    // Optimistic lock: re-check state inside transaction
    const current = await tx.productIdentity.findUnique({
      where: { id: product.id },
      select: { inboxState: true },
    });

    if (!current || !allowedStates.includes(current.inboxState)) {
      throw new Error("Trạng thái sản phẩm đã thay đổi (có request đồng thời?)");
    }

    // Create brief
    const savedBrief = await tx.contentBrief.create({
      data: {
        productIdentityId: product.id,
        channelId: options?.channel?.channelId ?? null,
        angles: JSON.parse(JSON.stringify(brief.angles)),
        hooks: JSON.parse(JSON.stringify(brief.hooks)),
        scripts: JSON.parse(JSON.stringify(brief.scripts)),
        aiModel: modelUsed,
        promptUsed: prompt,
        generationTimeMs,
        formatSlug: options?.formatTemplate?.slug ?? null,
        qcStatus: briefQcOverall,
        qcDetails: briefQcDetails,
        bibleVersion: options?.bibleVersion ?? null,
        videoBibleVersion: options?.videoBibleVersion ?? null,
      },
    });

    // Create assets inside same transaction
    // NOTE: 3 assets/brief hiện tại. Nếu tăng → chuyển sang createMany batch insert
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const baseCount = await tx.contentAsset.count({
      where: { createdAt: { gte: todayStart } },
    });

    for (let i = 0; i < brief.scripts.length; i++) {
      const script = brief.scripts[i];
      const compliance = complianceResults[i];
      const assetCode = `A-${today}-${String(baseCount + 1 + i).padStart(4, "0")}`;

      await tx.contentAsset.create({
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
          contentType: options?.contentType ?? null,
          videoFormat: options?.videoFormat ?? null,
          targetDuration: options?.targetDuration ?? null,
          channelId: options?.channel?.channelId ?? null,
          soundStyle: (script as unknown as Record<string, unknown>).sound_style as string ?? null,
          ctaSuggestion: script.cta,
          complianceStatus: compliance.status,
          complianceNotes: compliance.hits.length > 0
            ? compliance.hits.map((h) => `[${h.level}] ${h.word}`).join("; ")
            : null,
          status: "draft",
        },
      });
    }

    // Update inboxState atomically with optimistic lock
    const updated = await tx.productIdentity.updateMany({
      where: {
        id: product.id,
        inboxState: { in: allowedStates },
      },
      data: { inboxState: "briefed" },
    });

    if (updated.count === 0) {
      throw new Error("Brief đồng thời — request khác đã xử lý sản phẩm này");
    }

    return savedBrief.id;
  });

  return savedBriefId;
}
