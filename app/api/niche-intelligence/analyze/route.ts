import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { callAI } from "@/lib/ai/call-ai";
import { gatherNicheStats } from "@/lib/niche-intelligence/gather-niche-stats";
import { buildNichePrompt } from "@/lib/niche-intelligence/build-niche-prompt";
import type {
  QuestionnaireAnswers,
  NicheAnalysisResult,
} from "@/lib/niche-intelligence/types";

const answersSchema = z.object({
  interests: z
    .array(z.string())
    .min(1, "Chọn ít nhất 1 lĩnh vực quan tâm"),
  experience: z.enum(["beginner", "intermediate", "expert"]),
  goals: z.array(z.string()).min(1, "Chọn ít nhất 1 mục tiêu"),
  contentStyle: z
    .array(z.string())
    .min(1, "Chọn ít nhất 1 phong cách nội dung"),
  budget: z.enum(["zero", "low", "medium", "high"]),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = answersSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const answers: QuestionnaireAnswers = parsed.data;

    // Gather DB stats
    const stats = await gatherNicheStats();

    // Build prompt
    const { systemPrompt, userPrompt } = buildNichePrompt(answers, stats);

    // Call AI
    const { text, modelUsed } = await callAI(
      systemPrompt,
      userPrompt,
      4096,
      "niche_intelligence"
    );

    // Parse AI response
    const result = parseAiResponse(text);

    // Save NicheProfile
    const profile = await prisma.nicheProfile.create({
      data: {
        answers: JSON.parse(JSON.stringify(answers)),
        recommendations: JSON.parse(JSON.stringify(result.recommendations)),
        summary: result.summary,
      },
    });

    return NextResponse.json({
      profileId: profile.id,
      recommendations: result.recommendations,
      summary: result.summary,
      modelUsed,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";

    // Check for missing AI config
    if (message.includes("Chua cau hinh")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }

    console.error("[niche-intelligence] Error:", error);
    return NextResponse.json(
      { error: "Không thể phân tích ngách. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}

function parseAiResponse(text: string): NicheAnalysisResult {
  // Try to extract JSON from the response
  let jsonStr = text.trim();

  // Remove markdown code blocks if present
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed.recommendations)) {
      throw new Error("Missing recommendations array");
    }

    return {
      recommendations: parsed.recommendations,
      summary: parsed.summary ?? "",
    };
  } catch {
    console.error("[niche-intelligence] Failed to parse AI response:", text);
    throw new Error(
      "AI trả về dữ liệu không hợp lệ. Vui lòng thử lại."
    );
  }
}
