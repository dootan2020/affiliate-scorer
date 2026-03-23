// POST crawled data in batches to PASTR /api/fastmoss/sync
import type { SyncPayload, CrawledProduct, Category, MarketOverview } from '../types.js';

const BATCH_SIZE = 100;

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [pastr-sync] ${message}`);
}

function getConfig(): { apiUrl: string; authSecret: string } {
  const apiUrl = process.env.PASTR_API_URL;
  const authSecret = process.env.PASTR_AUTH_SECRET;

  if (!apiUrl) throw new Error('PASTR_API_URL environment variable is required');
  if (!authSecret) throw new Error('PASTR_AUTH_SECRET environment variable is required');

  return { apiUrl, authSecret };
}

async function postBatch(
  apiUrl: string,
  authSecret: string,
  payload: SyncPayload
): Promise<void> {
  const url = `${apiUrl}/api/fastmoss/sync`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-secret': authSecret,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`PASTR sync failed: HTTP ${response.status} — ${body}`);
  }

  const result = (await response.json()) as { ok?: boolean; message?: string };
  if (result.ok === false) {
    throw new Error(`PASTR sync rejected: ${result.message ?? 'Unknown error'}`);
  }
}

export async function syncProducts(products: CrawledProduct[]): Promise<void> {
  const { apiUrl, authSecret } = getConfig();
  const total = products.length;
  const batches = Math.ceil(total / BATCH_SIZE);

  log(`Syncing ${total} products in ${batches} batch(es) to PASTR...`);

  for (let i = 0; i < batches; i++) {
    const start = i * BATCH_SIZE;
    const slice = products.slice(start, start + BATCH_SIZE);

    const payload: SyncPayload = {
      type: 'products',
      data: slice,
      crawled_at: new Date().toISOString(),
    };

    await postBatch(apiUrl, authSecret, payload);
    log(`Batch ${i + 1}/${batches} synced (${slice.length} products)`);
  }

  log(`Products sync complete.`);
}

export async function syncCategories(categories: Category[]): Promise<void> {
  const { apiUrl, authSecret } = getConfig();
  log(`Syncing ${categories.length} categories to PASTR...`);

  const payload: SyncPayload = {
    type: 'categories',
    data: categories,
    crawled_at: new Date().toISOString(),
  };

  await postBatch(apiUrl, authSecret, payload);
  log('Categories sync complete.');
}

export async function syncMarket(overview: MarketOverview): Promise<void> {
  const { apiUrl, authSecret } = getConfig();
  log('Syncing market overview to PASTR...');

  const payload: SyncPayload = {
    type: 'market',
    data: overview,
    crawled_at: new Date().toISOString(),
  };

  await postBatch(apiUrl, authSecret, payload);
  log('Market overview sync complete.');
}
