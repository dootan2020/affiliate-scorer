const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call Google Gemini generateContent API.
 * Returns the text content from the response.
 */
export async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  let lastError: Error | null = null;
  // Fix F11: Move API key from URL query to header (avoids logging in server access logs)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: maxTokens },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.error?.message ?? `HTTP ${res.status}`;
        const isRetryable = res.status === 429 || res.status >= 500;
        if (!isRetryable || attempt === MAX_RETRIES - 1) {
          throw new Error(`Gemini API error: ${msg}`);
        }
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
        continue;
      }

      const data = (await res.json()) as {
        candidates: Array<{
          content: { parts: Array<{ text: string }> };
        }>;
      };

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Không nhận được phản hồi từ Gemini API");
      }
      return text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES - 1) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
      }
    }
  }

  throw lastError ?? new Error("Lỗi không xác định khi gọi Gemini API");
}
