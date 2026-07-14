/**
 * Apply the SQL migrations in db/migrations to the database in DATABASE_URL.
 * A psql-free runner (uses the `postgres` driver, already a dep). One-off:
 *   node_modules/.bin/tsx scripts/apply_migrations.mts
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

const sql = postgres(url, { prepare: false, max: 1, ssl: "require" });

const files = [
  "db/migrations/0001_initial_schema.sql",
  "db/migrations/0002_assessment_data_extensions.sql",
];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  try {
    await sql.unsafe(text);
    console.log("✓ applied", file);
  } catch (e) {
    console.error("✗ FAILED", file, "—", (e as Error).message);
    await sql.end();
    process.exit(1);
  }
}

const tables = await sql`
  select tablename from pg_tables where schemaname = 'public' order by tablename
`;
console.log("public tables:", tables.map((t) => t.tablename).join(", "));
await sql.end();
console.log("done");
