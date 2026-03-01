// POST /api/inbox/items/[id]/retry — retry failed InboxItem
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseLinks } from "@/lib/parsers/link-parser";
import { processInboxItem } from "@/lib/inbox/process-inbox-item";
import { assertTransition } from "@/lib/state-machines/transitions";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const item = await prisma.inboxItem.findUnique({
      where: { id },
      select: { id: true, status: true, rawUrl: true },
    });

    if (!item) {
      return NextResponse.json({ error: "InboxItem not found" }, { status: 404 });
    }

    // Validate transition: only failed → pending allowed
    assertTransition("inboxItemStatus", item.status, "pending");

    // Reset status to pending
    await prisma.inboxItem.update({
      where: { id },
      data: { status: "pending" },
    });

    // Re-parse and re-process the original URL
    const parsed = parseLinks(item.rawUrl);
    if (parsed.length === 0) {
      await prisma.inboxItem.update({
        where: { id },
        data: { status: "failed" },
      });
      return NextResponse.json(
        { error: "URL không hợp lệ khi re-parse" },
        { status: 400 },
      );
    }

    const result = await processInboxItem(parsed[0]);

    // Update the original item with retry result
    await prisma.inboxItem.update({
      where: { id },
      data: {
        status: result.status === "failed" ? "failed" : "matched",
        productIdentityId: result.identityId,
        extractedTitle: result.title,
      },
    });

    return NextResponse.json({
      data: result,
      message: `Retry: ${result.status}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
