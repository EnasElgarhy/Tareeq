/**
 * Seed sample assessment responses so the admin Responses view has data to show.
 * Idempotent: clears prior samples (anon_session_id like 'sample-resp-%') then
 * re-inserts. Answers are generated to lean toward each persona's cluster/driver
 * from the live question set; the result is a representative CompassResult-shaped
 * payload (the fields the admin Responses UI renders).
 *
 * Self-contained on purpose — it does not import the app's scoring engine, so it
 * runs under tsx without ESM/alias resolution issues.
 *
 *   node_modules/.bin/tsx scripts/seed_sample_responses.mts
 * Remove with: node_modules/.bin/tsx scripts/clear_sample_responses.mts
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

const SAMPLE_PREFIX = "sample-resp-";

const DRIVER_NAMES: Record<string, string> = {
  REC: "Recognition",
  IMP: "Impact",
  AUT: "Autonomy",
  MAS: "Mastery",
  STA: "Stability",
};

interface Persona {
  name: string;
  email: string;
  cluster: string;
  rankedClusters: [string, number][];
  driver: string;
  secondaryDriver: string;
  archetype: string;
  ecosystem: string;
  confidenceLabel: string;
  confidencePercentage: number;
  axes: string[];
  complete: boolean;
}

const PERSONAS: Persona[] = [
  {
    name: "Layla Hassan",
    email: "layla@sample.tareeq",
    cluster: "TECH",
    rankedClusters: [["TECH", 6], ["SCI", 3], ["ENG", 2]],
    driver: "MAS",
    secondaryDriver: "AUT",
    archetype: "Precisionist",
    ecosystem: "Solo Specialist",
    confidenceLabel: "High",
    confidencePercentage: 82,
    axes: ["STRUCT", "DEEP", "IND", "DYN"],
    complete: true,
  },
  {
    name: "Omar Khaled",
    email: "omar@sample.tareeq",
    cluster: "BUS",
    rankedClusters: [["BUS", 5], ["PPL", 4], ["LAW", 2]],
    driver: "REC",
    secondaryDriver: "IMP",
    archetype: "Catalyst",
    ecosystem: "High-Energy Team Player",
    confidenceLabel: "Moderate",
    confidencePercentage: 64,
    axes: ["FLEX", "BROAD", "COL", "DYN"],
    complete: true,
  },
  {
    name: "Sara Ibrahim",
    email: "sara@sample.tareeq",
    cluster: "ART",
    rankedClusters: [["ART", 6], ["PPL", 2], ["BUS", 1]],
    driver: "AUT",
    secondaryDriver: "MAS",
    archetype: "Explorer",
    ecosystem: "Solo Sprinter",
    confidenceLabel: "High",
    confidencePercentage: 78,
    axes: ["FLEX", "DEEP", "IND", "PRE"],
    complete: true,
  },
  {
    name: "Youssef Adel",
    email: "youssef@sample.tareeq",
    cluster: "SCI",
    rankedClusters: [["SCI", 5], ["TECH", 4], ["ENV", 2]],
    driver: "IMP",
    secondaryDriver: "MAS",
    archetype: "Coordinator",
    ecosystem: "Structured Team Player",
    confidenceLabel: "High",
    confidencePercentage: 80,
    axes: ["STRUCT", "DEEP", "COL", "PRE"],
    complete: true,
  },
  {
    name: "Nour Mostafa",
    email: "nour@sample.tareeq",
    cluster: "PPL",
    rankedClusters: [],
    driver: "IMP",
    secondaryDriver: "REC",
    archetype: "Adaptive",
    ecosystem: "High-Energy Team Player",
    confidenceLabel: "Low",
    confidencePercentage: 0,
    axes: ["FLEX", "BROAD", "COL", "DYN"],
    complete: false,
  },
];

interface DbOption {
  letter: string;
  position: number;
  cluster_code: string | null;
  driver_code: string | null;
  axis_value: string | null;
}
interface DbQuestion {
  external_id: string;
  pillar: number;
  kind: string;
  question_options: DbOption[];
}

function buildResult(p: Persona) {
  return {
    topCluster: p.cluster,
    clusterRanked: p.rankedClusters,
    archetype: p.archetype,
    primaryDriver: p.driver,
    secondaryDriver: p.secondaryDriver,
    driverNames: DRIVER_NAMES,
    ecosystemFit: p.ecosystem,
    confidenceLabel: p.confidenceLabel,
    confidencePercentage: p.confidencePercentage,
    source: "sample-seed",
  };
}

function answersFor(
  questions: DbQuestion[],
  p: Persona,
  limit?: number,
): Record<string, string> {
  const answers: Record<string, string> = {};
  const subset = limit ? questions.slice(0, limit) : questions;
  for (const q of subset) {
    if (q.kind === "text") {
      answers[q.external_id] = "Sample free-text answer.";
      continue;
    }
    const opts = [...q.question_options].sort((a, b) => a.position - b.position);
    let opt =
      q.pillar === 1
        ? opts.find((o) => o.cluster_code === p.cluster)
        : q.pillar === 3
          ? opts.find((o) => o.driver_code === p.driver)
          : q.pillar === 2 || q.pillar === 4
            ? opts.find((o) => p.axes.includes(String(o.axis_value)))
            : undefined;
    opt = opt ?? opts[0];
    if (opt) answers[q.external_id] = opt.letter;
  }
  return answers;
}

async function main() {
  // Target the most substantive assessment (most questions) so the sample runs
  // exercise a full, multi-pillar answer set — not a 1-question draft.
  const { data: versions, error: vErr } = await sb
    .from("content_versions")
    .select("id,label,is_active");
  if (vErr) throw new Error(vErr.message);
  if (!versions?.length) {
    throw new Error("No content_versions found — seed the DB first.");
  }
  const { data: allQ, error: cErr } = await sb.from("questions").select("version_id");
  if (cErr) throw new Error(cErr.message);
  const counts = new Map<string, number>();
  for (const q of allQ ?? []) {
    const id = (q as { version_id: string }).version_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const version = [...versions].sort(
    (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0),
  )[0];
  console.log(
    `Using version "${version.label}" (${version.id}) — ${counts.get(version.id) ?? 0} questions`,
  );

  const { data: qrows, error: qErr } = await sb
    .from("questions")
    .select(
      "external_id,pillar,kind,question_options(letter,position,cluster_code,driver_code,axis_value)",
    )
    .eq("version_id", version.id)
    .order("pillar")
    .order("position");
  if (qErr) throw new Error(qErr.message);
  const questions = (qrows ?? []) as DbQuestion[];
  console.log(`Loaded ${questions.length} questions`);

  const { error: delErr } = await sb
    .from("assessments")
    .delete()
    .like("anon_session_id", `${SAMPLE_PREFIX}%`);
  if (delErr) throw new Error(delErr.message);

  const now = Date.now();
  const rows = PERSONAS.map((p, i) => {
    const startedAt = new Date(now - (i + 1) * 36e5 * 6).toISOString();
    const base = {
      version_id: version.id,
      user_id: null,
      anon_session_id: `${SAMPLE_PREFIX}${i + 1}`,
      locale: "en",
      started_at: startedAt,
      respondent_name: p.name,
      respondent_email: p.email,
    };
    if (!p.complete) {
      return {
        ...base,
        completed_at: null,
        answers: answersFor(questions, p, 12),
        result: null,
      };
    }
    return {
      ...base,
      completed_at: new Date(now - (i + 1) * 36e5 * 5).toISOString(),
      answers: answersFor(questions, p),
      result: buildResult(p),
    };
  });

  const { error: insErr } = await sb.from("assessments").insert(rows);
  if (insErr) throw new Error(insErr.message);

  console.log(`\n✓ Inserted ${rows.length} sample responses:`);
  for (const p of PERSONAS) {
    console.log(
      `  · ${p.name} (${p.cluster})${p.complete ? "" : " — in progress"}`,
    );
  }
  console.log("\nOpen /admin/responses to view them.");
}

main().catch((e) => {
  console.error("✗ seed failed —", (e as Error).message);
  process.exit(1);
});
