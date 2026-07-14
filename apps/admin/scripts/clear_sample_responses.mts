/**
 * Remove the sample assessment responses created by seed_sample_responses.mts.
 *   node_modules/.bin/tsx scripts/clear_sample_responses.mts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { error, count } = await sb
  .from("assessments")
  .delete({ count: "exact" })
  .like("anon_session_id", "sample-resp-%");

if (error) {
  console.error("✗ failed —", error.message);
  process.exit(1);
}
console.log(`✓ removed ${count ?? 0} sample responses`);
