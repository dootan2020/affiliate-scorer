// AI-powered Character Bible generation from channel info
// Follows generate-channel-profile.ts pattern

import { callAI } from "@/lib/ai/call-ai";
import type { AiTaskType } from "@/lib/ai/claude";
import { getModelForTask } from "@/lib/ai/claude";
import type { CharacterBibleData } from "./character-bible-types";

interface GenerateInput {
  niche: string;
  personaName: string;
  personaDesc: string;
  voiceStyle: string;
  targetAudience: string | null;
  subNiche: string | null;
  usp: string | null;
}

const SYSTEM_PROMPT = `Bạn là chuyên gia xây dựng nhân vật KOL/KOC cho TikTok Việt Nam.
Bạn hiểu sâu về character design, storytelling, và cách tạo nhân vật nhất quán cho hàng trăm video.
Output luôn là JSON hợp lệ, không có markdown code fences, không giải thích thêm.`;

function buildPrompt(input: GenerateInput): string {
  return `Tạo Character Bible 7 tầng cho kênh TikTok:

THÔNG TIN KÊNH:
- Niche: ${input.niche}${input.subNiche ? ` (${input.subNiche})` : ""}
- Persona: ${input.personaName} — ${input.personaDesc}
- Voice: ${input.voiceStyle}
- Đối tượng: ${input.targetAudience || "Nữ 18-35"}
${input.usp ? `- USP: ${input.usp}` : ""}

Trả về JSON với cấu trúc:
{
  "coreValues": ["3 niềm tin cốt lõi của nhân vật"],
  "coreFear": "nỗi sợ sâu xa nhất — tạo chiều sâu",
  "crisisResponse": "khi gặp khủng hoảng, nhân vật phản ứng thế nào",
  "redLines": ["3-5 điều nhân vật KHÔNG BAO GIỜ làm"],
  "relationships": [
    {"name": "tên", "role": "sidekick|mentor|anti-fan|rival", "personality": "tính cách", "catchphrase": "câu cửa miệng", "dynamic": "cách tương tác"}
  ],
  "worldRules": [
    {"rule": "luật trong thế giới nhân vật", "effect": "tạo tình huống content gì"}
  ],
  "weaknesses": ["3 điểm yếu dễ thương — tạo sự đồng cảm"],
  "originWound": "vết thương quá khứ — tại sao bắt đầu làm content",
  "originVow": "lời thề — sứ mệnh cá nhân",
  "originSymbol": "biểu tượng nhận diện (vật thể/hành động signature)",
  "livingSpaces": [
    {"name": "tên bối cảnh", "mood": "cảm xúc", "visualDesc": "mô tả hình ảnh chi tiết"}
  ],
  "storyArcs": [
    {"chapter": 1, "weeks": "1-4", "title": "tên chapter", "description": "nội dung arc"},
    {"chapter": 2, "weeks": "5-8", "title": "tên chapter", "description": "nội dung arc"},
    {"chapter": 3, "weeks": "9-12", "title": "tên chapter", "description": "nội dung arc"}
  ],
  "catchphrases": ["5-10 câu cửa miệng lặp đi lặp lại — tạo nhận diện"],
  "insideJokes": ["3-5 inside jokes chỉ fan hiểu"],
  "rituals": ["3 ritual lặp lại mỗi video/tuần"],
  "vocabularyRules": ["từ luôn dùng / không bao giờ dùng"],
  "visualLocks": {
    "props": ["5-10 props nhận diện cố định"],
    "texture": "ánh sáng, nền, vibe",
    "colorPalette": "bảng màu chủ đạo"
  },
  "voiceDna": {
    "tone": "giọng điệu chính",
    "pace": "nhịp nói (nhanh/chậm/biến đổi)",
    "signature": "đặc điểm giọng nhận diện"
  }
}

QUY TẮC:
- Tiếng Việt tự nhiên, phù hợp TikTok VN
- Catchphrases phải ngắn, dễ nhớ, dùng được trong video
- Inside jokes tạo cộng đồng, không offensive
- Relationships tạo chemistry cho content (đối thoại, react, drama nhẹ)
- World rules tạo tình huống tự nhiên cho content hàng tuần
- Story arcs 12 tuần = 1 mùa, có arc rõ ràng
- Visual locks + voice DNA phải nhất quán 100%
- CHỈ trả về JSON`.trim();
}

function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  return cleaned;
}

async function resolveTaskType(): Promise<AiTaskType> {
  try {
    await getModelForTask("character_bible" as AiTaskType);
    return "character_bible" as AiTaskType;
  } catch {
    return "content_brief";
  }
}

export async function generateCharacterBible(
  input: GenerateInput,
): Promise<CharacterBibleData> {
  const MAX_RETRIES = 2;
  const taskType = await resolveTaskType();
  const userPrompt = buildPrompt(input);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callAI(SYSTEM_PROMPT, userPrompt, 6144, taskType);
      const cleaned = stripMarkdownFences(result.text);
      const parsed = JSON.parse(cleaned) as CharacterBibleData;

      // Validate key fields
      if (!parsed.coreValues || parsed.coreValues.length === 0) {
        throw new Error("AI trả JSON thiếu coreValues");
      }
      if (!parsed.catchphrases || parsed.catchphrases.length === 0) {
        throw new Error("AI trả JSON thiếu catchphrases");
      }

      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `[generateCharacterBible] Lần thử ${attempt}/${MAX_RETRIES} thất bại:`,
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
