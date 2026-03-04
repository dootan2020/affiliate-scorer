// POST /api/tasks — create a new background task
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  type: z.string().min(1),
  label: z.string().min(1),
  channelId: z.string().optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const task = await prisma.backgroundTask.create({
      data: {
        type: parsed.data.type,
        label: parsed.data.label,
        status: "processing",
        channelId: parsed.data.channelId,
      },
    });

    return NextResponse.json({ data: task });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
