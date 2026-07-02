/**
 * Ask PostgREST (the Supabase REST API the app uses) to reload its schema cache.
 * Needed after applying DDL via the direct/pooler connection, which does NOT
 * auto-refresh the cache — so the app keeps seeing "column does not exist" until
 * this runs. Harmless + idempotent: it only refreshes the API's view of the
 * schema; it changes no data.
 *   node_modules/.bin/tsx scripts/reload_schema_cache.mts
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
await sql.unsafe("notify pgrst, 'reload schema'");
console.log("✓ PostgREST asked to reload its schema cache");
await sql.end();
