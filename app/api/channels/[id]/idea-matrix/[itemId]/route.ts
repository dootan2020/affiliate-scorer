// PUT /api/channels/[id]/idea-matrix/[itemId] — Update status (pick/dismiss)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { updateIdeaMatrixItemSchema } from "@/lib/validations/schemas-character";

interface Ctx {
  params: Promise<{ id: string; itemId: string }>;
}

export async function PUT(req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id, itemId } = await ctx.params;
  try {
    const existing = await prisma.ideaMatrixItem.findFirst({
      where: { id: itemId, channelId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy ý tưởng" }, { status: 404 });
    }

    const validation = await validateBody(req, updateIdeaMatrixItemSchema);
    if (validation.error) return validation.error;

    const updated = await prisma.ideaMatrixItem.update({
      where: { id: itemId },
      data: validation.data,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
