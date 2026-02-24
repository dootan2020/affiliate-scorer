import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const SEED_EVENTS = [
  { name: "Valentine", eventType: "seasonal", startDate: "2026-02-14", endDate: "2026-02-14", recurring: true },
  { name: "3.3 Mega Sale", eventType: "mega_sale", startDate: "2026-03-01", endDate: "2026-03-03", recurring: true },
  { name: "Quốc tế Phụ nữ", eventType: "seasonal", startDate: "2026-03-08", endDate: "2026-03-08", recurring: true },
  { name: "4.4 Sale", eventType: "mega_sale", startDate: "2026-04-04", endDate: "2026-04-04", recurring: true },
  { name: "30/4 - 1/5", eventType: "seasonal", startDate: "2026-04-30", endDate: "2026-05-01", recurring: true },
  { name: "5.5 Sale", eventType: "mega_sale", startDate: "2026-05-05", endDate: "2026-05-05", recurring: true },
  { name: "6.6 Sale", eventType: "mega_sale", startDate: "2026-06-06", endDate: "2026-06-06", recurring: true },
  { name: "7.7 Sale", eventType: "mega_sale", startDate: "2026-07-07", endDate: "2026-07-07", recurring: true },
  { name: "8.8 Sale", eventType: "mega_sale", startDate: "2026-08-08", endDate: "2026-08-08", recurring: true },
  { name: "Back to School", eventType: "seasonal", startDate: "2026-08-15", endDate: "2026-09-05", recurring: true },
  { name: "9.9 Sale", eventType: "mega_sale", startDate: "2026-09-09", endDate: "2026-09-09", recurring: true },
  { name: "Trung thu", eventType: "seasonal", startDate: "2026-09-27", endDate: "2026-09-27", recurring: true },
  { name: "10.10 Sale", eventType: "mega_sale", startDate: "2026-10-10", endDate: "2026-10-10", recurring: true },
  { name: "Singles Day 11.11", eventType: "mega_sale", startDate: "2026-11-11", endDate: "2026-11-11", recurring: true },
  { name: "Black Friday", eventType: "mega_sale", startDate: "2026-11-27", endDate: "2026-11-27", recurring: true },
  { name: "12.12 Sale", eventType: "mega_sale", startDate: "2026-12-12", endDate: "2026-12-12", recurring: true },
  { name: "Giáng sinh", eventType: "seasonal", startDate: "2026-12-25", endDate: "2026-12-25", recurring: true },
  { name: "Tết Nguyên Đán", eventType: "seasonal", startDate: "2027-02-06", endDate: "2027-02-12", recurring: true },
];

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Create a .env file with DATABASE_URL.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Seeding calendar events...");

  let created = 0;
  let skipped = 0;

  for (const event of SEED_EVENTS) {
    // Check if event with same name already exists (upsert by name)
    const existing = await prisma.calendarEvent.findFirst({
      where: { name: event.name },
    });

    if (existing) {
      // Update existing
      await prisma.calendarEvent.update({
        where: { id: existing.id },
        data: {
          eventType: event.eventType,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          recurring: event.recurring,
        },
      });
      skipped++;
      console.log(`  Updated: ${event.name}`);
    } else {
      await prisma.calendarEvent.create({
        data: {
          name: event.name,
          eventType: event.eventType,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          recurring: event.recurring,
          platforms: [],
        },
      });
      created++;
      console.log(`  Created: ${event.name}`);
    }
  }

  console.log(`\nDone! Created: ${created}, Updated: ${skipped}`);

  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
