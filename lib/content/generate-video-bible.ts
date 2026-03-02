// AI-powered Video Bible generation from Character Bible + channel info

import { callAI } from "@/lib/ai/call-ai";
import type { AiTaskType } from "@/lib/ai/claude";
import { getModelForTask } from "@/lib/ai/claude";
import type { VideoBibleData } from "./video-bible-types";
import type { CharacterBibleData } from "./character-bible-types";

interface GenerateInput {
  personaName: string;
  voiceStyle: string;
  niche: string;
  editingStyle: string | null;
  productionStyle: string | null;
  characterBible: CharacterBibleData | null;
}

const SYSTEM_PROMPT = `Bạn là chuyên gia video production cho TikTok Việt Nam.
Bạn hiểu sâu về framing, lighting, âm thanh, narrative structure cho short-form video.
Output luôn là JSON hợp lệ, không có markdown code fences, không giải thích thêm.`;

function buildPrompt(input: GenerateInput): string {
  const bibleContext = input.characterBible
    ? `\nCHARACTER BIBLE:
- Core beliefs: ${(input.characterBible.coreValues || []).join(", ")}
- Catchphrases: ${(input.characterBible.catchphrases || []).slice(0, 5).join(", ")}
- Origin symbol: ${input.characterBible.originSymbol || "N/A"}
- Rituals: ${(input.characterBible.rituals || []).join(", ")}
- Visual locks: ${JSON.stringify(input.characterBible.visualLocks || {})}
- Voice DNA: ${JSON.stringify(input.characterBible.voiceDna || {})}`
    : "";

  return `Tạo Video Bible (12 locks) cho kênh TikTok:

THÔNG TIN KÊNH:
- Persona: ${input.personaName}
- Niche: ${input.niche}
- Voice style: ${input.voiceStyle}
- Editing: ${input.editingStyle || "chưa rõ"}
- Production: ${input.productionStyle || "hybrid"}
${bibleContext}

Trả về JSON:
{
  "framing": "cách đặt khung hình chính (VD: medium shot, eye-level, rule of thirds)",
  "lighting": "setup ánh sáng chuẩn (VD: soft key light, warm tone 3500K)",
  "composition": "bố cục hình ảnh (VD: clean background, product zone right 1/3)",
  "palette": "bảng màu video (VD: warm neutrals, accent coral)",
  "editRhythm": "nhịp edit (VD: cut mỗi 3-5s, zoom nhẹ khi nhấn mạnh)",
  "voiceStyleLock": "giọng nói chuẩn cho video (VD: energetic nhưng không la, pace 150 từ/phút)",
  "sfxPack": ["3-5 SFX thường dùng (VD: pop, whoosh, ding)"],
  "bgmMoods": ["3-4 mood nhạc nền (VD: upbeat lo-fi, chill acoustic)"],
  "roomTone": "âm thanh môi trường chuẩn (VD: quiet studio, slight room reverb)",
  "openingRitual": "ritual mở đầu mỗi video (VD: chào + catchphrase + flash product)",
  "proofTokenRule": "quy tắc proof (VD: mỗi video phải có ít nhất 1 test/so sánh thực tế)",
  "closingRitual": "ritual kết thúc (VD: đóng dấu PASS/FAIL + CTA keyword)"
}

QUY TẮC:
- Phù hợp TikTok VN, quay bằng điện thoại
- Nhất quán với Character Bible nếu có
- Thực tế, áp dụng được ngay
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
    await getModelForTask("video_bible" as AiTaskType);
    return "video_bible" as AiTaskType;
  } catch {
    return "content_brief";
  }
}

export async function generateVideoBible(input: GenerateInput): Promise<VideoBibleData> {
  const taskType = await resolveTaskType();
  const userPrompt = buildPrompt(input);
  const MAX_RETRIES = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callAI(SYSTEM_PROMPT, userPrompt, 4096, taskType);
      const cleaned = stripMarkdownFences(result.text);
      const parsed = JSON.parse(cleaned) as VideoBibleData;

      if (!parsed.framing && !parsed.openingRitual) {
        throw new Error("AI trả JSON thiếu locks cơ bản");
      }
      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[generateVideoBible] Attempt ${attempt}/${MAX_RETRIES} failed:`, lastError.message);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw new Error(`AI trả kết quả không hợp lệ sau ${MAX_RETRIES} lần thử. ${lastError?.message ?? ""}`);
}
