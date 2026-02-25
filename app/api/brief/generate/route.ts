// Phase 5: POST /api/brief/generate — Generate today's morning brief
import { NextResponse } from "next/server";
import { generateMorningBrief } from "@/lib/brief/generate-morning-brief";

export async function POST(): Promise<NextResponse> {
  try {
    const briefId = await generateMorningBrief();
    return NextResponse.json({
      data: { id: briefId },
      message: "Morning brief generated",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
