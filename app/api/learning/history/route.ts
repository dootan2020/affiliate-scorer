import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { WeightMap } from "@/lib/ai/prompts";

const DEFAULT_WEIGHTS: WeightMap = {
  commission: 0.2, trending: 0.2, competition: 0.2,
  contentFit: 0.15, price: 0.15, platform: 0.1,
};

function safeJsonParse<T>(json: string, fallback: T): T {
  try { return JSON.parse(json) as T; } catch { return fallback; }
}

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
      weightsBefore: safeJsonParse<WeightMap>(log.weightsBefore, DEFAULT_WEIGHTS),
      weightsAfter: safeJsonParse<WeightMap>(log.weightsAfter, DEFAULT_WEIGHTS),
      patternsFound: safeJsonParse<string[]>(log.patternsFound, []),
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
