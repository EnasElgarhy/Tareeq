import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { clusters, contentVersion, seedQuestions } from "../lib/content/seed";
import { AR_CONTENT } from "../lib/content/translations-ar";

type SupabaseQuestion = {
  id: string;
  external_id: string;
};

function loadEnvFile(path: string) {
  const fullPath = resolve(path);
  if (!existsSync(fullPath)) return;

  const content = readFileSync(fullPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function expectedOptionCount() {
  return seedQuestions.reduce(
    (total, question) => total + question.options.length,
    0,
  );
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const supabaseUrl =
    process.env.SUPABASE_URL ?? requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error: clustersError } = await supabase.from("clusters").upsert(
    clusters.map((cluster) => ({
      code: cluster.code,
      name: cluster.name,
      description: cluster.description,
      display_order: cluster.displayOrder,
    })),
    { onConflict: "code" },
  );
  if (clustersError) throw clustersError;

  const { data: existingVersions, error: existingVersionError } = await supabase
    .from("content_versions")
    .select("id")
    .eq("label", contentVersion.label)
    .limit(1);
  if (existingVersionError) throw existingVersionError;

  let versionId = existingVersions?.[0]?.id as string | undefined;

  if (!versionId) {
    const { data, error } = await supabase
      .from("content_versions")
      .insert({
        label: contentVersion.label,
        is_active: true,
        notes: contentVersion.notes,
      })
      .select("id")
      .single();
    if (error) throw error;
    versionId = data.id;
  }

  const { error: deactivateError } = await supabase
    .from("content_versions")
    .update({ is_active: false })
    .neq("id", versionId);
  if (deactivateError) throw deactivateError;

  const { error: activateError } = await supabase
    .from("content_versions")
    .update({
      is_active: true,
      notes: contentVersion.notes,
    })
    .eq("id", versionId);
  if (activateError) throw activateError;

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .upsert(
      seedQuestions.map((question) => {
        const ar = AR_CONTENT[question.externalId];
        return {
          version_id: versionId,
          external_id: question.externalId,
          pillar: question.pillar,
          position: question.position,
          kind: question.kind,
          title: ar?.title
            ? { ...question.title, ar: ar.title }
            : question.title,
          axis: "axis" in question ? question.axis : null,
        };
      }),
      { onConflict: "version_id,external_id" },
    )
    .select("id, external_id");
  if (questionsError) throw questionsError;

  const questionByExternalId = new Map(
    (questions as SupabaseQuestion[]).map((question) => [
      question.external_id,
      question.id,
    ]),
  );

  const optionRows = seedQuestions.flatMap((question) => {
    const questionId = questionByExternalId.get(question.externalId);
    if (!questionId) {
      throw new Error(
        `Missing inserted question id for ${question.externalId}`,
      );
    }

    const arOptions = AR_CONTENT[question.externalId]?.options;

    return question.options.map((option) => {
      const arText = arOptions?.[option.letter];
      return {
        question_id: questionId,
        letter: option.letter,
        position: option.position,
        text: arText ? { ...option.text, ar: arText } : option.text,
        cluster_code: "clusterCode" in option ? option.clusterCode : null,
        driver_code: "driverCode" in option ? option.driverCode : null,
        axis_value: "axisValue" in option ? option.axisValue : null,
      };
    });
  });

  if (optionRows.length > 0) {
    const { error: optionsError } = await supabase
      .from("question_options")
      .upsert(optionRows, { onConflict: "question_id,letter" });
    if (optionsError) throw optionsError;
  }

  const { count: questionCount, error: questionCountError } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("version_id", versionId);
  if (questionCountError) throw questionCountError;

  const { count: optionCount, error: optionCountError } = await supabase
    .from("question_options")
    .select("id", { count: "exact", head: true })
    .in("question_id", Array.from(questionByExternalId.values()));
  if (optionCountError) throw optionCountError;

  console.log(`Seeded content version ${contentVersion.label}: ${versionId}`);
  console.log(`questions: ${questionCount} / ${seedQuestions.length}`);
  console.log(`question_options: ${optionCount} / ${expectedOptionCount()}`);

  if (
    questionCount !== seedQuestions.length ||
    optionCount !== expectedOptionCount()
  ) {
    throw new Error("Seed verification counts did not match expected values.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
