const RETRYABLE_STATUS = new Set([502, 503, 504]);
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;

/**
 * Fetch wrapper that retries on transient server errors (502/503/504).
 * Uses exponential backoff: 1s, 2s between retries.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(input, init);
      if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_RETRIES) {
        await delay(BASE_DELAY_MS * 2 ** attempt);
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await delay(BASE_DELAY_MS * 2 ** attempt);
        continue;
      }
    }
  }

  throw lastError;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
