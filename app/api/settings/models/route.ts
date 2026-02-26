import { NextRequest, NextResponse } from "next/server";
import { type ProviderName, PROVIDER_NAMES, getApiKey } from "@/lib/ai/providers";

// ─── Types ───

export interface ClassifiedModel {
  id: string;
  name: string;
  tier: "fast" | "balanced" | "powerful";
  tierLabel: string;
  provider: ProviderName;
}

// ─── Provider API fetchers ───

async function fetchAnthropicModels(apiKey: string): Promise<unknown[]> {
  const res = await fetch("https://api.anthropic.com/v1/models?limit=100", {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const data = (await res.json()) as { data?: unknown[] };
  return data.data ?? [];
}

async function fetchOpenAIModels(apiKey: string): Promise<unknown[]> {
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`OpenAI API ${res.status}`);
  const data = (await res.json()) as { data?: unknown[] };
  return data.data ?? [];
}

async function fetchGoogleModels(apiKey: string): Promise<unknown[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
  );
  if (!res.ok) throw new Error(`Google API ${res.status}`);
  const data = (await res.json()) as { models?: unknown[] };
  return data.models ?? [];
}

// ─── Tier classification ───

interface RawModel {
  id?: string;
  name?: string;
  created_at?: string;
  created?: number;
  display_name?: string;
}

const TIER_LABELS: Record<string, string> = {
  fast: "Nhanh",
  balanced: "Cân bằng",
  powerful: "Mạnh",
};

function classifyAnthropic(rawModels: unknown[]): ClassifiedModel[] {
  const models = rawModels as RawModel[];
  const tiers: Record<string, { tier: "fast" | "balanced" | "powerful" }> = {
    haiku: { tier: "fast" },
    sonnet: { tier: "balanced" },
    opus: { tier: "powerful" },
  };

  const result: ClassifiedModel[] = [];

  for (const [keyword, info] of Object.entries(tiers)) {
    const matched = models
      .filter((m) => m.id?.includes(keyword))
      .sort((a, b) => {
        const da = a.created_at ?? "";
        const db = b.created_at ?? "";
        return db.localeCompare(da);
      });

    if (matched.length > 0) {
      const best = matched[0];
      result.push({
        id: best.id!,
        name: formatAnthropicName(best.id!),
        tier: info.tier,
        tierLabel: TIER_LABELS[info.tier],
        provider: "anthropic",
      });
    }
  }

  return result;
}

function classifyOpenAI(rawModels: unknown[]): ClassifiedModel[] {
  const models = (rawModels as RawModel[]).filter(
    (m) =>
      m.id?.startsWith("gpt-4") ||
      m.id?.startsWith("gpt-3") ||
      m.id?.startsWith("o1") ||
      m.id?.startsWith("o3") ||
      m.id?.startsWith("o4")
  );

  const fast = models
    .filter((m) => m.id?.includes("mini") || m.id?.includes("nano"))
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0));

  const powerful = models
    .filter(
      (m) =>
        (m.id?.startsWith("o1") ||
          m.id?.startsWith("o3") ||
          m.id?.startsWith("o4") ||
          m.id?.includes("4.5")) &&
        !m.id?.includes("mini")
    )
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0));

  const balanced = models
    .filter(
      (m) =>
        !m.id?.includes("mini") &&
        !m.id?.includes("nano") &&
        !m.id?.startsWith("o1") &&
        !m.id?.startsWith("o3") &&
        !m.id?.startsWith("o4") &&
        !m.id?.includes("4.5")
    )
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0));

  const result: ClassifiedModel[] = [];
  if (fast[0]?.id) result.push(makeModel(fast[0].id, "fast", "openai"));
  if (balanced[0]?.id) result.push(makeModel(balanced[0].id, "balanced", "openai"));
  if (powerful[0]?.id) result.push(makeModel(powerful[0].id, "powerful", "openai"));
  return result;
}

function classifyGoogle(rawModels: unknown[]): ClassifiedModel[] {
  const models = (rawModels as RawModel[]).filter(
    (m) => (m.name ?? "").includes("gemini")
  );

  const normalized = models.map((m) => ({
    ...m,
    id: (m.name ?? "").replace("models/", ""),
  }));

  // Only keep generateContent-capable models (not embedding/vision-only)
  const genModels = normalized.filter(
    (m) => !m.id.includes("embedding") && !m.id.includes("aqa")
  );

  const fast = genModels
    .filter((m) => m.id.includes("flash-lite") || m.id.includes("flash-8b"))
    .sort((a, b) => versionSort(b.id, a.id));

  const balanced = genModels
    .filter(
      (m) =>
        m.id.includes("flash") &&
        !m.id.includes("lite") &&
        !m.id.includes("8b")
    )
    .sort((a, b) => versionSort(b.id, a.id));

  const powerful = genModels
    .filter((m) => m.id.includes("pro"))
    .sort((a, b) => versionSort(b.id, a.id));

  const result: ClassifiedModel[] = [];
  if (fast[0]?.id) result.push(makeModel(fast[0].id, "fast", "google"));
  if (balanced[0]?.id) result.push(makeModel(balanced[0].id, "balanced", "google"));
  if (powerful[0]?.id) result.push(makeModel(powerful[0].id, "powerful", "google"));
  return result;
}

// ─── Helpers ───

function makeModel(
  id: string,
  tier: "fast" | "balanced" | "powerful",
  provider: ProviderName
): ClassifiedModel {
  return {
    id,
    name: formatModelName(id, provider),
    tier,
    tierLabel: TIER_LABELS[tier],
    provider,
  };
}

function formatAnthropicName(id: string): string {
  // claude-haiku-4-5-20251001 → "Claude Haiku 4.5"
  // claude-sonnet-4-6 → "Claude Sonnet 4.6"
  const match = id.match(/claude-(\w+)-(\d+)-(\d+)/);
  if (match) {
    const tier = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    return `Claude ${tier} ${match[2]}.${match[3]}`;
  }
  return id;
}

function formatModelName(id: string, provider: ProviderName): string {
  if (provider === "anthropic") return formatAnthropicName(id);

  if (provider === "openai") {
    return id
      .replace("gpt-", "GPT-")
      .replace("-mini", " Mini")
      .replace("-nano", " Nano");
  }

  if (provider === "google") {
    return id
      .replace("gemini-", "Gemini ")
      .replace("-pro", " Pro")
      .replace("-flash-lite", " Flash Lite")
      .replace("-flash", " Flash");
  }

  return id;
}

function versionSort(a: string, b: string): number {
  // Extract version numbers for comparison: gemini-3.1-pro > gemini-2.5-pro
  const va = a.match(/(\d+)\.(\d+)/);
  const vb = b.match(/(\d+)\.(\d+)/);
  if (va && vb) {
    const diff = Number(va[1]) * 100 + Number(va[2]) - (Number(vb[1]) * 100 + Number(vb[2]));
    if (diff !== 0) return diff;
  }
  return a.localeCompare(b);
}

// ─── Fallback models ───

function getFallbackModels(provider: ProviderName): ClassifiedModel[] {
  const fallbacks: Record<ProviderName, ClassifiedModel[]> = {
    anthropic: [
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", tier: "fast", tierLabel: "Nhanh", provider: "anthropic" },
      { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", tier: "balanced", tierLabel: "Cân bằng", provider: "anthropic" },
      { id: "claude-opus-4-6", name: "Claude Opus 4.6", tier: "powerful", tierLabel: "Mạnh", provider: "anthropic" },
    ],
    openai: [
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", tier: "fast", tierLabel: "Nhanh", provider: "openai" },
      { id: "gpt-4.1", name: "GPT-4.1", tier: "balanced", tierLabel: "Cân bằng", provider: "openai" },
      { id: "o3", name: "O3", tier: "powerful", tierLabel: "Mạnh", provider: "openai" },
    ],
    google: [
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tier: "fast", tierLabel: "Nhanh", provider: "google" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tier: "balanced", tierLabel: "Cân bằng", provider: "google" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tier: "powerful", tierLabel: "Mạnh", provider: "google" },
    ],
  };
  return fallbacks[provider] ?? [];
}

// ─── Route handler ───

export async function GET(req: NextRequest): Promise<NextResponse> {
  const provider = req.nextUrl.searchParams.get("provider") as ProviderName | null;

  if (!provider || !PROVIDER_NAMES.includes(provider)) {
    return NextResponse.json(
      { error: "Provider không hợp lệ" },
      { status: 400 }
    );
  }

  const apiKey = await getApiKey(provider);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Chưa kết nối provider này" },
      { status: 400 }
    );
  }

  try {
    let rawModels: unknown[];

    if (provider === "anthropic") {
      rawModels = await fetchAnthropicModels(apiKey);
    } else if (provider === "openai") {
      rawModels = await fetchOpenAIModels(apiKey);
    } else {
      rawModels = await fetchGoogleModels(apiKey);
    }

    let classified: ClassifiedModel[];
    if (provider === "anthropic") {
      classified = classifyAnthropic(rawModels);
    } else if (provider === "openai") {
      classified = classifyOpenAI(rawModels);
    } else {
      classified = classifyGoogle(rawModels);
    }

    // Fallback if classification returned empty
    if (classified.length === 0) {
      classified = getFallbackModels(provider);
    }

    return NextResponse.json(
      { models: classified, fallback: false },
      { headers: { "Cache-Control": "public, max-age=86400" } }
    );
  } catch {
    // API fetch failed → return fallback
    const fallback = getFallbackModels(provider);
    return NextResponse.json({ models: fallback, fallback: true });
  }
}
