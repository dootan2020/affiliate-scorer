// Shared Gemini image generation helper — used by chunked relay and regenerate endpoints

const MODEL = "gemini-3-pro-image-preview";

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  error?: { message: string };
}

export interface GenerateResult {
  imageBase64: string | null;
  error: string | null;
  durationMs: number;
}

export async function generateGeminiImage(
  apiKey: string,
  prompt: string,
  referenceBase64?: string,
): Promise<GenerateResult> {
  const start = Date.now();

  const parts: Array<Record<string, unknown>> = [];
  if (referenceBase64) {
    parts.push({ inlineData: { mimeType: "image/png", data: referenceBase64 } });
  }
  parts.push({ text: prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      temperature: 1.0,
    },
  };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as GeminiResponse;
    if (!res.ok || json.error) {
      return { imageBase64: null, error: json.error?.message ?? `HTTP ${res.status}`, durationMs: Date.now() - start };
    }

    const candidate = json.candidates?.[0];
    if (!candidate?.content?.parts) {
      return { imageBase64: null, error: `No parts. finishReason=${candidate?.finishReason}`, durationMs: Date.now() - start };
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        return { imageBase64: part.inlineData.data, error: null, durationMs: Date.now() - start };
      }
    }

    const textParts = candidate.content.parts.filter(p => p.text).map(p => p.text).join("\n");
    return { imageBase64: null, error: `No image in response. Text: ${textParts.slice(0, 200)}`, durationMs: Date.now() - start };
  } catch (err) {
    return { imageBase64: null, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}
