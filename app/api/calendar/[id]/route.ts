import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";

const updateCalendarSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  eventType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  prepStartDate: z.string().nullable().optional(),
  platforms: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  recurring: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const validation = await validateBody(request, updateCalendarSchema);
    if (validation.error) return validation.error;
    const body = validation.data;

    // Check event exists
    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy sự kiện", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Build update data, parsing date strings to Date objects
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.eventType !== undefined) updateData.eventType = body.eventType;
    if (body.platforms !== undefined) updateData.platforms = body.platforms;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.recurring !== undefined) updateData.recurring = body.recurring;

    if (body.startDate !== undefined) {
      const start = new Date(body.startDate);
      if (isNaN(start.getTime())) {
        return NextResponse.json(
          { error: "startDate không hợp lệ", code: "INVALID_DATE" },
          { status: 400 }
        );
      }
      updateData.startDate = start;
    }

    if (body.endDate !== undefined) {
      const end = new Date(body.endDate);
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: "endDate không hợp lệ", code: "INVALID_DATE" },
          { status: 400 }
        );
      }
      updateData.endDate = end;
    }

    if (body.prepStartDate !== undefined) {
      if (body.prepStartDate === null) {
        updateData.prepStartDate = null;
      } else {
        const prep = new Date(body.prepStartDate);
        if (isNaN(prep.getTime())) {
          return NextResponse.json(
            { error: "prepStartDate không hợp lệ", code: "INVALID_DATE" },
            { status: 400 }
          );
        }
        updateData.prepStartDate = prep;
      }
    }

    // Cross-validate date range if both provided
    const finalStart = updateData.startDate
      ? (updateData.startDate as Date)
      : existing.startDate;
    const finalEnd = updateData.endDate
      ? (updateData.endDate as Date)
      : existing.endDate;
    if (finalEnd < finalStart) {
      return NextResponse.json(
        { error: "endDate phải sau hoặc bằng startDate", code: "INVALID_DATE_RANGE" },
        { status: 400 }
      );
    }

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Đã cập nhật sự kiện",
      data: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi cập nhật sự kiện:", error);
    return NextResponse.json(
      { error: message, code: "UPDATE_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy sự kiện", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    await prisma.calendarEvent.delete({ where: { id } });

    return NextResponse.json({ message: "Đã xóa sự kiện" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi xóa sự kiện:", error);
    return NextResponse.json(
      { error: message, code: "DELETE_ERROR" },
      { status: 500 }
    );
  }
}
