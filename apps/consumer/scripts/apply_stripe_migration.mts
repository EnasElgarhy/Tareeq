/**
 * Apply the Stripe entitlements migration (202609010001 — public.report_entitlements)
 * to DATABASE_URL, then reload PostgREST's schema cache. Additive + idempotent.
 *   node_modules/.bin/tsx scripts/apply_stripe_migration.mts
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
    const v = t
      .slice(i + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(".env.local");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const file = "supabase/migrations/202609010001_report_entitlements.sql";
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
  where table_schema = 'public' and table_name = 'report_entitlements'
`;
console.log(
  "report_entitlements cols:",
  cols
    .map((c) => c.column_name)
    .sort()
    .join(", "),
);

const rls = await sql`
  select relrowsecurity from pg_class
  where oid = 'public.report_entitlements'::regclass
`;
console.log("row level security:", rls[0]?.relrowsecurity ? "enabled" : "OFF");

const policies = await sql`
  select policyname, cmd from pg_policies
  where schemaname = 'public' and tablename = 'report_entitlements'
  order by policyname
`;
console.log(
  "policies:",
  policies.map((p) => `${p.policyname} (${p.cmd})`).join(", ") || "none",
);

const indexes = await sql`
  select indexname from pg_indexes
  where schemaname = 'public' and tablename = 'report_entitlements'
  order by indexname
`;
console.log("indexes:", indexes.map((i) => i.indexname).join(", "));

await sql.unsafe("notify pgrst, 'reload schema'");
console.log("✓ asked PostgREST to reload its schema cache");

await sql.end();
console.log("done");
