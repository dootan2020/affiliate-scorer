// Advisory analysis engine — runs 4 personas in parallel
import { callAI } from "@/lib/ai/call-ai";
import { PERSONAS, PERSONA_IDS, type PersonaId } from "./personas";

export interface PersonaResponse {
  personaId: PersonaId;
  name: string;
  tagline: string;
  content: string;
  modelUsed: string;
}

export interface AnalysisResult {
  responses: PersonaResponse[];
  question: string;
  timestamp: string;
}

const MAX_TOKENS_ADVISOR = 1024;

/**
 * Run all 4 personas in parallel on a question.
 * Optionally pass subset of persona IDs.
 */
export async function analyzeWithPersonas(
  question: string,
  personaIds: PersonaId[] = PERSONA_IDS,
  context?: string,
): Promise<AnalysisResult> {
  const userPrompt = context
    ? `Ngữ cảnh trước đó:\n${context}\n\nCâu hỏi mới: ${question}`
    : question;

  const results = await Promise.all(
    personaIds.map(async (pid): Promise<PersonaResponse> => {
      const persona = PERSONAS[pid];
      try {
        const { text, modelUsed } = await callAI(
          persona.systemPrompt,
          userPrompt,
          MAX_TOKENS_ADVISOR,
          "advisor",
        );
        return {
          personaId: pid,
          name: persona.name,
          tagline: persona.tagline,
          content: text,
          modelUsed,
        };
      } catch (error) {
        return {
          personaId: pid,
          name: persona.name,
          tagline: persona.tagline,
          content: `Lỗi: ${error instanceof Error ? error.message : "Không thể phân tích"}`,
          modelUsed: "error",
        };
      }
    }),
  );

  return {
    responses: results,
    question,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Run only MUNGER + SOCRATES for morning brief critique.
 */
export async function critiqueBrief(briefSummary: string): Promise<{
  munger: string;
  socrates: string;
}> {
  const mungerPrompt = `Đây là Morning Brief hôm nay cho affiliate marketer TikTok:\n\n${briefSummary}\n\nHãy đánh giá: Brief này có thực tế không? Có thực hiện được trong 1 ngày không? Phần nào nên cắt bỏ? Giới hạn 150 từ.`;
  const socratesPrompt = `Đây là Morning Brief hôm nay cho affiliate marketer TikTok:\n\n${briefSummary}\n\nHãy phân tích: Assumption nào trong brief này có thể sai? Blind spot nào cần lưu ý? Giới hạn 150 từ.`;

  const [mungerResult, socratesResult] = await Promise.all([
    callAI(PERSONAS.munger.systemPrompt, mungerPrompt, 512, "advisor")
      .then((r) => r.text)
      .catch(() => "Không thể phân tích."),
    callAI(PERSONAS.socrates.systemPrompt, socratesPrompt, 512, "advisor")
      .then((r) => r.text)
      .catch(() => "Không thể phân tích."),
  ]);

  return { munger: mungerResult, socrates: socratesResult };
}
