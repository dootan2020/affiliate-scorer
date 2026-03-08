import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface UpcomingEvent {
  id: string;
  name: string;
  eventType: string;
  startDate: Date;
  endDate: Date;
  prepStartDate: Date | null;
  platforms: string[];
  notes: string | null;
  recurring: boolean;
  daysUntil: number;
}

export async function GET(): Promise<NextResponse> {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const events = await prisma.calendarEvent.findMany({
      where: {
        startDate: {
          gte: now,
          lte: thirtyDaysLater,
        },
      },
      orderBy: { startDate: "asc" },
    });

    // Deduplicate events with same startDate (keep the one with longer name for clarity)
    const deduped = new Map<string, typeof events[number]>();
    for (const event of events) {
      const key = event.startDate.toISOString().slice(0, 10);
      const existing = deduped.get(key);
      if (!existing || event.name.length > existing.name.length) {
        deduped.set(key, event);
      }
    }

    // Calculate daysUntil for each event
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const upcomingEvents: UpcomingEvent[] = Array.from(deduped.values()).map((event) => {
      const eventStart = new Date(event.startDate);
      const eventStartDay = new Date(
        eventStart.getFullYear(),
        eventStart.getMonth(),
        eventStart.getDate()
      );
      const diffMs = eventStartDay.getTime() - todayStart.getTime();
      const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        id: event.id,
        name: event.name,
        eventType: event.eventType,
        startDate: event.startDate,
        endDate: event.endDate,
        prepStartDate: event.prepStartDate,
        platforms: event.platforms,
        notes: event.notes,
        recurring: event.recurring,
        daysUntil,
      };
    });

    return NextResponse.json({ data: upcomingEvents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi lấy sự kiện sắp tới:", error);
    return NextResponse.json(
      { error: message, code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}
