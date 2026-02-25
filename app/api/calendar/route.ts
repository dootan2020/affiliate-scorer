import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { createCalendarSchema } from "@/lib/validations/schemas-financial";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(200, parseInt(searchParams.get("limit") || "100", 10));

    const events = await prisma.calendarEvent.findMany({
      orderBy: { startDate: "asc" },
      take: limit,
    });

    return NextResponse.json({ data: events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi lấy danh sách sự kiện:", error);
    return NextResponse.json(
      { error: message, code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const validation = await validateBody(request, createCalendarSchema);
    if (validation.error) return validation.error;
    const body = validation.data;

    // Validate dates
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "startDate hoặc endDate không hợp lệ", code: "INVALID_DATE" },
        { status: 400 }
      );
    }

    if (end < start) {
      return NextResponse.json(
        { error: "endDate phải sau hoặc bằng startDate", code: "INVALID_DATE_RANGE" },
        { status: 400 }
      );
    }

    // Parse optional prepStartDate
    let prepStart: Date | null = null;
    if (body.prepStartDate) {
      prepStart = new Date(body.prepStartDate);
      if (isNaN(prepStart.getTime())) {
        return NextResponse.json(
          { error: "prepStartDate không hợp lệ", code: "INVALID_DATE" },
          { status: 400 }
        );
      }
    }

    const event = await prisma.calendarEvent.create({
      data: {
        name: body.name,
        eventType: body.eventType,
        startDate: start,
        endDate: end,
        prepStartDate: prepStart,
        platforms: body.platforms ?? [],
        notes: body.notes ?? null,
        recurring: body.recurring ?? false,
      },
    });

    return NextResponse.json(
      { message: "Đã tạo sự kiện", data: event },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi tạo sự kiện:", error);
    return NextResponse.json(
      { error: message, code: "CREATE_ERROR" },
      { status: 500 }
    );
  }
}
