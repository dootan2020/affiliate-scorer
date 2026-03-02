// AI-powered episode generation from series premise + Character Bible + Format Bank

import { callAI } from "@/lib/ai/call-ai";
import type { AiTaskType } from "@/lib/ai/claude";
import { getModelForTask } from "@/lib/ai/claude";
import type { EpisodeData } from "./series-types";

interface GenerateInput {
  seriesName: string;
  seriesType: string;
  premise: string | null;
  personaName: string;
  niche: string;
  formatSlugs: string[];
  count: number;
  goalDistribution?: { awareness?: number; lead?: number; sale?: number };
}

const SYSTEM_PROMPT = `Bạn là chuyên gia content strategy cho TikTok affiliate Việt Nam.
Output luôn là JSON hợp lệ, không có markdown code fences, không giải thích thêm.`;

function buildPrompt(input: GenerateInput): string {
  const goalDist = input.goalDistribution || { awareness: 50, lead: 30, sale: 20 };
  const formatList = input.formatSlugs.length > 0
    ? input.formatSlugs.join(", ")
    : "review, myth-bust, a-vs-b, story, test";

  return `Tạo ${input.count} episodes cho series TikTok:

SERIES: ${input.seriesName}
Type: ${input.seriesType}
Premise: ${input.premise || "Chưa có premise cụ thể"}
Persona: ${input.personaName}
Niche: ${input.niche}

FORMATS CÓ SẴN: ${formatList}

PHÂN BỐ MỤC TIÊU:
- Awareness: ~${goalDist.awareness || 50}%
- Lead: ~${goalDist.lead || 30}%
- Sale: ~${goalDist.sale || 20}%

Trả về JSON array:
[
  {
    "episodeNumber": 1,
    "title": "tiêu đề tập ngắn gọn",
    "goal": "awareness|lead|sale",
    "formatSlug": "slug format phù hợp",
    "pillar": "core_beliefs|relationships|world_rules|origin|living_spaces|story_arcs|language",
    "notes": "ghi chú ngắn về nội dung"
  }
]

QUY TẮC:
- Mỗi episode có arc rõ ràng trong series
- Đa dạng format, không lặp liên tiếp
- Phân bố goal theo tỉ lệ yêu cầu
- Tiếng Việt tự nhiên
- CHỈ trả về JSON array`.trim();
}

function stripFences(text: string): string {
  let c = text.trim();
  if (c.startsWith("```")) c = c.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return c;
}

async function resolveTaskType(): Promise<AiTaskType> {
  try {
    await getModelForTask("episode_gen" as AiTaskType);
    return "episode_gen" as AiTaskType;
  } catch {
    return "content_brief";
  }
}

export async function generateEpisodes(input: GenerateInput): Promise<EpisodeData[]> {
  const taskType = await resolveTaskType();
  const userPrompt = buildPrompt(input);
  const MAX_RETRIES = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callAI(SYSTEM_PROMPT, userPrompt, 4096, taskType);
      const parsed = JSON.parse(stripFences(result.text)) as EpisodeData[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("AI trả kết quả không phải array hoặc rỗng");
      }
      return parsed.map((ep, i) => ({
        ...ep,
        episodeNumber: ep.episodeNumber || i + 1,
        status: "draft" as const,
      }));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[generateEpisodes] Attempt ${attempt}/${MAX_RETRIES}:`, lastError.message);
      if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  throw new Error(`AI không trả được episodes sau ${MAX_RETRIES} lần. ${lastError?.message ?? ""}`);
}
