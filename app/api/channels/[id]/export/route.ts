import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Custom replacer to handle Prisma types (BigInt, Decimal, Date) */
function safeReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (value !== null && typeof value === "object" && "toFixed" in value) {
    return Number(value);
  }
  return value;
}

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

    const json = JSON.stringify(channel, safeReplacer, 2);

    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[channel-export] Failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to export channel", detail: message }, { status: 500 });
  }
}
