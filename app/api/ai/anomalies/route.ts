import { NextResponse } from "next/server";
import { detectAnomalies } from "@/lib/ai/anomaly-detection";

export async function GET(): Promise<NextResponse> {
  try {
    const anomalies = await detectAnomalies();

    return NextResponse.json({ data: anomalies });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi phát hiện anomalies:", error);
    return NextResponse.json(
      { error: message, code: "ANOMALIES_ERROR" },
      { status: 500 }
    );
  }
}
