// GET /api/dashboard/channel-tasks — per-channel task summary for today
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface ChannelTask {
  channelId: string;
  channelName: string;
  personaName: string;
  slotsToday: number;
  needsBrief: number;
  drafts: number;
  readyToPublish: number;
  publishedToday: number;
}

export async function GET(): Promise<NextResponse> {
  try {
    const channels = await prisma.tikTokChannel.findMany({
      where: { isActive: true },
      select: { id: true, name: true, personaName: true },
      orderBy: { name: "asc" },
    });

    if (channels.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const channelIds = channels.map((c) => c.id);

    // Parallel queries for all channels at once
    const [slots, draftAssets, readyAssets, publishedAssets] = await Promise.all([
      // Today's content slots per channel
      prisma.contentSlot.groupBy({
        by: ["channelId", "status"],
        where: {
          channelId: { in: channelIds },
          scheduledDate: { gte: today, lt: tomorrow },
        },
        _count: true,
      }),
      // Draft assets per channel
      prisma.contentAsset.groupBy({
        by: ["channelId"],
        where: {
          channelId: { in: channelIds },
          status: "draft",
        },
        _count: true,
      }),
      // Ready to publish assets per channel
      prisma.contentAsset.groupBy({
        by: ["channelId"],
        where: {
          channelId: { in: channelIds },
          status: { in: ["produced", "rendered"] },
        },
        _count: true,
      }),
      // Published today per channel
      prisma.contentAsset.groupBy({
        by: ["channelId"],
        where: {
          channelId: { in: channelIds },
          status: "published",
          publishedAt: { gte: today, lt: tomorrow },
        },
        _count: true,
      }),
    ]);

    const tasks: ChannelTask[] = channels.map((ch) => {
      const channelSlots = slots.filter((s) => s.channelId === ch.id);
      const slotsToday = channelSlots.reduce((sum, s) => sum + s._count, 0);
      const needsBrief = channelSlots
        .filter((s) => s.status === "planned")
        .reduce((sum, s) => sum + s._count, 0);

      const drafts = draftAssets.find((d) => d.channelId === ch.id)?._count ?? 0;
      const readyToPublish = readyAssets.find((r) => r.channelId === ch.id)?._count ?? 0;
      const publishedToday = publishedAssets.find((p) => p.channelId === ch.id)?._count ?? 0;

      return {
        channelId: ch.id,
        channelName: ch.name,
        personaName: ch.personaName,
        slotsToday,
        needsBrief,
        drafts,
        readyToPublish,
        publishedToday,
      };
    });

    return NextResponse.json({ data: tasks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[dashboard/channel-tasks]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
