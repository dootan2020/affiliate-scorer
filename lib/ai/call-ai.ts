import { callClaude, type AiTaskType, getModelForTask } from "@/lib/ai/claude";
import { callOpenAI } from "@/lib/ai/call-openai";
import { callGemini } from "@/lib/ai/call-gemini";
import { getProviderFromModelId, getApiKey } from "@/lib/ai/providers";

/**
 * Multi-provider AI caller.
 * Same signature as callClaude — drop-in replacement.
 * Determines provider from the configured model, gets the right API key,
 * and routes to the appropriate caller.
 */
export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  taskType?: AiTaskType
): Promise<string> {
  const modelId = await getModelForTask(taskType);
  const provider = getProviderFromModelId(modelId);
  const apiKey = await getApiKey(provider);

  if (!apiKey) {
    throw new Error(
      `Chưa cấu hình API key cho ${provider}. Vào Settings → API Keys để kết nối.`
    );
  }

  switch (provider) {
    case "anthropic":
      return callClaude(systemPrompt, userPrompt, maxTokens, taskType, apiKey);
    case "openai":
      return callOpenAI(apiKey, modelId, systemPrompt, userPrompt, maxTokens);
    case "google":
      return callGemini(apiKey, modelId, systemPrompt, userPrompt, maxTokens);
    default:
      throw new Error(`Provider không được hỗ trợ: ${provider}`);
  }
}

// Re-export for convenience
export type { AiTaskType } from "@/lib/ai/claude";
export { MAX_TOKENS_SCORING, MAX_TOKENS_LEARNING } from "@/lib/ai/claude";
