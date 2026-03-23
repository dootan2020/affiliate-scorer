// FastMoss category tree crawler
import { apiGet } from './client.js';
import type { Category } from '../types.js';

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [category-crawler] ${message}`);
}

interface RawCategory {
  category_id?: number;
  id?: number;
  code?: number;
  category_name?: string;
  name?: string;
  parent_id?: number | null;
  parent_code?: number | null;
  level?: number;
  rank?: number;
  children?: RawCategory[];
  sub_list?: RawCategory[];
  [key: string]: unknown;
}

function flattenTree(
  items: RawCategory[],
  parentCode: number | null = null,
  level: number = 1
): Category[] {
  const result: Category[] = [];

  for (const item of items) {
    const code = Number(item.category_id ?? item.id ?? item.code ?? 0);
    const name = String(item.category_name ?? item.name ?? '');
    const rank = Number(item.rank ?? 0);

    result.push({
      code,
      name,
      parentCode,
      level,
      rank,
    });

    const children = item.children ?? item.sub_list;
    if (Array.isArray(children) && children.length > 0) {
      result.push(...flattenTree(children, code, level + 1));
    }
  }

  return result;
}

export async function crawlCategories(): Promise<Category[]> {
  log('Fetching category tree from /api/goods/filterInfo...');

  const json = await apiGet('/api/goods/filterInfo', {
    params: { region: 'VN' },
  });

  const data = json['data'] as Record<string, unknown> | undefined;
  if (!data) {
    log('No data in filterInfo response');
    return [];
  }

  // The category tree may be nested under different keys
  let rawCategories: RawCategory[] = [];

  const possibleKeys = ['category_list', 'categories', 'list', 'items', 'tree'];
  for (const key of possibleKeys) {
    const candidate = data[key];
    if (Array.isArray(candidate) && candidate.length > 0) {
      rawCategories = candidate as RawCategory[];
      log(`Found categories under key "${key}" — ${rawCategories.length} root items`);
      break;
    }
  }

  // If nested directly as array in data
  if (rawCategories.length === 0 && Array.isArray(data)) {
    rawCategories = data as unknown as RawCategory[];
  }

  if (rawCategories.length === 0) {
    log('Warning: Could not find category list in filterInfo response. Checking all keys...');
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length > 0) {
        log(`Trying key "${key}" with ${value.length} items`);
        rawCategories = value as RawCategory[];
        break;
      }
    }
  }

  const flat = flattenTree(rawCategories);
  log(`Flattened ${flat.length} categories from tree`);
  return flat;
}
