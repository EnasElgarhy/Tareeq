"use client";

import { useMemo, useState } from "react";
import { Select } from "@/components/admin/ui/Field";
import { assembleScoringSpec } from "@/lib/admin/assemble-spec";
import type { AssessmentCategory, CustomQuestion } from "@/lib/admin/custom-content";
import type { ResultProfileRow } from "@/lib/admin/scoring-content";
import type { SpecRuleRow } from "@/lib/admin/assemble-spec";
import {
  computeClusterTotals,
  executeScoringSpec,
} from "@/lib/scoring/spec-executor";
import type { ScoringStrategy } from "@/lib/scoring/spec-types";
import type { LocalizedText, Question, QuestionKind } from "@/lib/scoring/types";

interface PreviewProps {
  questions: CustomQuestion[];
  categories: AssessmentCategory[];
  profiles: ResultProfileRow[];
  rules: SpecRuleRow[];
  strategy: ScoringStrategy;
}

export function ScoringPreview({
  questions,
  categories,
  profiles,
  rules,
  strategy,
}: PreviewProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const scorable = questions.filter((q) => q.options.length > 0);

  const engineQuestions: Question[] = useMemo(
    () =>
      scorable.map((q) => ({
        externalId: q.external_id,
        pillar: 1,
        position: q.position,
        kind: q.kind as QuestionKind,
        title: q.title as LocalizedText,
        options: q.options.map((o) => ({
          letter: o.letter,
          position: o.position,
          text: o.text as LocalizedText,
          categoryCode: o.categoryCode ?? undefined,
          weight: o.points,
        })),
      })),
    [scorable],
  );

  const result = useMemo(() => {
    try {
      const totals = computeClusterTotals(answers, engineQuestions);
      const spec = assembleScoringSpec({
        strategy,
        categories: categories.map((c) => ({ code: c.code, name: c.name })),
        profiles,
        rules,
      });
      const outcome = executeScoringSpec(totals, spec);
      return { totals, outcome, error: null as string | null };
    } catch (e) {
      return {
        totals: {} as Record<string, number>,
        outcome: null,
        error: e instanceof Error ? e.message : "Could not score.",
      };
    }
  }, [answers, engineQuestions, categories, profiles, rules, strategy]);

  const winning = result.outcome?.winningProfile ?? null;

  return (
    <section className="mb-8">
      <h2 className="mb-1 text-sm font-bold text-adm-ink">Preview</h2>
      <p className="mb-3 text-[12px] text-adm-ink-muted">
        Enter sample answers and see exactly how the deterministic engine scores
        them — totals, matched rule, and the resulting profile.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sample answers */}
        <div className="rounded-adm-lg border border-adm-line bg-adm-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-adm-ink">Sample answers</h3>
            <button
              type="button"
              onClick={() => setAnswers({})}
              className="text-[12px] font-semibold text-adm-violet hover:text-adm-deep"
            >
              Clear
            </button>
          </div>
          {scorable.length === 0 ? (
            <p className="text-[13px] text-adm-ink-faint">
              No scorable questions yet — add some in the Questions step.
            </p>
          ) : (
            <ul className="grid gap-2.5">
              {scorable.map((q) => (
                <li key={q.id}>
                  <p className="mb-1 text-[13px] font-medium text-adm-ink-soft">
                    {q.title.en || q.external_id}
                  </p>
                  <Select
                    value={answers[q.external_id] ?? ""}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [q.external_id]: e.target.value }))
                    }
                    aria-label={`Answer for ${q.external_id}`}
                  >
                    <option value="">— not answered —</option>
                    {q.options.map((o) => (
                      <option key={o.id} value={o.letter}>
                        {o.letter}. {o.text.en || "(no text)"}
                        {o.categoryCode ? ` → ${o.categoryCode} +${o.points}` : ""}
                      </option>
                    ))}
                  </Select>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Result */}
        <div className="rounded-adm-lg border border-adm-line bg-adm-card p-4">
          <h3 className="mb-3 text-[13px] font-bold text-adm-ink">Result</h3>

          {result.error ? (
            <p className="mb-3 rounded-adm-md border border-adm-error/40 bg-adm-error/10 px-3 py-2 text-[12px] font-medium text-adm-error-ink">
              {result.error}
            </p>
          ) : null}

          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-adm-ink-faint">
            Category totals
          </p>
          <ul className="mb-4 grid gap-1">
            {categories.length === 0 ? (
              <li className="text-[12px] text-adm-ink-faint">No categories.</li>
            ) : (
              categories.map((c) => (
                <li key={c.code} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-[12px] font-semibold text-adm-ink-soft">
                    {c.code}
                  </span>
                  <span className="grid size-6 place-items-center rounded bg-adm-violet/10 text-[12px] font-bold text-adm-violet">
                    {result.totals[c.code] ?? 0}
                  </span>
                </li>
              ))
            )}
          </ul>

          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-adm-ink-faint">
            Matched
          </p>
          <p className="mb-3 text-[12px] text-adm-ink-soft">
            {result.outcome?.matchedBy === "rule"
              ? `Rule (id ${result.outcome.matchedRuleId})`
              : result.outcome?.matchedBy === "highest_score"
                ? "Highest-scoring category"
                : result.outcome?.matchedBy === "fallback"
                  ? "Fallback profile"
                  : "No match"}
          </p>

          {winning ? (
            <div className="rounded-adm-md border border-adm-violet/30 bg-adm-violet/5 p-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-adm-violet/15 px-1.5 py-0.5 text-[11px] font-bold text-adm-violet">
                  {winning.code ?? "—"}
                </span>
                <span className="text-[14px] font-bold text-adm-ink">
                  {winning.name?.en ?? "(untitled)"}
                </span>
              </div>
              {winning.description?.en ? (
                <p className="mt-1.5 text-[12px] text-adm-ink-muted">
                  {winning.description.en}
                </p>
              ) : null}
              {winning.recommendedMajors?.en?.length ? (
                <p className="mt-2 text-[12px] text-adm-ink-soft">
                  <span className="font-semibold">Majors:</span>{" "}
                  {winning.recommendedMajors.en.join(", ")}
                </p>
              ) : null}
              {winning.recommendedCareers?.en?.length ? (
                <p className="mt-1 text-[12px] text-adm-ink-soft">
                  <span className="font-semibold">Careers:</span>{" "}
                  {winning.recommendedCareers.en.join(", ")}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-[13px] text-adm-ink-faint">
              No profile assigned for these answers.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
