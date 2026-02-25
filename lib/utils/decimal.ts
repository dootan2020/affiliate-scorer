// Utility: Prisma Decimal → JavaScript number conversion
// Prisma returns Decimal objects, not JS numbers. Direct arithmetic fails.

import type { Decimal } from "@/app/generated/prisma/internal/prismaNamespace";

/** Chuyển Prisma Decimal sang number. Null-safe. */
export function toNumber(value: Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}

/** Chuyển Prisma Decimal sang number, giữ null */
export function toNumberOrNull(value: Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === "number" ? value : Number(value);
}
