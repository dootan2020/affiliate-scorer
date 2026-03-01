// Generate Idea Matrix by crossing 7 bible layers × active format templates
// Single AI call → returns array of ideas with hook suggestions

import { callAI } from "@/lib/ai/call-ai";
import type { AiTaskType } from "@/lib/ai/claude";
import { getModelForTask } from "@/lib/ai/claude";
import type { CharacterBibleData, BibleLayerKey } from "./character-bible-types";
import { BIBLE_LAYER_LABELS } from "./character-bible-types";
import type { IdeaMatrixItemData } from "./idea-matrix-types";

interface FormatInfo {
  slug: string;
  name: string;
  description: string | null;
}

const SYSTEM_PROMPT = `Bạn là chuyên gia content strategy cho TikTok affiliate Việt Nam.
Output luôn là JSON hợp lệ, không có markdown code fences, không giải thích thêm.`;

/** Extract key details from each bible layer for the matrix */
function extractLayerDetails(bible: CharacterBibleData): Array<{ layer: BibleLayerKey; detail: string }> {
  const details: Array<{ layer: BibleLayerKey; detail: string }> = [];

  // Core beliefs
  for (const v of bible.coreValues || []) {
    details.push({ layer: "core_beliefs", detail: v });
  }

  // Relationships
  for (const r of bible.relationships || []) {
    details.push({ layer: "relationships", detail: `${r.name} (${r.role})` });
  }

  // World rules
  for (const w of bible.worldRules || []) {
    details.push({ layer: "world_rules", detail: w.rule });
  }

  // Origin
  if (bible.originWound) details.push({ layer: "origin", detail: `Wound: ${bible.originWound}` });
  if (bible.originVow) details.push({ layer: "origin", detail: `Vow: ${bible.originVow}` });

  // Living spaces
  for (const s of bible.livingSpaces || []) {
    details.push({ layer: "living_spaces", detail: s.name });
  }

  // Story arcs
  for (const a of bible.storyArcs || []) {
    details.push({ layer: "story_arcs", detail: `Ch${a.chapter}: ${a.title}` });
  }

  // Language
  for (const c of bible.catchphrases?.slice(0, 3) || []) {
    details.push({ layer: "language", detail: `Catchphrase: "${c}"` });
  }

  return details;
}

function buildPrompt(
  layerDetails: Array<{ layer: BibleLayerKey; detail: string }>,
  formats: FormatInfo[],
  personaName: string,
): string {
  const layerLines = layerDetails.map((d) =>
    `- [${BIBLE_LAYER_LABELS[d.layer]}] ${d.detail}`
  ).join("\n");

  const formatLines = formats.map((f) =>
    `- ${f.slug}: ${f.name}${f.description ? ` — ${f.description}` : ""}`
  ).join("\n");

  return `Persona: ${personaName}

CHARACTER BIBLE ELEMENTS:
${layerLines}

AVAILABLE FORMATS:
${formatLines}

Tạo ý tưởng content bằng cách cross bible elements × formats.
Mỗi ý tưởng kết hợp 1 element từ bible + 1 format.
Tạo ${Math.min(layerDetails.length * formats.length, 30)} ý tưởng (tối đa 30).

Trả về JSON array:
[
  {
    "bibleLayer": "core_beliefs|relationships|world_rules|origin|living_spaces|story_arcs|language",
    "layerDetail": "chi tiết element từ bible",
    "formatSlug": "slug format",
    "ideaTitle": "tiêu đề ý tưởng ngắn gọn",
    "hookSuggestions": ["hook 1", "hook 2"],
    "angle": "góc tiếp cận",
    "notes": "ghi chú thêm"
  }
]

QUY TẮC:
- Ý tưởng phải khả thi, cụ thể, có thể quay/render ngay
- Hook suggestions phải viral-ready, ≤15 từ
- Đa dạng: không lặp format, không lặp angle
- Tiếng Việt tự nhiên
- CHỈ trả về JSON array`.trim();
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
    await getModelForTask("idea_matrix" as AiTaskType);
    return "idea_matrix" as AiTaskType;
  } catch {
    return "content_brief";
  }
}

export async function generateIdeaMatrix(
  bible: CharacterBibleData,
  formats: FormatInfo[],
  personaName: string,
): Promise<IdeaMatrixItemData[]> {
  const layerDetails = extractLayerDetails(bible);
  if (layerDetails.length === 0) throw new Error("Character Bible trống — không có element nào để tạo ý tưởng");
  if (formats.length === 0) throw new Error("Chưa có format template — tạo hoặc seed format trước");

  const taskType = await resolveTaskType();
  const userPrompt = buildPrompt(layerDetails, formats, personaName);

  const MAX_RETRIES = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callAI(SYSTEM_PROMPT, userPrompt, 6144, taskType);
      const cleaned = stripMarkdownFences(result.text);
      const parsed = JSON.parse(cleaned) as IdeaMatrixItemData[];

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("AI trả kết quả không phải array hoặc rỗng");
      }

      // Ensure all items have required fields + default status
      return parsed.map((item) => ({
        ...item,
        status: "fresh" as const,
        hookSuggestions: item.hookSuggestions || [],
        angle: item.angle || "",
        notes: item.notes || "",
      }));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[generateIdeaMatrix] Lần thử ${attempt}/${MAX_RETRIES} thất bại:`, lastError.message);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw new Error(`AI trả kết quả không hợp lệ sau ${MAX_RETRIES} lần thử. ${lastError?.message ?? ""}`);
}
