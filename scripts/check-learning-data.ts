import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

async function main() {
  const [fb, wt, pt, pub, total] = await Promise.all([
    p.feedback.count(),
    p.learningWeightP4.count(),
    p.userPattern.count(),
    p.contentAsset.count({ where: { status: "published" } }),
    p.contentAsset.count(),
  ]);
  console.log("=== Learning System Data ===");
  console.log(`  Feedback records: ${fb}`);
  console.log(`  Learning weights: ${wt}`);
  console.log(`  User patterns: ${pt}`);
  console.log(`  Published assets: ${pub}`);
  console.log(`  Total assets: ${total}`);
  console.log("");

  if (fb === 0) {
    console.log("⚠️  No feedback records. Learning cycle requires feedback to analyze.");
    console.log("   Import feedback data via /upload → feedback tab, or log manually via /api/logs.");
  }
  if (pub < 5) {
    console.log(`⚠️  Only ${pub} published assets. Weekly report needs >= 5 published videos.`);
  }

  await p.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
