import { callAI } from "@/lib/ai/call-ai";
import type { AiTaskType } from "@/lib/ai/claude";
import { getModelForTask } from "@/lib/ai/claude";
import type {
  TacticalRefreshResult,
  TacticalRefreshInput,
  ChannelPerformanceData,
} from "./tactical-refresh-types";

/** Tactical fields that AI can suggest changes to (NEVER identity) */
const TACTICAL_FIELDS = [
  "hookBank",
  "contentMix",
  "contentPillars",
  "contentPillarDetails",
  "postingSchedule",
  "postsPerDay",
  "seriesSchedule",
  "videoFormats",
  "ctaTemplates",
  "competitorChannels",
  "editingStyle",
] as const;

const FIELD_LABELS: Record<string, string> = {
  hookBank: "Hook Bank",
  contentMix: "Content Mix",
  contentPillars: "Content Pillars",
  contentPillarDetails: "Chi tiet Content Pillars",
  postingSchedule: "Lich dang",
  postsPerDay: "So post/ngay",
  seriesSchedule: "Series Schedule",
  videoFormats: "Video Formats",
  ctaTemplates: "CTA Templates",
  competitorChannels: "Kenh tham khao",
  editingStyle: "Editing Style",
};

const SYSTEM_PROMPT = `Ban la chuyen gia xay kenh TikTok trieu followers tai Viet Nam.
Ban phan tich trending, data performance, va tactics hien tai de de xuat thay doi cac yeu to chien luoc.
KHONG BAO GIO de xuat thay doi identity: name, handle, persona, subNiche, usp, targetAudience, voiceStyle, colors, fonts.
CHI de xuat thay doi tactical fields: ${TACTICAL_FIELDS.join(", ")}.
Output luon la JSON hop le, khong co markdown code fences, khong giai thich them.`;

function buildPrompt(
  channel: Record<string, unknown>,
  input: TacticalRefreshInput,
  performanceData?: ChannelPerformanceData,
): string {
  // Extract only tactical fields from channel
  const currentTactics: Record<string, unknown> = {};
  for (const field of TACTICAL_FIELDS) {
    if (channel[field] !== undefined && channel[field] !== null) {
      currentTactics[field] = channel[field];
    }
  }

  let prompt = `=== TACTICS HIEN TAI CUA KENH ===
${JSON.stringify(currentTactics, null, 2)}

=== TRENDING CONTEXT TU USER ===
${input.trendingContext || "(Khong co — chi dua tren tracking data)"}
`;

  if (performanceData && performanceData.totalVideos > 0) {
    prompt += `
=== PERFORMANCE DATA (${performanceData.totalVideos} videos tracked) ===

Top Hook Types (theo avg views):
${performanceData.topHookTypes.map((h) => `- ${h.hookType}: avg ${h.avgViews} views (${h.count} videos)`).join("\n") || "Chua du data"}

Format Performance:
${performanceData.formatPerformance.map((f) => `- ${f.format}: avg ${f.avgViews} views (${f.count} videos)`).join("\n") || "Chua du data"}

Best Publish Times:
${performanceData.bestPublishTimes.slice(0, 5).map((t) => `- ${t.hour}h: avg ${t.avgViews} views`).join("\n") || "Chua du data"}
`;
  }

  prompt += `
=== YEU CAU ===
Phan tich va tra ve JSON voi cau truc:
{
  "suggestions": [
    {
      "field": "ten field (1 trong: ${TACTICAL_FIELDS.join(", ")})",
      "label": "Ten hien thi tieng Viet",
      "action": "add | remove | replace | adjust",
      "current": <gia tri hien tai>,
      "suggested": <gia tri de xuat>,
      "reason": "Ly do AI de xuat (tieng Viet, ngan gon)"
    }
  ],
  "analysisNotes": "Tom tat phan tich tong the (tieng Viet, 2-3 cau)"
}

Quy tac:
- Chi suggest thay doi co ly do ro rang dua tren trending hoac data
- "field" phai la 1 trong: ${TACTICAL_FIELDS.join(", ")}
- "label" dung mapping: ${JSON.stringify(FIELD_LABELS)}
- "current" la gia tri hien tai tu channel (null neu chua co)
- "suggested" la gia tri moi — PHAI cung type voi "current"
- Moi suggestion doc lap, user chon tung cai
- Toi da 8 suggestions, chi nhung thay doi co gia tri
- CHI tra ve JSON, khong text khac`;

  return prompt.trim();
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
    await getModelForTask("channel_profile");
    return "channel_profile";
  } catch {
    return "content_brief";
  }
}

export async function generateTacticalRefresh(
  channel: Record<string, unknown>,
  input: TacticalRefreshInput,
  performanceData?: ChannelPerformanceData,
): Promise<TacticalRefreshResult> {
  const MAX_RETRIES = 2;
  const taskType = await resolveTaskType();
  const userPrompt = buildPrompt(channel, input, performanceData);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callAI(SYSTEM_PROMPT, userPrompt, 6144, taskType);
      const cleaned = stripMarkdownFences(result.text);
      const parsed = JSON.parse(cleaned) as TacticalRefreshResult;

      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        throw new Error("AI tra JSON thieu truong suggestions");
      }

      // Validate each suggestion has required fields
      for (const s of parsed.suggestions) {
        if (!s.field || !s.action || !s.reason) {
          throw new Error("Suggestion thieu field/action/reason");
        }
        // Ensure field is a valid tactical field
        if (!TACTICAL_FIELDS.includes(s.field as typeof TACTICAL_FIELDS[number])) {
          throw new Error(`Field "${s.field}" khong phai tactical field`);
        }
      }

      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `[generateTacticalRefresh] Lan thu ${attempt}/${MAX_RETRIES} that bai:`,
        lastError.message,
      );
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw new Error(
    `AI tra ket qua khong hop le sau ${MAX_RETRIES} lan thu. ${lastError?.message ?? ""}`,
  );
}
