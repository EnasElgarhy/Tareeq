/** Read-only: report what actually exists in the DATABASE_URL database. */
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

const sql = postgres(process.env.DATABASE_URL as string, {
  prepare: false,
  max: 1,
  ssl: "require",
});

const info = await sql`select current_database() as db, current_schema() as schema, current_setting('search_path') as search_path`;
console.log("connection:", info[0]);

const tables = await sql`select tablename from pg_tables where schemaname = 'public' order by tablename`;
console.log("\npublic tables:\n  " + tables.map((t) => t.tablename).join(", "));

for (const t of ["assessments_catalog", "content_versions", "question_options", "assessment_categories"]) {
  const cols = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = ${t}
    order by ordinal_position
  `;
  console.log(`\n${t}:`, cols.length ? cols.map((c) => c.column_name).join(", ") : "(MISSING)");
}

await sql.end();
