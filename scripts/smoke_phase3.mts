/**
 * Smoke the Phase 3/4 data path via the SAME client the app uses (supabase-js →
 * PostgREST): catalog → category → profile (rich cols) → rule → published spec →
 * read back → clean up only what it created. Run AFTER apply_phase3_migration.
 *   node_modules/.bin/tsx scripts/smoke_phase3.mts
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
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } },
);

function die(label: string, e: unknown): never {
  console.error(`✗ ${label} —`, (e as { message?: string })?.message ?? JSON.stringify(e));
  process.exit(1);
}

const { data: cat, error: e0 } = await sb
  .from("assessments_catalog")
  .insert({
    name: { en: "SMOKE Phase3" },
    primary_language: "en",
    supported_languages: ["en"],
    assessment_type: "custom",
    creation_method: "manual",
    status: "draft",
    scoring_strategy: "first_match",
  })
  .select("id,scoring_strategy")
  .single();
if (e0 || !cat) die("insert catalog (scoring_strategy)", e0);
console.log("✓ catalog + scoring_strategy:", cat.scoring_strategy);

const { data: profile, error: e1 } = await sb
  .from("result_profiles")
  .insert({
    catalog_id: cat.id,
    code: "LEADER",
    name: { en: "Leader" },
    description: { en: "Leads" },
    category_code: "LEAD",
    recommended_majors: { en: ["Business"] },
    recommended_careers: { en: ["PM"] },
    strengths: { en: ["vision"] },
    development_areas: { en: ["patience"] },
    is_fallback: false,
  })
  .select("id,code,category_code,recommended_majors")
  .single();
if (e1 || !profile) die("insert result_profile (rich cols)", e1);
console.log("✓ result_profiles.code path works:", profile.code, profile.category_code);

const { error: e2 } = await sb.from("result_rules").insert({
  catalog_id: cat.id,
  result_profile_id: profile.id,
  combinator: "AND",
  conditions: [{ cluster: "LEAD", operator: ">=", value: 3 }],
  priority: 1,
});
if (e2) die("insert result_rule", e2);

const { error: e3 } = await sb.from("scoring_specs").insert({
  catalog_id: cat.id,
  source: "manual",
  version: 1,
  spec_json: { version: 1, strategy: "first_match", clusters: [], profiles: [], rules: [] },
  is_current: true,
});
if (e3) die("insert scoring_spec (is_current)", e3);

// Read back exactly as the app does (the failing select).
const { data: readback, error: e4 } = await sb
  .from("result_profiles")
  .select("id,code,name,description,category_code,recommended_majors,recommended_careers,strengths,development_areas,is_fallback,display_order")
  .eq("catalog_id", cat.id);
if (e4) die("read back (listResultProfiles select)", e4);
console.log("✓ listResultProfiles select works:", readback?.length, "row(s)");

// Cleanup (cascades remove rules; explicit for clarity).
await sb.from("result_rules").delete().eq("catalog_id", cat.id);
await sb.from("scoring_specs").delete().eq("catalog_id", cat.id);
await sb.from("result_profiles").delete().eq("catalog_id", cat.id);
await sb.from("assessments_catalog").delete().eq("id", cat.id);
console.log("\n✅ Phase 3/4 data path verified via the app's client; test rows removed.");
