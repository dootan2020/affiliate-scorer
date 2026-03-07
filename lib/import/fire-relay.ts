// Shared relay utility — fire-and-forget HTTP POST with retry.
// Used for import chunking and scoring relay chains.
// Retries 3× with exponential backoff (1s, 2s, 4s).

const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 2000, 4000];

function getBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!raw) return null;
  return raw.startsWith("http") ? raw : `https://${raw}`;
}

/**
 * Fire-and-forget relay with internal retries.
 * Returns a Promise but callers can choose to await or not.
 * IMPORTANT: When called from after(), MUST be awaited — Vercel freezes the
 * function once after() returns, killing dangling promises.
 * If all retries fail, logs error. Cron job (retry-scoring) provides safety net.
 */
export function fireRelay(
  path: string,
  body: Record<string, unknown>,
  label?: string,
): Promise<void> {
  const base = getBaseUrl();
  if (!base) {
    console.warn(`No base URL — ${label ?? path} relay skipped`);
    return Promise.resolve();
  }
  return attemptRelay(`${base}${path}`, body, 0, label ?? path);
}

async function attemptRelay(
  url: string,
  body: Record<string, unknown>,
  attempt: number,
  label: string,
): Promise<void> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    // Include auth secret so middleware allows server-to-server relay
    const secret = process.env.AUTH_SECRET;
    if (secret) {
      headers["x-auth-secret"] = secret;
    }
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (res.ok) return;
    if (res.status < 500) {
      console.warn(`${label} relay got ${res.status} — not retrying`);
      return;
    }
    throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    if (attempt < MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
      return attemptRelay(url, body, attempt + 1, label);
    }
    const error = new Error(`${label} relay failed after ${MAX_RETRIES} attempts: ${err instanceof Error ? err.message : String(err)}`);
    console.error(error.message);
    throw error;
  }
}
