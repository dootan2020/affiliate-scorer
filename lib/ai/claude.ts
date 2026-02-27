import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";

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

function getClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

export async function getModelForTask(taskType: AiTaskType): Promise<string> {
  const config = await prisma.aiModelConfig.findUnique({
    where: { taskType },
  });
  if (!config?.modelId) {
    throw new Error(
      `Chưa cấu hình AI model cho task "${taskType}". Vào Settings → AI Models để chọn model.`
    );
  }
  return config.modelId;
}

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  taskType: AiTaskType,
  apiKey?: string
): Promise<string> {
  if (!apiKey) {
    throw new Error("Chưa cấu hình API key cho Anthropic. Vào Settings → API Keys để kết nối.");
  }
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
