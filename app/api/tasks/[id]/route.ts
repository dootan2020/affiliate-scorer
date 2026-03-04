// GET + PATCH /api/tasks/[id] — read and update background tasks
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  detail: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
});

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;

  try {
    const task = await prisma.backgroundTask.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ data: task });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const task = await prisma.backgroundTask.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ data: task });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
