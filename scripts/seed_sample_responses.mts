/**
 * Seed sample assessment responses so the admin Responses view has data to show.
 * Idempotent: clears prior samples (anon_session_id like 'sample-resp-%') then
 * re-inserts. Answers are generated to lean toward each persona's cluster/driver
 * and scored with the REAL engine (computeScore), so results are faithful.
 *
 *   node_modules/.bin/tsx scripts/seed_sample_responses.mts
 *
 * Remove with: node_modules/.bin/tsx scripts/clear_sample_responses.mts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { computeScore } from "../lib/scoring/index";
import type { Question } from "../lib/scoring/types";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(url, svc, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SAMPLE_PREFIX = "sample-resp-";

interface Persona {
  name: string;
  email: string;
  cluster: string;
  driver: string;
  axes: string[];
  complete: boolean;
}

const PERSONAS: Persona[] = [
  { name: "Layla Hassan", email: "layla@sample.tareeq", cluster: "TECH", driver: "MAS", axes: ["STRUCT", "DEEP", "IND", "DYN"], complete: true },
  { name: "Omar Khaled", email: "omar@sample.tareeq", cluster: "BUS", driver: "REC", axes: ["FLEX", "BROAD", "COL", "DYN"], complete: true },
  { name: "Sara Ibrahim", email: "sara@sample.tareeq", cluster: "ART", driver: "AUT", axes: ["FLEX", "DEEP", "IND", "PRE"], complete: true },
  { name: "Youssef Adel", email: "youssef@sample.tareeq", cluster: "SCI", driver: "IMP", axes: ["STRUCT", "DEEP", "COL", "PRE"], complete: true },
  { name: "Nour Mostafa", email: "nour@sample.tareeq", cluster: "PPL", driver: "IMP", axes: ["FLEX", "BROAD", "COL", "DYN"], complete: false },
];

async function main() {
  // 1. Resolve the active content version (the live CORE assessment).
  const { data: versions, error: vErr } = await sb
    .from("content_versions")
    .select("id,label,is_active")
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);
  if (vErr) throw new Error(vErr.message);
  const version = versions?.[0];
  if (!version) throw new Error("No content_versions found — seed the DB first.");
  console.log(`Using version "${version.label}" (${version.id})`);

  // 2. Load its questions + options and map to the engine shape.
  const { data: qrows, error: qErr } = await sb
    .from("questions")
    .select(
      "external_id,pillar,position,kind,title,axis,question_options(letter,position,text,cluster_code,driver_code,axis_value)",
    )
    .eq("version_id", version.id)
    .order("pillar")
    .order("position");
  if (qErr) throw new Error(qErr.message);

  const questions: Question[] = (qrows ?? []).map((q) => {
    const row = q as {
      external_id: string;
      pillar: number;
      position: number;
      kind: string;
      title: Record<string, string>;
      axis: string | null;
      question_options: {
        letter: string;
        position: number;
        text: Record<string, string>;
        cluster_code: string | null;
        driver_code: string | null;
        axis_value: string | null;
      }[];
    };
    return {
      externalId: row.external_id,
      pillar: row.pillar as Question["pillar"],
      position: row.position,
      kind: row.kind as Question["kind"],
      title: row.title,
      axis: (row.axis ?? undefined) as Question["axis"],
      options: (row.question_options ?? [])
        .sort((a, b) => a.position - b.position)
        .map((o) => ({
          letter: o.letter,
          position: o.position,
          text: o.text,
          clusterCode: (o.cluster_code ?? undefined) as never,
          driverCode: (o.driver_code ?? undefined) as never,
          axisValue: (o.axis_value ?? undefined) as never,
        })),
    };
  });
  console.log(`Loaded ${questions.length} questions`);

  // 3. Generate persona-leaning answers (always a valid letter; falls back to
  //    the first option so every question is answered and the engine runs).
  function answersFor(p: Persona, limit?: number): Record<string, string> {
    const answers: Record<string, string> = {};
    const subset = limit ? questions.slice(0, limit) : questions;
    for (const q of subset) {
      if (q.kind === "text") {
        answers[q.externalId] = "Sample free-text answer.";
        continue;
      }
      let opt =
        q.pillar === 1
          ? q.options.find((o) => o.clusterCode === p.cluster)
          : q.pillar === 3
            ? q.options.find((o) => o.driverCode === p.driver)
            : q.pillar === 2 || q.pillar === 4
              ? q.options.find((o) => p.axes.includes(String(o.axisValue)))
              : undefined;
      opt = opt ?? q.options[0];
      if (opt) answers[q.externalId] = opt.letter;
    }
    return answers;
  }

  // 4. Clear prior samples, then insert fresh.
  const { error: delErr } = await sb
    .from("assessments")
    .delete()
    .like("anon_session_id", `${SAMPLE_PREFIX}%`);
  if (delErr) throw new Error(delErr.message);

  const now = Date.now();
  const rows = PERSONAS.map((p, i) => {
    const startedAt = new Date(now - (i + 1) * 36e5 * 6).toISOString();
    if (!p.complete) {
      // In-progress: only the first 12 questions answered, no result.
      return {
        version_id: version.id,
        user_id: null,
        anon_session_id: `${SAMPLE_PREFIX}${i + 1}`,
        locale: "en",
        started_at: startedAt,
        completed_at: null,
        answers: answersFor(p, 12),
        result: null,
        respondent_name: p.name,
        respondent_email: p.email,
      };
    }
    const answers = answersFor(p);
    const result = computeScore(answers, questions);
    return {
      version_id: version.id,
      user_id: null,
      anon_session_id: `${SAMPLE_PREFIX}${i + 1}`,
      locale: "en",
      started_at: startedAt,
      completed_at: new Date(now - (i + 1) * 36e5 * 5).toISOString(),
      answers,
      result,
      respondent_name: p.name,
      respondent_email: p.email,
    };
  });

  const { error: insErr } = await sb.from("assessments").insert(rows);
  if (insErr) throw new Error(insErr.message);

  console.log(`\n✓ Inserted ${rows.length} sample responses:`);
  for (const p of PERSONAS) {
    console.log(`  · ${p.name} (${p.cluster})${p.complete ? "" : " — in progress"}`);
  }
  console.log("\nOpen /admin/responses to view them.");
}

main().catch((e) => {
  console.error("✗ seed failed —", (e as Error).message);
  process.exit(1);
});
