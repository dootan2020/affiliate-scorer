import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export type AiTaskType =
  | "scoring"
  | "content_brief"
  | "morning_brief"
  | "weekly_report";

export const MAX_TOKENS_SCORING = 4096;
export const MAX_TOKENS_LEARNING = 8192;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getClient(explicitKey?: string): Anthropic {
  const apiKey = explicitKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "sk-ant-...") {
    throw new Error("Chưa cấu hình ANTHROPIC_API_KEY. Vào Settings → API Keys để kết nối.");
  }
  return new Anthropic({ apiKey });
}

export async function getModelForTask(taskType?: AiTaskType): Promise<string> {
  if (!taskType) return DEFAULT_MODEL;
  try {
    const config = await prisma.aiModelConfig.findUnique({
      where: { taskType },
    });
    return config?.modelId ?? DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  taskType?: AiTaskType,
  apiKey?: string
): Promise<string> {
  const client = getClient(apiKey);
  const model = await getModelForTask(taskType);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("Không nhận được phản hồi văn bản từ Claude API");
      }

      return textBlock.text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryable =
        error instanceof Anthropic.APIError &&
        (error.status === 429 || error.status >= 500);

      if (!isRetryable || attempt === MAX_RETRIES - 1) {
        break;
      }

      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError ?? new Error("Lỗi không xác định khi gọi Claude API");
}
