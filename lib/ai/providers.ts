import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

export type ProviderName = "anthropic" | "openai" | "google";

interface ProviderConfig {
  label: string;
  consoleUrl: string;
}

export const PROVIDER_CONFIGS: Record<ProviderName, ProviderConfig> = {
  anthropic: {
    label: "Anthropic (Claude)",
    consoleUrl: "https://console.anthropic.com/settings/keys",
  },
  openai: {
    label: "OpenAI (GPT)",
    consoleUrl: "https://platform.openai.com/api-keys",
  },
  google: {
    label: "Google (Gemini)",
    consoleUrl: "https://aistudio.google.com/apikey",
  },
};

export const PROVIDER_NAMES: ProviderName[] = ["anthropic", "openai", "google"];

/** Model ID → friendly name mapping */
export const MODEL_FRIENDLY_NAMES: Record<string, { name: string; description: string }> = {
  "claude-haiku-4-5-20251001": { name: "Claude Haiku 4.5", description: "Nhanh, tiết kiệm" },
  "claude-sonnet-4-6": { name: "Claude Sonnet 4.6", description: "Cân bằng chất lượng/giá" },
  "claude-opus-4-6": { name: "Claude Opus 4.6", description: "Mạnh nhất, sáng tạo" },
  "gpt-4o": { name: "GPT-4o", description: "Mạnh, đa năng" },
  "gpt-4o-mini": { name: "GPT-4o-mini", description: "Nhanh, rẻ" },
  "gemini-2.0-flash": { name: "Gemini 2.0 Flash", description: "Nhanh" },
  "gemini-2.5-pro": { name: "Gemini 2.5 Pro", description: "Mạnh" },
};

/** Detect provider from model ID */
export function getProviderFromModelId(modelId: string): ProviderName {
  if (modelId.startsWith("claude")) return "anthropic";
  if (modelId.startsWith("gpt")) return "openai";
  if (modelId.startsWith("gemini")) return "google";
  return "anthropic"; // fallback
}

/** Get API key for a provider from DB (encrypted) */
export async function getApiKey(provider: ProviderName): Promise<string | null> {
  try {
    const record = await prisma.apiProvider.findUnique({
      where: { provider },
    });
    if (record?.encryptedKey && record.isConnected) {
      return decrypt(record.encryptedKey);
    }
  } catch {
    // DB or decrypt error — return null
  }

  return null;
}

/** Get masked version of an API key (last 4 chars) */
export function maskKey(key: string): string {
  if (key.length <= 8) return "••••";
  return "••••••••" + key.slice(-4);
}
