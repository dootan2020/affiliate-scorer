import { NextResponse } from "next/server";
import {
  PROVIDER_NAMES,
  PROVIDER_CONFIGS,
  MODEL_FRIENDLY_NAMES,
  type ProviderName,
  getApiKey,
} from "@/lib/ai/providers";

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  provider: ProviderName;
}

/** Known models per provider — fallback when API fetch fails */
const KNOWN_MODELS: Record<ProviderName, string[]> = {
  anthropic: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "claude-opus-4-6"],
  openai: ["gpt-4o", "gpt-4o-mini"],
  google: ["gemini-2.0-flash", "gemini-2.5-pro"],
};

function toModelInfo(modelId: string, provider: ProviderName): ModelInfo {
  const friendly = MODEL_FRIENDLY_NAMES[modelId];
  return {
    id: modelId,
    name: friendly?.name ?? modelId,
    description: friendly?.description ?? "",
    provider,
  };
}

export async function GET(): Promise<NextResponse> {
  try {
    const models: ModelInfo[] = [];

    for (const provider of PROVIDER_NAMES) {
      const key = await getApiKey(provider);
      if (!key) continue; // not connected → skip

      // Use known models list (faster + reliable)
      for (const modelId of KNOWN_MODELS[provider]) {
        models.push(toModelInfo(modelId, provider));
      }
    }

    return NextResponse.json({ models });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi" },
      { status: 500 }
    );
  }
}
