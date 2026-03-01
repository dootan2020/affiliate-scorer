// PATCH /api/commissions/[id] — transition commission status
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod/v4";
import { assertTransition } from "@/lib/state-machines/transitions";
import { validateBody } from "@/lib/validations/validate-body";

const updateSchema = z.object({
  status: z.enum(["confirmed", "paid", "rejected"]),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const validation = await validateBody(request, updateSchema);
    if (validation.error) return validation.error;
    const body = validation.data;

    const commission = await prisma.commission.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!commission) {
      return NextResponse.json({ error: "Commission not found" }, { status: 404 });
    }

    assertTransition("commissionStatus", commission.status, body.status);

    const data: Record<string, unknown> = { status: body.status };
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.status === "paid") data.receivedDate = new Date();

    const updated = await prisma.commission.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      data: updated,
      message: `Commission → ${body.status}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
