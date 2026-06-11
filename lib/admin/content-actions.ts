"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { typeHasOptions } from "@/lib/admin/content";
import { normalizeKind, parseCsvRecords } from "@/lib/admin/csv";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const localizedSchema = z.record(z.string(), z.string());

const optionInputSchema = z.object({
  letter: z.string().trim().min(1).max(4),
  text: localizedSchema,
  cluster_code: z.string().nullable(),
  driver_code: z.string().nullable(),
  axis_value: z.string().nullable(),
});

const saveQuestionSchema = z.object({
  kind: z.string().trim().min(1),
  title: localizedSchema,
  axis: z.string().nullable(),
  options: z.array(optionInputSchema).max(12),
});

export type SaveQuestionInput = z.infer<typeof saveQuestionSchema>;

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

/** Throws unless the version exists and is a draft (active versions are read-only). */
async function assertDraft(sb: AdminClient, versionId: string): Promise<void> {
  const { data, error } = await sb
    .from("content_versions")
    .select("is_active")
    .eq("id", versionId)
    .single();
  if (error || !data) throw new Error("Version not found");
  if (data.is_active)
    throw new Error(
      "The active version is read-only — clone it to a draft to edit.",
    );
}

/** Validate option cluster codes against the cluster table + letter uniqueness. */
async function validateOptions(
  sb: AdminClient,
  options: { letter: string; cluster_code: string | null }[],
): Promise<void> {
  const { data: clusters } = await sb.from("clusters").select("code");
  const valid = new Set((clusters ?? []).map((c) => c.code as string));
  for (const o of options) {
    if (o.cluster_code && !valid.has(o.cluster_code))
      throw new Error(`Unknown cluster code: ${o.cluster_code}`);
  }
  const letters = options.map((o) => o.letter);
  if (new Set(letters).size !== letters.length)
    throw new Error("Answer keys must be unique within a question");
}

interface SourceOption {
  letter: string;
  position: number;
  text: Record<string, string>;
  cluster_code: string | null;
  driver_code: string | null;
  axis_value: string | null;
}
interface SourceQuestion {
  external_id: string;
  pillar: number;
  position: number;
  kind: string;
  title: Record<string, string>;
  axis: string | null;
  question_options: SourceOption[];
}

/**
 * Clone a version (and all its questions + options) into a new editable draft.
 * Returns the new version id. external_id is unique per-version, so the clone
 * keeps the same external ids under a fresh version_id.
 */
export async function createDraftFromVersion(
  sourceVersionId: string,
): Promise<string> {
  const admin = await requireAdmin();
  const sb = createSupabaseAdminClient();

  const { data: src, error: e1 } = await sb
    .from("content_versions")
    .select("label")
    .eq("id", sourceVersionId)
    .single();
  if (e1 || !src) throw new Error(e1?.message ?? "Source version not found");

  const { data: nv, error: e2 } = await sb
    .from("content_versions")
    .insert({
      label: `${src.label} (draft)`,
      is_active: false,
      notes: `Cloned from ${src.label}`,
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (e2 || !nv) throw new Error(e2?.message ?? "Could not create draft");

  const { data: qs, error: e3 } = await sb
    .from("questions")
    .select(
      "external_id,pillar,position,kind,title,axis,question_options(letter,position,text,cluster_code,driver_code,axis_value)",
    )
    .eq("version_id", sourceVersionId);
  if (e3) throw new Error(e3.message);

  const sourceQuestions = (qs ?? []) as unknown as SourceQuestion[];
  if (sourceQuestions.length > 0) {
    const { data: insertedQs, error: e4 } = await sb
      .from("questions")
      .insert(
        sourceQuestions.map((q) => ({
          version_id: nv.id,
          external_id: q.external_id,
          pillar: q.pillar,
          position: q.position,
          kind: q.kind,
          title: q.title,
          axis: q.axis,
        })),
      )
      .select("id,external_id");
    if (e4 || !insertedQs)
      throw new Error(e4?.message ?? "Could not clone questions");

    const idByExt = new Map(
      insertedQs.map((r) => [r.external_id as string, r.id as string]),
    );
    const options = sourceQuestions.flatMap((q) => {
      const qid = idByExt.get(q.external_id);
      if (!qid) return [];
      return (q.question_options ?? []).map((o) => ({
        question_id: qid,
        letter: o.letter,
        position: o.position,
        text: o.text,
        cluster_code: o.cluster_code,
        driver_code: o.driver_code,
        axis_value: o.axis_value,
      }));
    });
    if (options.length > 0) {
      const { error: e5 } = await sb.from("question_options").insert(options);
      if (e5) throw new Error(e5.message);
    }
  }

  revalidatePath("/admin/content");
  return nv.id;
}

/**
 * Make a version the single active one.
 *
 * Two-step flip — admin-only / low-concurrency, and harmless today because the
 * public app doesn't read is_active from the DB yet. When the app reads content
 * from the DB (Phase 3) this should become a transactional RPC
 * (`update content_versions set is_active = (id = vid)`).
 */
export async function publishVersion(versionId: string): Promise<void> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();

  const { error: deactivate } = await sb
    .from("content_versions")
    .update({ is_active: false })
    .neq("id", versionId);
  if (deactivate) throw new Error(deactivate.message);

  const { error: activate } = await sb
    .from("content_versions")
    .update({ is_active: true })
    .eq("id", versionId);
  if (activate) throw new Error(activate.message);

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${versionId}`);
}

/** Delete a draft (cascades to its questions + options). Refuses the active one. */
export async function deleteDraftVersion(versionId: string): Promise<void> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();

  const { data: v, error: e1 } = await sb
    .from("content_versions")
    .select("is_active")
    .eq("id", versionId)
    .single();
  if (e1 || !v) throw new Error(e1?.message ?? "Version not found");
  if (v.is_active)
    throw new Error("Can't delete the active version — publish another first.");

  const { error: e2 } = await sb
    .from("content_versions")
    .delete()
    .eq("id", versionId);
  if (e2) throw new Error(e2.message);

  revalidatePath("/admin/content");
}

/**
 * Save a question's title + options (draft only). Options are replaced
 * wholesale — safe because a draft is never referenced by an assessment.
 */
export async function saveQuestion(
  versionId: string,
  questionId: string,
  rawInput: unknown,
): Promise<void> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();
  await assertDraft(sb, versionId);

  const { data: q, error: qe } = await sb
    .from("questions")
    .select("id,version_id")
    .eq("id", questionId)
    .single();
  if (qe || !q) throw new Error("Question not found");
  if (q.version_id !== versionId)
    throw new Error("Question does not belong to this version");

  const parsed = saveQuestionSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new Error(
      "Invalid question data: " +
        parsed.error.issues.map((i) => i.message).join(", "),
    );
  }
  const input = parsed.data;

  await validateOptions(sb, input.options);

  const { error: uq } = await sb
    .from("questions")
    .update({ kind: input.kind, title: input.title, axis: input.axis })
    .eq("id", questionId);
  if (uq) throw new Error(uq.message);

  const { error: del } = await sb
    .from("question_options")
    .delete()
    .eq("question_id", questionId);
  if (del) throw new Error(del.message);

  if (input.options.length > 0) {
    const { error: ins } = await sb.from("question_options").insert(
      input.options.map((o, i) => ({
        question_id: questionId,
        letter: o.letter,
        position: i,
        text: o.text,
        cluster_code: o.cluster_code,
        driver_code: o.driver_code,
        axis_value: o.axis_value,
      })),
    );
    if (ins) throw new Error(ins.message);
  }

  revalidatePath(`/admin/content/${versionId}`);
}

/** Create a new, empty draft assessment version. Returns the new id. */
export async function createBlankVersion(rawLabel: unknown): Promise<string> {
  const admin = await requireAdmin();
  const label = z.string().trim().min(1).max(80).parse(rawLabel);
  const sb = createSupabaseAdminClient();

  const { data, error } = await sb
    .from("content_versions")
    .insert({
      label,
      is_active: false,
      notes: "Created in CMS",
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create");

  revalidatePath("/admin/content");
  return data.id;
}

/** Rename a version's label (cosmetic metadata — allowed on any version). */
export async function renameVersion(
  versionId: string,
  rawLabel: unknown,
): Promise<void> {
  await requireAdmin();
  const label = z.string().trim().min(1).max(80).parse(rawLabel);
  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("content_versions")
    .update({ label })
    .eq("id", versionId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${versionId}`);
}

const addQuestionSchema = z.object({
  pillar: z.coerce.number().int().min(0).max(4),
  kind: z.string().trim().min(1).default("single"),
  title: z.string().trim().min(1),
  options: z.array(optionInputSchema).max(12).default([]),
});

/** Add a question (with its answers) to a draft, at the end of its pillar. */
export async function addQuestion(
  versionId: string,
  rawInput: unknown,
): Promise<string> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();
  await assertDraft(sb, versionId);

  const input = addQuestionSchema.parse(rawInput);

  const { data: tail } = await sb
    .from("questions")
    .select("position")
    .eq("version_id", versionId)
    .eq("pillar", input.pillar)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = (tail?.[0]?.position ?? -1) + 1;

  const { data, error } = await sb
    .from("questions")
    .insert({
      version_id: versionId,
      external_id: `Q-${randomUUID().slice(0, 8)}`,
      pillar: input.pillar,
      position: nextPos,
      kind: input.kind,
      title: { en: input.title },
      axis: null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not add");

  if (input.options.length > 0) {
    await validateOptions(sb, input.options);
    const { error: optErr } = await sb.from("question_options").insert(
      input.options.map((o, i) => ({
        question_id: data.id,
        letter: o.letter,
        position: i,
        text: o.text,
        cluster_code: o.cluster_code,
        driver_code: o.driver_code,
        axis_value: o.axis_value,
      })),
    );
    if (optErr) throw new Error(optErr.message);
  }

  revalidatePath(`/admin/content/${versionId}`);
  return data.id;
}

/** Delete a question (draft only; cascades its options). */
export async function deleteQuestion(
  versionId: string,
  questionId: string,
): Promise<void> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();
  await assertDraft(sb, versionId);

  const { data: q, error: qe } = await sb
    .from("questions")
    .select("version_id")
    .eq("id", questionId)
    .single();
  if (qe || !q) throw new Error("Question not found");
  if (q.version_id !== versionId)
    throw new Error("Question does not belong to this version");

  const { error } = await sb.from("questions").delete().eq("id", questionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/content/${versionId}`);
}

const clusterSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(600),
});

/** Update a cluster's name + description (global reference data). */
export async function updateCluster(
  code: string,
  rawInput: unknown,
): Promise<void> {
  await requireAdmin();
  const input = clusterSchema.parse(rawInput);
  const sb = createSupabaseAdminClient();

  const { error } = await sb
    .from("clusters")
    .update({ name: input.name, description: input.description })
    .eq("code", code);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/content");
}

/** Move a question up/down within its pillar (draft only), swapping positions. */
export async function moveQuestion(
  versionId: string,
  questionId: string,
  dir: "up" | "down",
): Promise<void> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();
  await assertDraft(sb, versionId);

  const { data: q, error: qe } = await sb
    .from("questions")
    .select("id,pillar,version_id")
    .eq("id", questionId)
    .single();
  if (qe || !q) throw new Error("Question not found");
  if (q.version_id !== versionId)
    throw new Error("Question does not belong to this version");

  const { data: list } = await sb
    .from("questions")
    .select("id,position")
    .eq("version_id", versionId)
    .eq("pillar", q.pillar)
    .order("position", { ascending: true });
  const items = list ?? [];
  const idx = items.findIndex((x) => x.id === questionId);
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return;

  const a = items[idx];
  const b = items[swapIdx];
  await sb.from("questions").update({ position: b.position }).eq("id", a.id);
  await sb.from("questions").update({ position: a.position }).eq("id", b.id);

  revalidatePath(`/admin/content/${versionId}`);
}

export interface ImportResult {
  ok: boolean;
  questionsImported: number;
  optionsImported: number;
  errors: string[];
}

interface BuiltOption {
  letter: string;
  text: Record<string, string>;
  cluster_code: string | null;
  driver_code: string | null;
  axis_value: string | null;
}
interface BuiltQuestion {
  pillar: number;
  kind: string;
  title: string;
  axis: string | null;
  options: BuiltOption[];
}

/**
 * Bulk-import questions into a draft from CSV (one row per answer, grouped by
 * question_key). Validates everything first — nothing is inserted if any row
 * is invalid — then reports a clear summary or row-level errors.
 */
export async function importQuestionsCsv(
  versionId: string,
  csvText: string,
): Promise<ImportResult> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();
  await assertDraft(sb, versionId);

  const empty = { questionsImported: 0, optionsImported: 0 };
  const records = parseCsvRecords(csvText);
  if (records.length === 0)
    return { ok: false, ...empty, errors: ["The file has no data rows."] };

  const required = ["question_key", "pillar", "type", "title"];
  const headerKeys = Object.keys(records[0]);
  const missing = required.filter((h) => !headerKeys.includes(h));
  if (missing.length > 0)
    return {
      ok: false,
      ...empty,
      errors: [
        `Missing column(s): ${missing.join(", ")}. Download the template and keep the header row.`,
      ],
    };

  const { data: clustersData } = await sb.from("clusters").select("code");
  const validClusters = new Set(
    (clustersData ?? []).map((c) => c.code as string),
  );

  // Group rows by question_key, preserving first-seen order.
  const order: string[] = [];
  const groups = new Map<string, Record<string, string>[]>();
  records.forEach((r, idx) => {
    const key = r.question_key || `__row${idx}`;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)?.push(r);
  });

  const errors: string[] = [];
  const built: BuiltQuestion[] = [];

  for (const key of order) {
    const rows = groups.get(key) ?? [];
    const first = rows[0];
    const label = `Question "${key}"`;

    const pillar = Number(first.pillar);
    if (!Number.isInteger(pillar) || pillar < 0 || pillar > 4) {
      errors.push(`${label}: pillar must be a number 0–4 (got "${first.pillar}").`);
      continue;
    }
    const kind = normalizeKind(first.type);
    if (!kind) {
      errors.push(
        `${label}: unknown type "${first.type}". Use single, binary, select, or text.`,
      );
      continue;
    }
    const title = first.title.trim();
    if (!title) {
      errors.push(`${label}: title is required.`);
      continue;
    }
    const axis = first.axis?.trim() ? first.axis.trim() : null;

    let options: BuiltOption[] = [];
    if (typeHasOptions(kind)) {
      options = rows
        .filter((r) => r.answer_key?.trim() || r.answer_text?.trim())
        .map((r) => ({
          letter: r.answer_key?.trim() || "",
          text: { en: r.answer_text?.trim() || "" },
          cluster_code: r.cluster?.trim() ? r.cluster.trim().toUpperCase() : null,
          driver_code: r.driver?.trim() ? r.driver.trim() : null,
          axis_value: r.axis_value?.trim() ? r.axis_value.trim() : null,
        }));
      for (const o of options) {
        if (!o.letter) errors.push(`${label}: an answer is missing its key (A/B/C…).`);
        if (o.cluster_code && !validClusters.has(o.cluster_code))
          errors.push(`${label}: unknown cluster "${o.cluster_code}".`);
      }
      const letters = options.map((o) => o.letter);
      if (new Set(letters).size !== letters.length)
        errors.push(`${label}: answer keys must be unique.`);
      if (options.length === 0)
        errors.push(`${label}: a ${kind} question needs at least one answer.`);
    }

    built.push({ pillar, kind, title, axis, options });
  }

  if (errors.length > 0)
    return { ok: false, ...empty, errors: errors.slice(0, 25) };

  // Next position per pillar, continuing after existing questions.
  const { data: existing } = await sb
    .from("questions")
    .select("pillar,position")
    .eq("version_id", versionId);
  const nextPos: Record<number, number> = {};
  for (const r of existing ?? []) {
    const p = r.pillar as number;
    nextPos[p] = Math.max(nextPos[p] ?? 0, (r.position as number) + 1);
  }

  let questionsImported = 0;
  let optionsImported = 0;
  for (const q of built) {
    const pos = nextPos[q.pillar] ?? 0;
    nextPos[q.pillar] = pos + 1;
    const { data: inserted, error } = await sb
      .from("questions")
      .insert({
        version_id: versionId,
        external_id: `Q-${randomUUID().slice(0, 8)}`,
        pillar: q.pillar,
        position: pos,
        kind: q.kind,
        title: { en: q.title },
        axis: q.axis,
      })
      .select("id")
      .single();
    if (error || !inserted)
      return {
        ok: false,
        questionsImported,
        optionsImported,
        errors: [`Insert failed at "${q.title}": ${error?.message}`],
      };
    questionsImported++;

    if (q.options.length > 0) {
      const { error: oe } = await sb.from("question_options").insert(
        q.options.map((o, i) => ({
          question_id: inserted.id,
          letter: o.letter,
          position: i,
          text: o.text,
          cluster_code: o.cluster_code,
          driver_code: o.driver_code,
          axis_value: o.axis_value,
        })),
      );
      if (oe)
        return {
          ok: false,
          questionsImported,
          optionsImported,
          errors: [`Answers insert failed at "${q.title}": ${oe.message}`],
        };
      optionsImported += q.options.length;
    }
  }

  revalidatePath(`/admin/content/${versionId}`);
  return { ok: true, questionsImported, optionsImported, errors: [] };
}
