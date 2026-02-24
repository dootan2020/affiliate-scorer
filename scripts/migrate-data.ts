/**
 * Migrate data from SQLite (dev.db) to Supabase PostgreSQL.
 * Run: npx tsx scripts/migrate-data.ts
 */
import "dotenv/config";
import Database from "better-sqlite3";
import { Pool } from "pg";
import { join } from "node:path";

const SQLITE_PATH = join(process.cwd(), "dev.db");
const PG_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!PG_URL) {
  console.error("DATABASE_URL or DIRECT_URL not set in .env");
  process.exit(1);
}

const sqlite = new Database(SQLITE_PATH, { readonly: true });
const pg = new Pool({ connectionString: PG_URL });

interface TableMeta {
  name: string;
  order: number; // insert order to respect foreign keys
}

const TABLES: TableMeta[] = [
  { name: "ImportBatch", order: 1 },
  { name: "Product", order: 2 },
  { name: "Feedback", order: 3 },
  { name: "LearningLog", order: 4 },
  { name: "ProductSnapshot", order: 5 },
];

function getRows(table: string): Record<string, unknown>[] {
  return sqlite.prepare(`SELECT * FROM "${table}"`).all() as Record<string, unknown>[];
}

function buildInsertSQL(table: string, columns: string[]): string {
  const cols = columns.map((c) => `"${c}"`).join(", ");
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  return `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;
}

async function migrateTable(table: string): Promise<number> {
  const rows = getRows(table);
  if (rows.length === 0) {
    console.log(`  ${table}: 0 records (empty)`);
    return 0;
  }

  const columns = Object.keys(rows[0]);
  const sql = buildInsertSQL(table, columns);

  let inserted = 0;
  for (const row of rows) {
    const values = columns.map((col) => {
      const val = row[col];
      // Convert SQLite integer booleans to proper booleans for PG
      if (val === 0 || val === 1) {
        // Check if this is actually a boolean field
        // For now, keep as-is since our schema doesn't have boolean fields in these tables
      }
      return val === undefined ? null : val;
    });

    try {
      await pg.query(sql, values);
      inserted++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR inserting into ${table}:`, msg);
      console.error(`  Row ID:`, row["id"]);
    }
  }

  const status = inserted === rows.length ? "OK" : "PARTIAL";
  console.log(`  ${table}: ${inserted}/${rows.length} ${status}`);
  return inserted;
}

async function main(): Promise<void> {
  console.log("=== MIGRATE SQLite → Supabase PostgreSQL ===\n");
  console.log(`SQLite: ${SQLITE_PATH}`);
  console.log(`PostgreSQL: ${PG_URL?.replace(/:[^:@]+@/, ":***@")}\n`);

  // Verify PG connection
  try {
    const res = await pg.query("SELECT 1 as test");
    console.log("PostgreSQL connection: OK\n");
  } catch (err) {
    console.error("Cannot connect to PostgreSQL:", err);
    process.exit(1);
  }

  // Sort by order and migrate
  const sorted = [...TABLES].sort((a, b) => a.order - b.order);

  console.log("Migrating tables:");
  const results: Record<string, { sqlite: number; pg: number }> = {};

  for (const { name } of sorted) {
    const sqliteCount = getRows(name).length;
    const pgInserted = await migrateTable(name);
    results[name] = { sqlite: sqliteCount, pg: pgInserted };
  }

  // Verify counts
  console.log("\n=== VERIFICATION ===");
  let allMatch = true;
  for (const { name } of sorted) {
    const pgResult = await pg.query(`SELECT COUNT(*) as cnt FROM "${name}"`);
    const pgCount = parseInt(pgResult.rows[0].cnt, 10);
    const sqliteCount = results[name].sqlite;
    const match = pgCount >= sqliteCount;
    const icon = match ? "OK" : "MISMATCH";
    console.log(`  ${name}: SQLite=${sqliteCount}, PostgreSQL=${pgCount} ${icon}`);
    if (!match) allMatch = false;
  }

  console.log(`\n${allMatch ? "ALL TABLES MIGRATED SUCCESSFULLY" : "SOME TABLES HAVE MISMATCHES — CHECK ABOVE"}`);

  sqlite.close();
  await pg.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
