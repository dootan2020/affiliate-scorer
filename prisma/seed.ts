import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEMO_PRODUCTS = [
  {
    name: "Máy massage cổ HQ-168 Pro",
    category: "Health",
    price: 389000,
    commissionRate: 12,
    commissionVND: 46680,
    platform: "tiktok_shop",
    salesTotal: 2340,
    salesGrowth7d: 340,
    salesGrowth30d: 120,
    revenue7d: 912000000,
    revenue30d: 2800000000,
    affiliateCount: 12,
    creatorCount: 8,
    topVideoViews: 450000,
    shopName: "HealthGadget Official",
    shopRating: 4.8,
    source: "fastmoss",
  },
  {
    name: "Serum HA Plus Hydra 30ml",
    category: "Beauty",
    price: 245000,
    commissionRate: 15,
    commissionVND: 36750,
    platform: "shopee",
    salesTotal: 5600,
    salesGrowth7d: 180,
    salesGrowth30d: 95,
    revenue7d: 1372000000,
    revenue30d: 3200000000,
    affiliateCount: 8,
    creatorCount: 15,
    topVideoViews: 320000,
    shopName: "BeautyLab VN",
    shopRating: 4.9,
    source: "kalodata",
  },
];

async function main(): Promise<void> {
  console.log("Seeding database...");

  const batch = await prisma.importBatch.create({
    data: {
      source: "demo_seed",
      fileName: "seed-data.csv",
      recordCount: DEMO_PRODUCTS.length,
    },
  });

  const products = await Promise.all(
    DEMO_PRODUCTS.map((p) =>
      prisma.product.create({
        data: { ...p, importBatchId: batch.id, dataDate: new Date() },
      }),
    ),
  );

  console.log(`Created ${products.length} demo products`);
  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
    void pool.end();
  });
