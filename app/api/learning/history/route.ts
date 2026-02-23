import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { WeightMap } from "@/lib/ai/prompts";

interface LearningLogEntry {
  id: string;
  weekNumber: number;
  runDate: Date;
  totalDataPoints: number;
  newDataPoints: number;
  currentAccuracy: number;
  previousAccuracy: number;
  weightsBefore: WeightMap;
  weightsAfter: WeightMap;
  patternsFound: string[];
  insights: string;
  scoringVersion: string;
}

export async function GET(): Promise<NextResponse> {
  try {
    const logs = await prisma.learningLog.findMany({
      orderBy: { runDate: "desc" },
    });

    const parsed: LearningLogEntry[] = logs.map((log) => ({
      id: log.id,
      weekNumber: log.weekNumber,
      runDate: log.runDate,
      totalDataPoints: log.totalDataPoints,
      newDataPoints: log.newDataPoints,
      currentAccuracy: log.currentAccuracy,
      previousAccuracy: log.previousAccuracy,
      weightsBefore: JSON.parse(log.weightsBefore) as WeightMap,
      weightsAfter: JSON.parse(log.weightsAfter) as WeightMap,
      patternsFound: JSON.parse(log.patternsFound) as string[],
      insights: log.insights,
      scoringVersion: log.scoringVersion,
    }));

    return NextResponse.json({
      data: parsed,
      total: parsed.length,
    });
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử learning:", error);
    return NextResponse.json(
      {
        error: "Lỗi khi tải lịch sử learning. Vui lòng thử lại.",
        code: "FETCH_ERROR",
      },
      { status: 500 }
    );
  }
}
