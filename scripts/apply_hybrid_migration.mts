/**
 * Apply the hybrid-assessment migration (202606140001) to DATABASE_URL.
 * Idempotent + resilient: core schema first, then the Storage bucket via the
 * JS admin client, then the storage RLS policies (non-fatal — service-role
 * access bypasses RLS, so the policies are defense-in-depth only).
 *   node_modules/.bin/tsx scripts/apply_hybrid_migration.mts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
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

const file = "supabase/migrations/202606140001_assessment_catalog.sql";
const text = readFileSync(file, "utf8");
const marker = "-- ── 10. STORAGE BUCKET";
const at = text.indexOf(marker);
const corePart = at === -1 ? text : text.slice(0, at);
const storagePart = at === -1 ? "" : text.slice(at);

const sql = postgres(url, { prepare: false, max: 1, ssl: "require" });

try {
  await sql.unsafe(corePart);
  console.log("✓ core schema applied");
} catch (e) {
  console.error("✗ core schema FAILED —", (e as Error).message);
  await sql.end();
  process.exit(1);
}

const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (supaUrl && serviceKey) {
  const supa = createClient(supaUrl, serviceKey, {
    auth: { persistSession: false },
  });
  const { error } = await supa.storage.createBucket("assessment-sources", {
    public: false,
  });
  if (error && !/exist/i.test(error.message)) {
    console.warn("⚠ bucket create:", error.message);
  } else {
    console.log("✓ storage bucket 'assessment-sources' ready");
  }
}

if (storagePart.trim()) {
  try {
    await sql.unsafe(storagePart);
    console.log("✓ storage RLS policies applied");
  } catch (e) {
    console.warn(
      "⚠ storage RLS policies skipped (non-fatal — service-role bypasses RLS):",
      (e as Error).message,
    );
  }
}

const tables = await sql`
  select tablename from pg_tables
  where schemaname = 'public'
    and tablename in ('assessments_catalog','result_profiles','result_rules','scoring_specs','source_documents')
  order by tablename
`;
console.log("new tables:", tables.map((t) => t.tablename).join(", ") || "(none!)");

const weight = await sql`
  select 1 from information_schema.columns
  where table_name = 'question_options' and column_name = 'weight'
`;
console.log("question_options.weight:", weight.length ? "present" : "MISSING");

const i18n = await sql`
  select 1 from information_schema.columns
  where table_name = 'clusters' and column_name = 'name_i18n'
`;
console.log("clusters.name_i18n:", i18n.length ? "present" : "MISSING");

await sql.end();
console.log("done");
