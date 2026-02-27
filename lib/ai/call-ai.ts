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
): Promise<{ text: string; modelUsed: string }> {
  const modelId = await getModelForTask(taskType);
  const provider = getProviderFromModelId(modelId);
  const apiKey = await getApiKey(provider);

  if (!apiKey) {
    throw new Error(
      `Chưa cấu hình API key cho ${provider}. Vào Settings → API Keys để kết nối.`
    );
  }

  let text: string;
  switch (provider) {
    case "anthropic":
      text = await callClaude(systemPrompt, userPrompt, maxTokens, taskType, apiKey);
      break;
    case "openai":
      text = await callOpenAI(apiKey, modelId, systemPrompt, userPrompt, maxTokens);
      break;
    case "google":
      text = await callGemini(apiKey, modelId, systemPrompt, userPrompt, maxTokens);
      break;
    default:
      throw new Error(`Provider không được hỗ trợ: ${provider}`);
  }

  return { text, modelUsed: modelId };
}

// Re-export for convenience
export type { AiTaskType } from "@/lib/ai/claude";
export { MAX_TOKENS_SCORING, MAX_TOKENS_LEARNING } from "@/lib/ai/claude";
