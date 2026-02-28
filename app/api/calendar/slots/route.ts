import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod/v4";

const createSlotSchema = z.object({
  channelId: z.string().min(1),
  scheduledDate: z.string().min(1), // "YYYY-MM-DD"
  scheduledTime: z.string().optional(),
  contentType: z.enum(["entertainment", "education", "review", "selling"]),
  videoFormat: z.string().optional(),
  productIdentityId: z.string().optional(),
  contentAssetId: z.string().optional(),
  notes: z.string().optional(),
});

/** GET — list slots for a date range */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const start = searchParams.get("start"); // "YYYY-MM-DD"
    const end = searchParams.get("end"); // "YYYY-MM-DD"

    if (!start || !end) {
      return NextResponse.json({ error: "start and end required" }, { status: 400 });
    }

    const slots = await prisma.contentSlot.findMany({
      where: {
        ...(channelId && { channelId }),
        scheduledDate: {
          gte: new Date(start),
          lte: new Date(end),
        },
      },
      include: {
        productIdentity: { select: { id: true, title: true, imageUrl: true } },
        channel: { select: { id: true, name: true } },
        contentAsset: { select: { id: true, assetCode: true, status: true, hookText: true } },
      },
      orderBy: [{ scheduledDate: "asc" }, { scheduledTime: "asc" }],
    });

    return NextResponse.json({ data: slots });
  } catch {
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
  }
}

/** POST — create a content slot */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = createSlotSchema.parse(body);

    const slot = await prisma.contentSlot.create({
      data: {
        channelId: parsed.channelId,
        scheduledDate: new Date(parsed.scheduledDate),
        scheduledTime: parsed.scheduledTime ?? null,
        contentType: parsed.contentType,
        videoFormat: parsed.videoFormat ?? null,
        productIdentityId: parsed.productIdentityId ?? null,
        contentAssetId: parsed.contentAssetId ?? null,
        notes: parsed.notes ?? null,
      },
    });

    return NextResponse.json({ data: slot }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create slot" }, { status: 500 });
  }
}
