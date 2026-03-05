export const maxDuration = 60;

import { NextResponse } from "next/server";
import { dispatchRescore } from "@/lib/scoring/rescore-dispatcher";

/**
 * POST /api/internal/rescore-reactive
 * Dispatch reactive re-scoring: normalize_only or formula_only.
 * AI re-score must use /api/internal/score-batch instead.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      type?: string;
      scope?: string;
      categories?: string[];
      identityIds?: string[];
      reason?: string;
    };

    const type = body.type === "normalize_only" ? "normalize_only" : "formula_only";
    const scope =
      body.scope === "category"
        ? "category"
        : body.scope === "identityIds"
          ? "identityIds"
          : "all";

    const result = await dispatchRescore({
      type,
      scope,
      categories: body.categories,
      identityIds: body.identityIds,
      reason: body.reason ?? "manual",
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
