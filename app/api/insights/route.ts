import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { WeightMap } from "@/lib/ai/prompts";

export interface AccuracyTrendPoint {
  weekNumber: number;
  currentAccuracy: number;
}

export interface InsightsData {
  latestLog: {
    id: string;
    weekNumber: number;
    runDate: Date;
    currentAccuracy: number;
    previousAccuracy: number;
    weightsBefore: WeightMap;
    weightsAfter: WeightMap;
    patternsFound: string[];
    insights: string;
  } | null;
  accuracyTrend: AccuracyTrendPoint[];
  totalFeedbackCount: number;
}

export async function GET(): Promise<NextResponse> {
  try {
    const [logs, feedbackCount] = await Promise.all([
      prisma.learningLog.findMany({
        orderBy: { runDate: "desc" },
        take: 10,
      }),
      prisma.feedback.count(),
    ]);

    const latestLog = logs[0]
      ? {
          id: logs[0].id,
          weekNumber: logs[0].weekNumber,
          runDate: logs[0].runDate,
          currentAccuracy: logs[0].currentAccuracy,
          previousAccuracy: logs[0].previousAccuracy,
          weightsBefore: JSON.parse(logs[0].weightsBefore) as WeightMap,
          weightsAfter: JSON.parse(logs[0].weightsAfter) as WeightMap,
          patternsFound: JSON.parse(logs[0].patternsFound) as string[],
          insights: logs[0].insights,
        }
      : null;

    const accuracyTrend: AccuracyTrendPoint[] = [...logs]
      .reverse()
      .map((log) => ({
        weekNumber: log.weekNumber,
        currentAccuracy: log.currentAccuracy,
      }));

    return NextResponse.json({
      data: {
        latestLog,
        accuracyTrend,
        totalFeedbackCount: feedbackCount,
      } satisfies InsightsData,
    });
  } catch (error) {
    console.error("Lỗi khi lấy insights:", error);
    return NextResponse.json(
      {
        error: "Lỗi khi tải insights. Vui lòng thử lại.",
        code: "FETCH_ERROR",
      },
      { status: 500 }
    );
  }
}
