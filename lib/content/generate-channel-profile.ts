import { callAI } from "@/lib/ai/call-ai";
import type { AiTaskType } from "@/lib/ai/claude";
import { getModelForTask } from "@/lib/ai/claude";
import type {
  ChannelProfileInput,
  ChannelProfileResult,
} from "./channel-profile-types";

const SYSTEM_PROMPT = `Bạn là chuyên gia xây kênh TikTok triệu followers tại Việt Nam.
Output luôn là JSON hợp lệ, không có markdown code fences, không giải thích thêm.`;

function buildPrompt(input: ChannelProfileInput): string {
  return `Bạn là chuyên gia xây kênh TikTok triệu followers tại Việt Nam, chuyên niche ${input.niche}.

Target audience: ${input.targetAudience}
Tone mong muốn: ${input.tone}

Hãy tạo profile kênh TikTok hoàn chỉnh, trả về JSON:

{
  "name": "Tên kênh gợi ý (tiếng Việt, dễ nhớ, liên quan niche)",
  "handle": "handle gợi ý (không dấu, lowercase)",
  "personaName": "Tên nhân vật (VD: Chi Lan, Skin Guru, Beauty Mẹ Bỉm)",
  "personaDesc": "Mô tả persona 2-3 câu: tính cách, background, cách nói chuyện",
  "subNiche": "Sub-niche cụ thể nhất",
  "usp": "Điểm khác biệt duy nhất của kênh này so với hàng nghìn kênh cùng niche",
  "contentPillars": ["Trụ cột 1", "Trụ cột 2", "Trụ cột 3", "Trụ cột 4", "Trụ cột 5"],
  "hookBank": ["Hook 1", "Hook 2", "... 15-20 hooks proven trên TikTok VN"],
  "contentMix": { "entertainment": 40, "education": 25, "review": 20, "selling": 15 },
  "contentMixReason": "Giải thích tại sao tỷ lệ này phù hợp",
  "postsPerDay": 2,
  "postingSchedule": {
    "mon": { "times": ["10:00", "19:30"], "focus": "education" },
    "tue": { "times": ["10:00", "19:30"], "focus": "review" },
    "wed": { "times": ["10:00", "19:30"], "focus": "entertainment" },
    "thu": { "times": ["10:00", "19:30"], "focus": "selling" },
    "fri": { "times": ["10:00", "19:30"], "focus": "entertainment" },
    "sat": { "times": ["10:00", "14:00", "20:00"], "focus": "entertainment" },
    "sun": { "times": ["10:00", "14:00", "20:00"], "focus": "review" }
  },
  "seriesSchedule": [
    { "name": "Tên series 1", "dayOfWeek": "Thứ mấy", "contentPillar": "Pillar nào" },
    { "name": "Tên series 2", "dayOfWeek": "Thứ mấy", "contentPillar": "Pillar nào" }
  ],
  "ctaTemplates": {
    "entertainment": "CTA cho video giải trí",
    "education": "CTA cho video giáo dục",
    "review": "CTA cho video review",
    "selling": "CTA cho video bán hàng"
  },
  "competitorChannels": [
    { "handle": "@handle1", "followers": "số followers", "whyReference": "Lý do tham khảo" },
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
- Tất cả bằng tiếng Việt (trừ handle)
- Hook bank phải thực tế, đã proven trên TikTok VN
- Content mix phải có lý do rõ ràng
- Posting schedule tối ưu cho audience VN (giờ cao điểm: 7-8h, 12-13h, 19-21h)
- USP phải rõ ràng, không chung chung
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
      const result = await callAI(SYSTEM_PROMPT, userPrompt, 4096, taskType);
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
