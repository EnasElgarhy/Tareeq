/**
 * Smoke-test the assessments_catalog ↔ content_versions linkage against the
 * live DB. Run AFTER apply_hybrid_migration.mts. Inserts one catalog + one
 * linked version, proves the join, then deletes ONLY the two rows it created.
 *   node_modules/.bin/tsx scripts/smoke_catalog.mts
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

const sql = postgres(url, { prepare: false, max: 1, ssl: "require" });

try {
  const [cat] = await sql`
    insert into assessments_catalog
      (name, primary_language, supported_languages, assessment_type, creation_method, status)
    values
      (${sql.json({ en: "SMOKE TEST — safe to delete" })}, 'en',
       ${sql.json(["en", "ar"])}, 'custom', 'manual', 'draft')
    returning id
  `;
  const [ver] = await sql`
    insert into content_versions (label, is_active, catalog_id)
    values ('SMOKE TEST — safe to delete', false, ${cat.id})
    returning id
  `;
  const rows = await sql`
    select c.id as catalog_id, c.assessment_type, c.creation_method, v.id as version_id
    from assessments_catalog c
    join content_versions v on v.catalog_id = c.id
    where c.id = ${cat.id}
  `;
  console.log("✓ linkage:", rows[0]);

  // Clean up ONLY the rows this script created.
  await sql`delete from content_versions where id = ${ver.id}`;
  await sql`delete from assessments_catalog where id = ${cat.id}`;
  console.log("✓ smoke test passed — catalog↔version linkage works; test rows removed");
} catch (e) {
  console.error("✗ smoke test FAILED —", (e as Error).message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
