import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** GET — export full channel data as downloadable JSON */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const channel = await prisma.tikTokChannel.findUnique({
      where: { id },
      include: {
        contentSlots: true,
        contentAssets: true,
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const safeName = channel.name
      .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF ]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 50);
    const filename = `channel-${safeName}-${new Date().toISOString().slice(0, 10)}.json`;

    const json = JSON.stringify(channel, null, 2);

    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to export channel" }, { status: 500 });
  }
}
