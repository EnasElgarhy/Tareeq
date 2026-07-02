/**
 * End-to-end smoke of the Manual Builder DATA PATH — uses the exact client the
 * server actions use (supabase-js + SERVICE_ROLE_KEY → PostgREST), so it proves
 * createAssessment → addCategory → addCustomQuestion → read all work post-migration.
 * Creates rows, reads them back, then deletes ONLY what it created.
 *   node_modules/.bin/tsx scripts/smoke_manual_builder.mts
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

function die(label: string, error: unknown): never {
  console.error(`✗ ${label} —`, (error as { message?: string })?.message ?? JSON.stringify(error));
  process.exit(1);
}

// 1) createAssessment → catalog + linked version
const { data: cat, error: e1 } = await sb
  .from("assessments_catalog")
  .insert({
    name: { en: "SMOKE Manual Builder" },
    primary_language: "en",
    supported_languages: ["en", "ar"],
    assessment_type: "custom",
    creation_method: "manual",
    status: "draft",
  })
  .select("id")
  .single();
if (e1 || !cat) die("insert assessments_catalog", e1);
const { data: ver, error: e2 } = await sb
  .from("content_versions")
  .insert({ label: "SMOKE Manual Builder", is_active: false, notes: "custom · manual", catalog_id: cat.id })
  .select("id")
  .single();
if (e2 || !ver) die("insert content_versions (catalog_id)", e2);
console.log("✓ createAssessment: catalog + version linked");

// 2) addAssessmentCategory
const { data: category, error: e3 } = await sb
  .from("assessment_categories")
  .insert({ catalog_id: cat.id, code: "LEAD", name: { en: "Leadership", ar: "القيادة" } })
  .select("id")
  .single();
if (e3 || !category) die("insert assessment_categories", e3);
console.log("✓ addAssessmentCategory: LEAD");

// 3) addCustomQuestion → question + bilingual options w/ category + points
const { data: q, error: e4 } = await sb
  .from("questions")
  .insert({
    version_id: ver.id,
    external_id: "Q-smoke01",
    pillar: 1,
    position: 0,
    kind: "single",
    title: { en: "What energizes you?", ar: "ما الذي يحفزك؟" },
    axis: null,
  })
  .select("id")
  .single();
if (e4 || !q) die("insert questions", e4);
const { error: e5 } = await sb.from("question_options").insert([
  { question_id: q.id, letter: "A", position: 0, text: { en: "Leading a team", ar: "قيادة فريق" }, category_code: "LEAD", weight: 2, cluster_code: null, driver_code: null, axis_value: null },
  { question_id: q.id, letter: "B", position: 1, text: { en: "Analysing data", ar: "تحليل البيانات" }, category_code: null, weight: 1, cluster_code: null, driver_code: null, axis_value: null },
]);
if (e5) die("insert question_options (category_code + weight)", e5);
console.log("✓ addCustomQuestion: bilingual question + 2 scored answers");

// 4) read back (listCustomQuestions shape)
const { data: readback, error: e6 } = await sb
  .from("questions")
  .select("external_id,title,question_options(letter,text,category_code,weight)")
  .eq("version_id", ver.id)
  .single();
if (e6) die("read back", e6);
console.log("✓ read back:", JSON.stringify(readback));

// 5) cleanup — only the rows this script created (child → parent)
await sb.from("question_options").delete().eq("question_id", q.id);
await sb.from("questions").delete().eq("id", q.id);
await sb.from("assessment_categories").delete().eq("id", category.id);
await sb.from("content_versions").delete().eq("id", ver.id);
await sb.from("assessments_catalog").delete().eq("id", cat.id);
console.log("✓ cleaned up test rows");
console.log("\n✅ Manual Builder data path works end-to-end via the app's client.");
