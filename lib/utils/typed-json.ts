/**
 * Type-safe accessors for Prisma JSON fields.
 * Replaces unsafe `as unknown as T[]` casts with runtime validation.
 */

import type { JsonValue, InputJsonValue } from "@/app/generated/prisma/internal/prismaNamespace";

export interface DailyResultEntry {
  date: string;
  spend: number;
  orders: number;
  revenue: number;
  clicks?: number;
  notes?: string;
}

export interface ChecklistItem {
  label: string;
  dueDay: number;
  completed: boolean;
  completedAt: string | null;
}

/**
 * Parse a Prisma JsonValue into a typed array.
 * Returns empty array if value is null/undefined or not an array.
 */
function parseJsonArray<T>(value: JsonValue | null | undefined): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function parseDailyResults(value: JsonValue | null | undefined): DailyResultEntry[] {
  return parseJsonArray<DailyResultEntry>(value);
}

export function parseChecklist(value: JsonValue | null | undefined): ChecklistItem[] {
  return parseJsonArray<ChecklistItem>(value);
}

/**
 * Serialize a typed array back to a Prisma-safe JSON value.
 * Uses JSON.parse(JSON.stringify()) to strip class instances and ensure plain objects.
 */
export function toJsonValue<T>(value: T): InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as InputJsonValue;
}
