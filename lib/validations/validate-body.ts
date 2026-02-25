import { z } from "zod/v4";
import { NextResponse } from "next/server";

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Returns the parsed data on success, or a 400 NextResponse on failure.
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_JSON" },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        { error: "Validation failed", details: result.error.issues, code: "VALIDATION_ERROR" },
        { status: 400 }
      ),
    };
  }

  return { data: result.data, error: null };
}
