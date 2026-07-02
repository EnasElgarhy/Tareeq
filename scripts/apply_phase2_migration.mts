/**
 * Apply the Phase 2 migration (202606140002 — custom categories) to DATABASE_URL.
 * Additive + idempotent.
 *   node_modules/.bin/tsx scripts/apply_phase2_migration.mts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

function loadEnv(path: string) {
  const full = resolve(path);
  if (!existsSync(full)) return;
  for (const line of readFileSync(full, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(".env.local");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const file = "supabase/migrations/202606140002_custom_categories.sql";
const sql = postgres(url, { prepare: false, max: 1, ssl: "require" });

try {
  await sql.unsafe(readFileSync(file, "utf8"));
  console.log("✓ applied", file);
} catch (e) {
  console.error("✗ FAILED —", (e as Error).message);
  await sql.end();
  process.exit(1);
}

const tbl = await sql`
  select 1 from pg_tables where schemaname = 'public' and tablename = 'assessment_categories'
`;
console.log("assessment_categories:", tbl.length ? "present" : "MISSING");
const col = await sql`
  select 1 from information_schema.columns
  where table_name = 'question_options' and column_name = 'category_code'
`;
console.log("question_options.category_code:", col.length ? "present" : "MISSING");

// Direct-SQL DDL via the pooler does NOT auto-refresh PostgREST's schema cache,
// so the app (supabase-js → REST API) wouldn't see the new column/table. Ask
// PostgREST to reload. This also picks up Phase 1's content_versions.catalog_id.
await sql.unsafe("notify pgrst, 'reload schema'");
console.log("✓ asked PostgREST to reload its schema cache");

await sql.end();
console.log("done");
