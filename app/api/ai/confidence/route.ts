import { NextResponse } from "next/server";
import { calculateConfidence } from "@/lib/ai/confidence";

export async function GET(): Promise<NextResponse> {
  try {
    const confidence = await calculateConfidence();

    return NextResponse.json({ data: confidence });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi tính confidence:", error);
    return NextResponse.json(
      { error: message, code: "CONFIDENCE_ERROR" },
      { status: 500 }
    );
  }
}
