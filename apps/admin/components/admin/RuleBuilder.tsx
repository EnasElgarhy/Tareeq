"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Input, Label, Select } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import type { SpecRuleRow } from "@/lib/admin/assemble-spec";
import type { AssessmentCategory } from "@/lib/admin/custom-content";
import {
  deleteProfileRule,
  saveProfileRule,
  setScoringStrategy,
} from "@/lib/admin/profile-actions";
import { validateProfileRule } from "@/lib/admin/profile-validation";
import type { ResultProfileRow } from "@/lib/admin/scoring-content";
import type { RuleOperator, ScoringStrategy } from "@/lib/scoring/spec-types";

const OPERATORS: RuleOperator[] = ["=", "!=", ">", "<", ">=", "<="];

interface ConditionDraft {
  cluster: string;
  operator: RuleOperator;
  rhsType: "value" | "category";
  value: number;
  valueCategory: string;
}

interface RuleDraft {
  resultProfileId: string;
  combinator: "AND" | "OR";
  priority: number;
  conditions: ConditionDraft[];
}

function profileLabel(p: ResultProfileRow): string {
  return `${p.code ?? "—"}${p.name?.en ? ` · ${p.name.en}` : ""}`;
}

interface BuilderProps {
  catalogId: string;
  versionId: string;
  categories: AssessmentCategory[];
  profiles: ResultProfileRow[];
  rules: SpecRuleRow[];
  strategy: ScoringStrategy;
}

export function RuleBuilder({
  catalogId,
  versionId,
  categories,
  profiles,
  rules,
  strategy,
}: BuilderProps) {
  const router = useRouter();
  const toast = useToast();
  const [switching, setSwitching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function switchStrategy(next: ScoringStrategy) {
    if (next === strategy) return;
    setSwitching(true);
    try {
      await setScoringStrategy(catalogId, next, versionId);
      router.refresh();
    } catch (e) {
      toast(
        "error",
        e instanceof Error ? e.message : "Could not change strategy.",
      );
    } finally {
      setSwitching(false);
    }
  }

  return (
    <section className="mb-8">
      <h2 className="mb-1 text-sm font-bold text-adm-ink">
        How results are chosen
      </h2>
      <p className="mb-3 text-[12px] text-adm-ink-muted">
        Choose the simple strongest-match method or define advanced conditional
        rules. Student scoring always stays deterministic.
      </p>

      <div className="mb-4 inline-flex rounded-adm-md border border-adm-line-strong p-0.5">
        {(
          [
            ["highest_score_wins", "Strongest overall match"],
            ["first_match", "Advanced rules"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            disabled={switching}
            onClick={() => switchStrategy(value)}
            className={`rounded-adm-sm px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              strategy === value
                ? "bg-adm-violet text-white"
                : "text-adm-ink-muted hover:text-adm-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {strategy === "highest_score_wins" ? (
        <HighestScoreCoverage categories={categories} profiles={profiles} />
      ) : (
        <FirstMatchRules
          catalogId={catalogId}
          versionId={versionId}
          categories={categories}
          profiles={profiles}
          rules={rules}
          adding={adding}
          editingId={editingId}
          setAdding={setAdding}
          setEditingId={setEditingId}
        />
      )}
    </section>
  );
}

function HighestScoreCoverage({
  categories,
  profiles,
}: {
  categories: AssessmentCategory[];
  profiles: ResultProfileRow[];
}) {
  return (
    <div className="rounded-adm-lg border border-adm-line bg-adm-card p-4">
      <p className="mb-3 text-[13px] text-adm-ink-soft">
        The highest-scoring category wins; its mapped profile is the result. Set
        a profile&apos;s category in the profile editor above.
      </p>
      <ul className="grid gap-1.5">
        {categories.map((c) => {
          const mapped = profiles.find((p) => p.category_code === c.code);
          return (
            <li
              key={c.code}
              className="flex items-center justify-between gap-2 rounded-adm-md bg-adm-sand px-3 py-2"
            >
              <span className="text-[13px] font-semibold text-adm-ink">
                {c.code}
                {c.name.en ? ` · ${c.name.en}` : ""}
              </span>
              {mapped ? (
                <span className="text-[12px] font-semibold text-adm-violet">
                  → {profileLabel(mapped)}
                </span>
              ) : (
                <span className="text-[12px] font-semibold text-adm-error-ink">
                  ⚠ no profile mapped
                </span>
              )}
            </li>
          );
        })}
        {categories.length === 0 ? (
          <li className="text-[13px] text-adm-ink-faint">
            Add categories first.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function FirstMatchRules({
  catalogId,
  versionId,
  categories,
  profiles,
  rules,
  adding,
  editingId,
  setAdding,
  setEditingId,
}: {
  catalogId: string;
  versionId: string;
  categories: AssessmentCategory[];
  profiles: ResultProfileRow[];
  rules: SpecRuleRow[];
  adding: boolean;
  editingId: string | null;
  setAdding: (v: boolean) => void;
  setEditingId: (v: string | null) => void;
}) {
  function blankRule(): RuleDraft {
    return {
      resultProfileId: profiles[0]?.id ?? "",
      combinator: "AND",
      priority: (rules.at(-1)?.priority ?? 0) + 1,
      conditions: [
        {
          cluster: categories[0]?.code ?? "",
          operator: ">=",
          rhsType: "value",
          value: 1,
          valueCategory: categories[1]?.code ?? categories[0]?.code ?? "",
        },
      ],
    };
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[12px] text-adm-ink-muted">
          Evaluated by priority (low → high); first match wins.
        </p>
        {!adding && profiles.length > 0 && categories.length > 0 ? (
          <Button size="sm" onClick={() => setAdding(true)}>
            + Add rule
          </Button>
        ) : null}
      </div>

      {profiles.length === 0 || categories.length === 0 ? (
        <p className="rounded-adm-md border border-dashed border-adm-line-strong bg-adm-card px-4 py-4 text-[13px] text-adm-ink-muted">
          Add at least one category and one profile before writing rules.
        </p>
      ) : null}

      {adding ? (
        <div className="mb-2">
          <RuleForm
            catalogId={catalogId}
            versionId={versionId}
            categories={categories}
            profiles={profiles}
            initial={blankRule()}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : null}

      <div className="grid gap-2">
        {rules.map((r) =>
          editingId === r.id ? (
            <RuleForm
              key={r.id}
              catalogId={catalogId}
              versionId={versionId}
              categories={categories}
              profiles={profiles}
              ruleId={r.id}
              initial={ruleToDraft(r)}
              onDone={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <RuleCard
              key={r.id}
              versionId={versionId}
              rule={r}
              profiles={profiles}
              onEdit={() => setEditingId(r.id)}
            />
          ),
        )}
      </div>
    </div>
  );
}

function ruleToDraft(r: SpecRuleRow): RuleDraft {
  return {
    resultProfileId: r.result_profile_id,
    combinator: r.combinator,
    priority: r.priority,
    conditions: (r.conditions ?? []).map((c) => ({
      cluster: c.cluster,
      operator: c.operator,
      rhsType: c.valueCategory != null ? "category" : "value",
      value: typeof c.value === "number" ? c.value : 0,
      valueCategory: c.valueCategory ?? "",
    })),
  };
}

function describeRule(r: SpecRuleRow, profiles: ResultProfileRow[]): string {
  const target = profiles.find((p) => p.id === r.result_profile_id);
  const conds = (r.conditions ?? [])
    .map((c) =>
      c.valueCategory != null
        ? `${c.cluster} ${c.operator} ${c.valueCategory}`
        : `${c.cluster} ${c.operator} ${c.value}`,
    )
    .join(` ${r.combinator} `);
  return `IF ${conds} → ${target?.code ?? "?"}`;
}

function RuleCard({
  versionId,
  rule,
  profiles,
  onEdit,
}: {
  versionId: string;
  rule: SpecRuleRow;
  profiles: ResultProfileRow[];
  onEdit: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function del() {
    setBusy(true);
    try {
      await deleteProfileRule(rule.id, versionId);
      toast("success", "Rule deleted.");
      router.refresh();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not delete.");
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-adm-lg border border-adm-line bg-adm-card p-3">
      <div className="min-w-0">
        <span className="mr-2 rounded bg-adm-sand px-1.5 py-0.5 text-[11px] font-bold text-adm-ink-faint">
          P{rule.priority}
        </span>
        <code className="text-[13px] text-adm-ink">
          {describeRule(rule, profiles)}
        </code>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <Button size="sm" variant="ghost" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="danger" onClick={del} loading={busy}>
          Delete
        </Button>
      </div>
    </div>
  );
}

function RuleForm({
  catalogId,
  versionId,
  categories,
  profiles,
  ruleId,
  initial,
  onDone,
  onCancel,
}: {
  catalogId: string;
  versionId: string;
  categories: AssessmentCategory[];
  profiles: ResultProfileRow[];
  ruleId?: string;
  initial: RuleDraft;
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<RuleDraft>(initial);
  const [saving, setSaving] = useState(false);

  function toConditions() {
    return draft.conditions.map((c) =>
      c.rhsType === "category"
        ? {
            cluster: c.cluster,
            operator: c.operator,
            valueCategory: c.valueCategory,
          }
        : { cluster: c.cluster, operator: c.operator, value: c.value },
    );
  }

  const errors = validateProfileRule(
    { resultProfileId: draft.resultProfileId, conditions: toConditions() },
    profiles.map((p) => p.id),
    categories.map((c) => c.code),
  );

  function setCond(i: number, patch: Partial<ConditionDraft>) {
    setDraft((d) => ({
      ...d,
      conditions: d.conditions.map((c, idx) =>
        idx === i ? { ...c, ...patch } : c,
      ),
    }));
  }

  async function save() {
    if (errors.length > 0) {
      toast("error", errors[0]);
      return;
    }
    setSaving(true);
    try {
      await saveProfileRule(
        catalogId,
        ruleId ?? null,
        {
          resultProfileId: draft.resultProfileId,
          combinator: draft.combinator,
          conditions: toConditions(),
          priority: draft.priority,
        },
        versionId,
      );
      toast("success", ruleId ? "Rule saved." : "Rule added.");
      router.refresh();
      onDone();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not save.");
      setSaving(false);
    }
  }

  return (
    <div className="rounded-adm-lg border border-adm-violet/40 bg-adm-card p-4 shadow-adm-sm">
      <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div>
          <Label htmlFor="r-profile">Then assign profile</Label>
          <Select
            id="r-profile"
            value={draft.resultProfileId}
            onChange={(e) =>
              setDraft((d) => ({ ...d, resultProfileId: e.target.value }))
            }
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {profileLabel(p)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="r-comb">Combine</Label>
          <Select
            id="r-comb"
            value={draft.combinator}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                combinator: e.target.value as "AND" | "OR",
              }))
            }
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="r-prio">Priority</Label>
          <Input
            id="r-prio"
            type="number"
            value={draft.priority}
            onChange={(e) =>
              setDraft((d) => ({ ...d, priority: Number(e.target.value) }))
            }
            className="w-20"
          />
        </div>
      </div>

      <Label>Conditions (IF…)</Label>
      <div className="grid gap-2">
        {draft.conditions.map((c, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_72px_90px_1fr_28px] items-center gap-2"
          >
            <Select
              value={c.cluster}
              onChange={(e) => setCond(i, { cluster: e.target.value })}
              aria-label="Category"
            >
              {categories.map((cat) => (
                <option key={cat.code} value={cat.code}>
                  {cat.code}
                </option>
              ))}
            </Select>
            <Select
              value={c.operator}
              onChange={(e) =>
                setCond(i, { operator: e.target.value as RuleOperator })
              }
              aria-label="Operator"
            >
              {OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </Select>
            <Select
              value={c.rhsType}
              onChange={(e) =>
                setCond(i, { rhsType: e.target.value as "value" | "category" })
              }
              aria-label="Compare to"
            >
              <option value="value">value</option>
              <option value="category">category</option>
            </Select>
            {c.rhsType === "value" ? (
              <Input
                type="number"
                value={c.value}
                onChange={(e) => setCond(i, { value: Number(e.target.value) })}
                aria-label="Value"
              />
            ) : (
              <Select
                value={c.valueCategory}
                onChange={(e) => setCond(i, { valueCategory: e.target.value })}
                aria-label="Compared category"
              >
                {categories.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.code}
                  </option>
                ))}
              </Select>
            )}
            <button
              type="button"
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  conditions: d.conditions.filter((_, idx) => idx !== i),
                }))
              }
              className="text-base leading-none text-adm-ink-faint hover:text-adm-error-ink"
              aria-label="Remove condition"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          setDraft((d) => ({
            ...d,
            conditions: [
              ...d.conditions,
              {
                cluster: categories[0]?.code ?? "",
                operator: ">=",
                rhsType: "value",
                value: 1,
                valueCategory: categories[0]?.code ?? "",
              },
            ],
          }))
        }
        className="mt-2 text-[13px] font-semibold text-adm-violet hover:text-adm-deep"
      >
        + Add condition
      </button>

      {errors.length > 0 ? (
        <ul className="mt-3 space-y-0.5">
          {errors.map((e, i) => (
            <li key={i} className="text-[12px] font-medium text-adm-error-ink">
              • {e}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          onClick={save}
          loading={saving}
          disabled={errors.length > 0}
        >
          {ruleId ? "Save rule" : "Add rule"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
