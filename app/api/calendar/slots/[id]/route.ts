import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod/v4";
import { validateTransition } from "@/lib/state-machines/transitions";

const updateSlotSchema = z.object({
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().nullable().optional(),
  contentType: z.enum(["entertainment", "education", "review", "selling"]).optional(),
  videoFormat: z.string().nullable().optional(),
  productIdentityId: z.string().nullable().optional(),
  contentAssetId: z.string().nullable().optional(),
  status: z.enum(["planned", "briefed", "produced", "rendered", "published", "skipped"]).optional(),
  notes: z.string().nullable().optional(),
});

/** PUT — update a slot */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = updateSlotSchema.parse(body);

    // Validate state transition if status is changing
    if (parsed.status) {
      const existing = await prisma.contentSlot.findUnique({
        where: { id },
        select: { status: true },
      });
      if (existing && parsed.status !== existing.status) {
        const check = validateTransition("slotStatus", existing.status, parsed.status);
        if (!check.valid) {
          return NextResponse.json({ error: check.error }, { status: 400 });
        }
      }
    }

    const data: Record<string, unknown> = { ...parsed };
    if (parsed.scheduledDate) data.scheduledDate = new Date(parsed.scheduledDate);

    const slot = await prisma.contentSlot.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: slot });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update slot" }, { status: 500 });
  }
}

/** DELETE — remove a slot */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    await prisma.contentSlot.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete slot" }, { status: 500 });
  }
}
