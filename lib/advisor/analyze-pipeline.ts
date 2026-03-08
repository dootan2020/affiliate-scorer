// Advisory pipeline: ANALYST → [CMO, CFO, CTO parallel] → CEO
import { callAI } from "@/lib/ai/call-ai";
import { C_ROLES, C_LEVEL_IDS, type CRoleId } from "./c-level-roles";
import { gatherAdvisorData, formatDataBriefing } from "./gather-advisor-data";

const MAX_TOKENS_CLEVEL = 1024;
const MAX_TOKENS_CEO = 1200;

export interface CLevelResponse {
  roleId: CRoleId;
  name: string;
  title: string;
  content: string;
  modelUsed: string;
  error?: boolean;
}

export interface PipelineResult {
  ceoDecision: CLevelResponse;
  cLevelResponses: CLevelResponse[];
  analystBriefing: CLevelResponse;
  question: string;
  timestamp: string;
}

/**
 * Step 1: ANALYST gathers data and creates briefing
 */
async function runAnalyst(question: string): Promise<{
  response: CLevelResponse;
  dataBriefing: string;
}> {
  const role = C_ROLES.analyst;

  // Gather real data from DB
  let dataBriefing: string;
  try {
    const data = await gatherAdvisorData();
    dataBriefing = formatDataBriefing(data);
  } catch {
    dataBriefing = "⚠️ Không thể truy xuất data từ hệ thống. Phân tích dựa trên câu hỏi.";
  }

  const userPrompt = `${dataBriefing}\n\n---\nCÂU HỎI CẦN PHÂN TÍCH: ${question}`;

  try {
    const { text, modelUsed } = await callAI(
      role.systemPrompt,
      userPrompt,
      MAX_TOKENS_CLEVEL,
      "advisor",
    );
    return {
      response: {
        roleId: "analyst",
        name: role.name,
        title: role.title,
        content: text,
        modelUsed,
      },
      dataBriefing,
    };
  } catch (error) {
    return {
      response: {
        roleId: "analyst",
        name: role.name,
        title: role.title,
        content: `Lỗi: ${error instanceof Error ? error.message : "Không thể phân tích"}`,
        modelUsed: "error",
        error: true,
      },
      dataBriefing,
    };
  }
}

/**
 * Step 2: Run CMO, CFO, CTO in parallel with ANALYST's briefing
 */
async function runCLevels(
  question: string,
  analystContent: string,
  context?: string,
): Promise<CLevelResponse[]> {
  const contextPrefix = context
    ? `NGỮ CẢNH TRƯỚC ĐÓ:\n${context}\n\n---\n`
    : "";

  return Promise.all(
    C_LEVEL_IDS.map(async (roleId): Promise<CLevelResponse> => {
      const role = C_ROLES[roleId];
      const userPrompt = `${contextPrefix}BRIEFING TỪ ANALYST:\n${analystContent}\n\n---\nCÂU HỎI: ${question}`;

      try {
        const { text, modelUsed } = await callAI(
          role.systemPrompt,
          userPrompt,
          MAX_TOKENS_CLEVEL,
          "advisor",
        );
        return {
          roleId,
          name: role.name,
          title: role.title,
          content: text,
          modelUsed,
        };
      } catch (error) {
        return {
          roleId,
          name: role.name,
          title: role.title,
          content: `Lỗi: ${error instanceof Error ? error.message : "Không thể phân tích"}`,
          modelUsed: "error",
          error: true,
        };
      }
    }),
  );
}

/**
 * Step 3: CEO synthesizes all C-level responses
 */
async function runCEO(
  question: string,
  cLevelResponses: CLevelResponse[],
): Promise<CLevelResponse> {
  const role = C_ROLES.ceo;

  // Build synthesis prompt from successful C-level responses
  const inputs = cLevelResponses
    .filter((r) => !r.error)
    .map((r) => `[${r.name} — ${r.title}]:\n${r.content}`)
    .join("\n\n---\n\n");

  const failedRoles = cLevelResponses.filter((r) => r.error);
  const failureNote = failedRoles.length > 0
    ? `\n\n⚠️ Lưu ý: ${failedRoles.map((r) => r.name).join(", ")} không thể phân tích. Tổng hợp từ các nguồn còn lại.`
    : "";

  const userPrompt = `CÂU HỎI GỐC: ${question}\n\n---\nPHÂN TÍCH TỪ BAN LÃNH ĐẠO:\n\n${inputs}${failureNote}`;

  try {
    const { text, modelUsed } = await callAI(
      role.systemPrompt,
      userPrompt,
      MAX_TOKENS_CEO,
      "advisor",
    );
    return {
      roleId: "ceo",
      name: role.name,
      title: role.title,
      content: text,
      modelUsed,
    };
  } catch (error) {
    return {
      roleId: "ceo",
      name: role.name,
      title: role.title,
      content: `Lỗi: ${error instanceof Error ? error.message : "Không thể tổng hợp"}`,
      modelUsed: "error",
      error: true,
    };
  }
}

/**
 * Full pipeline: ANALYST → [CMO, CFO, CTO] → CEO
 */
export async function runAdvisorPipeline(
  question: string,
  context?: string,
): Promise<PipelineResult> {
  // Step 1: ANALYST
  const { response: analystResponse } = await runAnalyst(question);

  // Step 2: C-levels in parallel
  const cLevelResponses = await runCLevels(
    question,
    analystResponse.content,
    context,
  );

  // Step 3: CEO synthesis
  const ceoDecision = await runCEO(question, cLevelResponses);

  return {
    ceoDecision,
    cLevelResponses,
    analystBriefing: analystResponse,
    question,
    timestamp: new Date().toISOString(),
  };
}

/**
 * CEO-only review for Morning Brief integration.
 * Lighter weight — skips ANALYST data gathering, uses provided brief summary.
 */
export async function ceoBriefReview(briefSummary: string): Promise<string> {
  const role = C_ROLES.ceo;
  const systemPrompt = `${role.systemPrompt}\n\nĐẶC BIỆT: Bạn đang review Morning Brief. Chỉ cần trả lời 2-3 câu actionable. Không cần format đầy đủ.`;
  const userPrompt = `Đây là Morning Brief hôm nay:\n\n${briefSummary}\n\nBrief này có thực tế không? Bước đầu tiên cụ thể nhất là gì?`;

  try {
    const { text } = await callAI(systemPrompt, userPrompt, 512, "advisor");
    return text;
  } catch {
    return "Không thể review brief.";
  }
}
