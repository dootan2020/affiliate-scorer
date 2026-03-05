import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface EventSeed {
  name: string;
  eventType: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  prepStartDate: string;
  platforms: string[];
  notes: string;
}

const EVENTS_2026: EventSeed[] = [
  { name: "Quốc tế Phụ nữ 8/3", eventType: "seasonal", startDate: "2026-03-08", endDate: "2026-03-08", prepStartDate: "2026-03-01", platforms: ["tiktok", "shopee"], notes: "phụ nữ, nữ, làm đẹp, quà tặng, chăm sóc" },
  { name: "Mega Sale 4.4", eventType: "mega_sale", startDate: "2026-04-04", endDate: "2026-04-04", prepStartDate: "2026-03-28", platforms: ["tiktok", "shopee"], notes: "sale, giảm giá, flash sale" },
  { name: "Giải phóng miền Nam 30/4", eventType: "seasonal", startDate: "2026-04-30", endDate: "2026-05-01", prepStartDate: "2026-04-23", platforms: ["tiktok"], notes: "lễ, nghỉ lễ, du lịch" },
  { name: "Mega Sale 5.5", eventType: "mega_sale", startDate: "2026-05-05", endDate: "2026-05-05", prepStartDate: "2026-04-28", platforms: ["tiktok", "shopee"], notes: "sale, giảm giá" },
  { name: "Quốc tế Thiếu nhi 1/6", eventType: "seasonal", startDate: "2026-06-01", endDate: "2026-06-01", prepStartDate: "2026-05-25", platforms: ["tiktok", "shopee"], notes: "trẻ em, đồ chơi, mẹ bé, thiếu nhi" },
  { name: "Mega Sale 6.6", eventType: "mega_sale", startDate: "2026-06-06", endDate: "2026-06-06", prepStartDate: "2026-05-30", platforms: ["tiktok", "shopee"], notes: "sale, giảm giá" },
  { name: "Mega Sale 7.7", eventType: "mega_sale", startDate: "2026-07-07", endDate: "2026-07-07", prepStartDate: "2026-06-30", platforms: ["tiktok", "shopee"], notes: "sale, giảm giá" },
  { name: "Mega Sale 8.8", eventType: "mega_sale", startDate: "2026-08-08", endDate: "2026-08-08", prepStartDate: "2026-08-01", platforms: ["tiktok", "shopee"], notes: "sale, giảm giá" },
  { name: "Mega Sale 9.9", eventType: "mega_sale", startDate: "2026-09-09", endDate: "2026-09-09", prepStartDate: "2026-09-02", platforms: ["tiktok", "shopee"], notes: "sale, giảm giá" },
  { name: "Mega Sale 10.10", eventType: "mega_sale", startDate: "2026-10-10", endDate: "2026-10-10", prepStartDate: "2026-10-03", platforms: ["tiktok", "shopee"], notes: "sale, giảm giá" },
  { name: "Phụ nữ Việt Nam 20/10", eventType: "seasonal", startDate: "2026-10-20", endDate: "2026-10-20", prepStartDate: "2026-10-13", platforms: ["tiktok", "shopee"], notes: "phụ nữ, nữ, làm đẹp, quà tặng" },
  { name: "Mega Sale 11.11", eventType: "mega_sale", startDate: "2026-11-11", endDate: "2026-11-11", prepStartDate: "2026-11-04", platforms: ["tiktok", "shopee"], notes: "sale, giảm giá, black friday" },
  { name: "Nhà giáo Việt Nam 20/11", eventType: "seasonal", startDate: "2026-11-20", endDate: "2026-11-20", prepStartDate: "2026-11-13", platforms: ["tiktok", "shopee"], notes: "nhà giáo, thầy cô, quà tặng, sách" },
  { name: "Mega Sale 12.12", eventType: "mega_sale", startDate: "2026-12-12", endDate: "2026-12-12", prepStartDate: "2026-12-05", platforms: ["tiktok", "shopee"], notes: "sale, giảm giá, cuối năm" },
  { name: "Giáng sinh 25/12", eventType: "seasonal", startDate: "2026-12-25", endDate: "2026-12-25", prepStartDate: "2026-12-18", platforms: ["tiktok", "shopee"], notes: "giáng sinh, noel, quà tặng, lễ hội" },
];

/**
 * POST /api/internal/seed-calendar
 * Seeds CalendarEvent with major VN 2026 events. Skips if event already exists (by name).
 */
export async function POST(): Promise<NextResponse> {
  try {
    const existing = await prisma.calendarEvent.findMany({
      select: { name: true },
    });
    const existingNames = new Set(existing.map((e) => e.name));

    let created = 0;
    let skipped = 0;

    for (const ev of EVENTS_2026) {
      if (existingNames.has(ev.name)) {
        skipped++;
        continue;
      }

      await prisma.calendarEvent.create({
        data: {
          name: ev.name,
          eventType: ev.eventType,
          startDate: new Date(ev.startDate),
          endDate: new Date(ev.endDate),
          prepStartDate: new Date(ev.prepStartDate),
          platforms: ev.platforms,
          notes: ev.notes,
          recurring: true,
        },
      });
      created++;
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: EVENTS_2026.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
