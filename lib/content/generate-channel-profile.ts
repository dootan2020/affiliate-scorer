import { callAI } from "@/lib/ai/call-ai";
import type { AiTaskType } from "@/lib/ai/claude";
import { getModelForTask } from "@/lib/ai/claude";
import type {
  ChannelProfileInput,
  ChannelProfileResult,
} from "./channel-profile-types";

const SYSTEM_PROMPT = `Bạn là chuyên gia xây kênh TikTok triệu followers tại Việt Nam.
Bạn hiểu rõ AI video generation tools (Kling, HeyGen, Veo, CapCut) và biết format nào sản xuất được bằng AI, format nào cần quay thật.
Output luôn là JSON hợp lệ, không có markdown code fences, không giải thích thêm.`;

function buildPrompt(input: ChannelProfileInput): string {
  return `Bạn là chuyên gia xây kênh TikTok triệu followers tại Việt Nam, chuyên niche ${input.niche}.

Target audience: ${input.targetAudience}
Tone mong muốn: ${input.tone}

=== BỐI CẢNH SẢN XUẤT ===
Kênh này sẽ sản xuất video bằng hybrid: AI video tools + quay thật.

AI video tools hiện tại (2026) có thể làm tốt:
- Product showcase (không mặt người): Kling 3.0, Runway Gen-4 — 4K, 15s/clip
- Before/After visual: image-to-video tốt
- Slideshow + voiceover: CapCut + AI voice — dễ nhất, chất lượng ổn
- Talking head (mặt AI): HeyGen — hỗ trợ tiếng Việt nhưng lip-sync ngôn ngữ tonal chưa hoàn hảo
- B-roll sản phẩm: Kling 3.0 Director Memory giữ consistency

AI video tools CHƯA làm tốt (2026):
- Biểu cảm tự nhiên close-up (uncanny valley)
- Tay/ngón tay chi tiết
- Text trong video (phải thêm bằng CapCut)
- Skits/comedy diễn xuất phức tạp
- Lip-sync tiếng Việt dài >15s (cần ghép clip)

Khi thiết kế content, ưu tiên format sản xuất được bằng AI để scale nhanh.
Format cần quay thật: chỉ dùng khi thật sự cần tạo trust (unbox thật, review chân thật có mặt người).

=== VIDEO FORMATS CÓ SẴN ===
Các format trong hệ thống: "before_after", "product_showcase", "slideshow_voiceover", "tutorial_steps", "comparison", "trending_hook"

Hãy tạo profile kênh TikTok hoàn chỉnh, trả về JSON:

{
  "name": "Tên kênh gợi ý (tiếng Việt, dễ nhớ, liên quan niche)",
  "handle": "handle gợi ý (không dấu, lowercase)",
  "personaName": "Tên nhân vật (VD: Chi Lan, Skin Guru, Beauty Mẹ Bỉm)",
  "personaDesc": "Mô tả persona 2-3 câu: tính cách, background, cách nói chuyện. Lưu ý: persona này chủ yếu thể hiện qua GIỌNG NÓI (voiceover) và text style, không nhất thiết xuất hiện mặt.",
  "subNiche": "Sub-niche cụ thể nhất",
  "usp": "Điểm khác biệt duy nhất của kênh — phải liên quan đến cách trình bày/format, không chỉ nội dung",
  "contentPillars": ["Trụ cột 1", "Trụ cột 2", "Trụ cột 3", "Trụ cột 4", "Trụ cột 5"],
  "contentPillarDetails": [
    {
      "pillar": "Tên trụ cột (giống contentPillars)",
      "aiFeasibility": "high | medium | low",
      "recommendedFormats": ["format1", "format2"],
      "productionNotes": "Ghi chú cách sản xuất: AI tool nào, cần quay thật phần nào không"
    }
  ],
  "hookBank": [
    "Hook 1 — phải hoạt động cả khi NGHE (voiceover) và khi ĐỌC (text overlay trên video)",
    "Hook 2",
    "... 15-20 hooks"
  ],
  "contentMix": { "review": 30, "lifestyle": 20, "tutorial": 20, "selling": 20, "entertainment": 10 },
  "contentMixReason": "Giải thích tỷ lệ — cân nhắc: review/tutorial dễ scale bằng AI, entertainment khó (cần diễn xuất), lifestyle phù hợp niche",
  "videoFormats": [
    {
      "contentType": "entertainment | education | review | selling",
      "primaryFormat": "format chính từ danh sách trên",
      "secondaryFormat": "format phụ",
      "aiToolSuggestion": "Tool AI phù hợp nhất (Kling/HeyGen/CapCut)",
      "productionNotes": "Cách sản xuất cụ thể, ví dụ: slideshow ảnh sản phẩm + AI voiceover + text overlay CapCut"
    }
  ],
  "productionStyle": "voiceover_broll | talking_head | product_showcase | hybrid",
  "productionStyleReason": "Giải thích: ví dụ hybrid = voiceover chính + talking head cho review trust + product showcase cho selling",
  "postsPerDay": 2,
  "postingSchedule": {
    "mon": { "times": ["11:30", "19:30"], "focus": "education" },
    "tue": { "times": ["11:30", "19:30"], "focus": "review" },
    "wed": { "times": ["11:30", "19:30"], "focus": "entertainment" },
    "thu": { "times": ["11:30", "20:00"], "focus": "selling" },
    "fri": { "times": ["11:30", "19:30"], "focus": "entertainment" },
    "sat": { "times": ["7:30", "12:00", "20:00"], "focus": "review" },
    "sun": { "times": ["7:30", "12:00", "20:00"], "focus": "education" }
  },
  "seriesSchedule": [
    { "name": "Tên series 1", "dayOfWeek": "Thứ mấy", "contentPillar": "Pillar nào" },
    { "name": "Tên series 2", "dayOfWeek": "Thứ mấy", "contentPillar": "Pillar nào" }
  ],
  "ctaTemplates": {
    "entertainment": "CTA cho video giải trí — ngắn gọn, dùng được làm text overlay",
    "education": "CTA cho video giáo dục",
    "review": "CTA cho video review — hướng đến giỏ hàng affiliate",
    "selling": "CTA cho video bán hàng — urgency + link giỏ hàng"
  },
  "competitorChannels": [
    { "handle": "@handle1", "followers": "số followers", "whyReference": "Tham khảo cái gì: format, nhịp edit, hay style hook" },
    { "handle": "@handle2", "followers": "số followers", "whyReference": "Lý do tham khảo" },
    { "handle": "@handle3", "followers": "số followers", "whyReference": "Lý do tham khảo" }
  ],
  "voiceStyle": "casual | professional | energetic | calm",
  "editingStyle": "fast_cut | smooth | cinematic | minimal",
  "fontStyle": "modern | elegant | playful | minimal",
  "colorPrimary": "#hex",
  "colorSecondary": "#hex"
}

Yêu cầu:
- Tất cả bằng tiếng Việt CÓ DẤU đầy đủ (trừ handle, format names, tool names). KHÔNG được viết không dấu như "Co nang" mà phải viết "Cô nàng"
- Hook bank: mỗi hook phải hoạt động khi đọc thành text overlay VÀ khi nghe voiceover. Tránh hook chỉ có nghĩa khi thấy mặt người nói.
- Content mix: cân nhắc khả năng sản xuất bằng AI. Entertainment (skits, comedy) khó làm AI → giữ ≤25%. Education + review dễ scale bằng AI → ưu tiên.
- Posting schedule: giờ cao điểm TikTok VN là 7:00-8:00, 11:30-13:00, 19:00-21:00. Ngày thường 2 slot (trưa + tối). Cuối tuần 3 slot (sáng + trưa + tối).
- contentPillarDetails: đánh giá thực tế mỗi pillar có sản xuất được bằng AI video không
- videoFormats: map mỗi content type sang format phù hợp nhất
- productionStyle: chọn style phù hợp niche — niche cần trust (skincare, sức khỏe) thì hybrid/talking_head; niche visual (thời trang, decor) thì product_showcase
- USP: phải rõ ràng, không chung chung
- CHỈ trả về JSON, không text khác`.trim();
}

function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  return cleaned;
}

/** Resolve task type — fallback to content_brief if channel_profile not configured */
async function resolveTaskType(): Promise<AiTaskType> {
  try {
    await getModelForTask("channel_profile");
    return "channel_profile";
  } catch {
    return "content_brief";
  }
}

export async function generateChannelProfile(
  input: ChannelProfileInput,
): Promise<ChannelProfileResult> {
  const MAX_RETRIES = 2;
  const taskType = await resolveTaskType();
  const userPrompt = buildPrompt(input);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callAI(SYSTEM_PROMPT, userPrompt, 6144, taskType);
      const cleaned = stripMarkdownFences(result.text);
      const parsed = JSON.parse(cleaned) as ChannelProfileResult;

      if (!parsed.name || !parsed.contentPillars || !parsed.hookBank) {
        throw new Error("AI trả JSON thiếu trường bắt buộc (name/contentPillars/hookBank)");
      }

      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `[generateChannelProfile] Lần thử ${attempt}/${MAX_RETRIES} thất bại:`,
        lastError.message,
      );
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw new Error(
    `AI trả kết quả không hợp lệ sau ${MAX_RETRIES} lần thử. ${lastError?.message ?? ""}`,
  );
}
