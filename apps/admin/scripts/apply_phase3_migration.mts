/**
 * Apply the Phase 3 migration (202606160001 — result profiles + scoring strategy)
 * to DATABASE_URL, then reload PostgREST's schema cache. Additive + idempotent.
 *   node_modules/.bin/tsx scripts/apply_phase3_migration.mts
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

const file = "supabase/migrations/202606160001_result_profiles_rules.sql";
const sql = postgres(url, { prepare: false, max: 1, ssl: "require" });

try {
  await sql.unsafe(readFileSync(file, "utf8"));
  console.log("✓ applied", file);
} catch (e) {
  console.error("✗ FAILED —", (e as Error).message);
  await sql.end();
  process.exit(1);
}

const cols = await sql`
  select column_name from information_schema.columns
  where table_name = 'result_profiles'
    and column_name in ('code','category_code','recommended_majors','recommended_careers','strengths','development_areas')
`;
console.log("result_profiles new cols:", cols.map((c) => c.column_name).sort().join(", "));
const strat = await sql`
  select 1 from information_schema.columns
  where table_name = 'assessments_catalog' and column_name = 'scoring_strategy'
`;
console.log("assessments_catalog.scoring_strategy:", strat.length ? "present" : "MISSING");

await sql.unsafe("notify pgrst, 'reload schema'");
console.log("✓ asked PostgREST to reload its schema cache");

await sql.end();
console.log("done");
