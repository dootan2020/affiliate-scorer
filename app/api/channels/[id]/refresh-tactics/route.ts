import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod/v4";
import { gatherChannelPerformance, countTrackedVideos } from "@/lib/content/gather-channel-performance";
import { generateTacticalRefresh } from "@/lib/content/generate-tactical-refresh";
import { createTask, completeTask, failTask } from "@/lib/services/background-task";

/** GET — tracked video count + last 10 refresh history entries */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const [count, history] = await Promise.all([
      countTrackedVideos(id),
      prisma.tacticalRefreshLog.findMany({
        where: { channelId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);
    return NextResponse.json({ count, history });
  } catch {
    return NextResponse.json({ count: 0, history: [] });
  }
}

const refreshInputSchema = z.object({
  trendingContext: z.string().max(3000).optional().default(""),
  useTracking: z.boolean().optional().default(false),
}).refine(
  (data) => data.trendingContext.length >= 10 || data.useTracking,
  { message: "Cần nhập trending context (≥10 ký tự) hoặc bật phân tích tracking data" },
);

/** POST — generate tactical refresh suggestions (non-blocking) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const body = await req.json();
    const input = refreshInputSchema.parse(body);

    const channel = await prisma.tikTokChannel.findUnique({ where: { id } });
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const taskId = await createTask({
      type: "refresh_tactics",
      label: "Đang tạo gợi ý chiến thuật...",
      channelId: id,
    });

    after(async () => {
      try {
        const performanceData = input.useTracking
          ? await gatherChannelPerformance(id)
          : undefined;

        const channelData = JSON.parse(JSON.stringify(channel)) as Record<string, unknown>;

        const result = await generateTacticalRefresh(
          channelData,
          { trendingContext: input.trendingContext, useTracking: input.useTracking },
          performanceData,
        );

        await completeTask(taskId, "Gợi ý chiến thuật", {
          suggestions: result.suggestions,
          analysisNotes: result.analysisNotes,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Lỗi tạo gợi ý chiến thuật";
        console.error("[refresh-tactics] Error:", msg);
        await failTask(taskId, msg).catch(() => {});
      }
    });

    return NextResponse.json({ taskId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 },
      );
    }
    console.error("[refresh-tactics] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate refresh" },
      { status: 500 },
    );
  }
}

const applySchema = z.object({
  trendingContext: z.string().optional().default(""),
  usedTracking: z.boolean().optional().default(false),
  analysisNotes: z.string().optional().default(""),
  suggestions: z.array(z.record(z.string(), z.unknown())),
  appliedFields: z.array(z.string()),
  appliedValues: z.record(z.string(), z.unknown()),
});

/** PUT — atomic apply selected suggestions + save log entry */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const body = await req.json();
    const input = applySchema.parse(body);

    const channel = await prisma.tikTokChannel.findUnique({ where: { id } });
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Save log + apply changes in transaction
    const [log] = await prisma.$transaction([
      prisma.tacticalRefreshLog.create({
        data: {
          channelId: id,
          trendingContext: input.trendingContext || null,
          usedTracking: input.usedTracking,
          analysisNotes: input.analysisNotes || null,
          suggestions: JSON.parse(JSON.stringify(input.suggestions)),
          appliedFields: JSON.parse(JSON.stringify(input.appliedFields)),
        },
      }),
      prisma.tikTokChannel.update({
        where: { id },
        data: input.appliedValues,
      }),
    ]);

    return NextResponse.json({ data: log });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 },
      );
    }
    console.error("[refresh-tactics] PUT error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to apply refresh" },
      { status: 500 },
    );
  }
}
