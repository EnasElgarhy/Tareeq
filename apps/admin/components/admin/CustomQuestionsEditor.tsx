"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Input, Label, Select } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import type {
  AssessmentCategory,
  CustomQuestion,
} from "@/lib/admin/custom-content";
import {
  addCustomQuestion,
  deleteCustomQuestion,
  saveCustomQuestion,
} from "@/lib/admin/custom-question-actions";
import {
  questionKindHasOptions,
  validateCustomQuestion,
} from "@/lib/admin/custom-question-validation";
import { type Locale, LOCALE_LABELS } from "@/lib/admin/locales";

type OptionDraft = {
  letter: string;
  text: Record<string, string>;
  categoryCode: string | null;
  points: number;
};
type Draft = {
  kind: string;
  title: Record<string, string>;
  options: OptionDraft[];
};

function emptyOption(letter: string): OptionDraft {
  return { letter, text: {}, categoryCode: null, points: 1 };
}
function blankDraft(): Draft {
  return {
    kind: "single",
    title: {},
    options: [emptyOption("A"), emptyOption("B")],
  };
}
function toDraft(q: CustomQuestion): Draft {
  return {
    kind: q.kind,
    title: { ...q.title },
    options: q.options.map((o) => ({
      letter: o.letter,
      text: { ...o.text },
      categoryCode: o.categoryCode,
      points: o.points,
    })),
  };
}

interface EditorProps {
  versionId: string;
  categories: AssessmentCategory[];
  questions: CustomQuestion[];
  supportedLanguages: Locale[];
}

export function CustomQuestionsEditor({
  versionId,
  categories,
  questions,
  supportedLanguages,
}: EditorProps) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section>
      {categories.length === 0 ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-adm-lg border border-adm-error/30 bg-adm-error/5 px-4 py-3">
          <div>
            <p className="text-[13px] font-bold text-adm-ink">
              Define your possible results first
            </p>
            <p className="mt-0.5 text-[12px] text-adm-ink-muted">
              Answers need a result before they can be scored.
            </p>
          </div>
          <Link
            href={`/admin/content/${versionId}/scoring`}
            className="text-[12px] font-bold text-adm-violet hover:text-adm-deep"
          >
            Set up results →
          </Link>
        </div>
      ) : null}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-adm-ink">
          Questions ({questions.length})
        </h2>
        {!adding ? (
          <Button
            size="sm"
            onClick={() => setAdding(true)}
            disabled={categories.length === 0}
          >
            + Add question
          </Button>
        ) : null}
      </div>

      {adding ? (
        <div className="mb-3">
          <QuestionForm
            versionId={versionId}
            categories={categories}
            supportedLanguages={supportedLanguages}
            initial={blankDraft()}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : null}

      {questions.length === 0 && !adding ? (
        <p className="rounded-adm-lg border border-dashed border-adm-line-strong bg-adm-card px-4 py-8 text-center text-[13px] text-adm-ink-muted">
          No questions yet. Add your first bilingual question above.
        </p>
      ) : null}

      <div className="grid gap-3">
        {questions.map((q) =>
          editingId === q.id ? (
            <QuestionForm
              key={q.id}
              versionId={versionId}
              categories={categories}
              supportedLanguages={supportedLanguages}
              questionId={q.id}
              initial={toDraft(q)}
              onDone={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <QuestionCard
              key={q.id}
              versionId={versionId}
              question={q}
              onEdit={() => setEditingId(q.id)}
            />
          ),
        )}
      </div>
    </section>
  );
}

function QuestionCard({
  versionId,
  question,
  onEdit,
}: {
  versionId: string;
  question: CustomQuestion;
  onEdit: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function duplicate() {
    setDuplicating(true);
    try {
      await addCustomQuestion(versionId, toDraft(question));
      toast("success", "Question duplicated.");
      router.refresh();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not duplicate.");
      setDuplicating(false);
    }
  }

  async function del() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    try {
      await deleteCustomQuestion(versionId, question.id);
      toast("success", "Question deleted.");
      router.refresh();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not delete.");
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div className="rounded-adm-lg border border-adm-line bg-adm-card p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-[14px] font-semibold text-adm-ink">
          {question.title.en || (
            <span className="text-adm-error-ink">⚠ missing English title</span>
          )}
        </p>
        <div className="flex shrink-0 gap-1.5">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={duplicate}
            loading={duplicating}
            aria-label="Duplicate question"
            title="Duplicate question"
          >
            <Copy className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Duplicate</span>
          </Button>
          <Button size="sm" variant="danger" onClick={del} loading={busy}>
            {confirming ? "Sure?" : "Delete"}
          </Button>
        </div>
      </div>
      {question.title.ar ? (
        <p dir="rtl" className="mb-2 text-[13px] text-adm-ink-muted">
          {question.title.ar}
        </p>
      ) : null}
      {question.options.length > 0 ? (
        <ul className="grid gap-1.5">
          {question.options.map((o) => (
            <li
              key={o.id}
              className="flex items-center gap-2 rounded-adm-md bg-adm-sand px-3 py-1.5"
            >
              <span className="grid size-5 shrink-0 place-items-center rounded bg-adm-card text-[11px] font-bold text-adm-ink-soft">
                {o.letter}
              </span>
              <span className="text-[13px] text-adm-ink-soft">
                {o.text.en || "—"}
              </span>
              {o.text.ar ? (
                <span dir="rtl" className="text-[12px] text-adm-ink-faint">
                  · {o.text.ar}
                </span>
              ) : null}
              {o.categoryCode ? (
                <span className="ml-auto shrink-0 rounded-full bg-adm-violet/10 px-2 py-0.5 text-[11px] font-bold text-adm-violet">
                  {o.categoryCode} +{o.points}
                </span>
              ) : (
                <span className="ml-auto shrink-0 text-[11px] text-adm-ink-faint">
                  unscored
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-adm-ink-faint">Open-text answer</p>
      )}
    </div>
  );
}

function QuestionForm({
  versionId,
  categories,
  supportedLanguages,
  questionId,
  initial,
  onDone,
  onCancel,
}: {
  versionId: string;
  categories: AssessmentCategory[];
  supportedLanguages: Locale[];
  questionId?: string;
  initial: Draft;
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [locale, setLocale] = useState<Locale>("en");
  const [kind, setKind] = useState(initial.kind);
  const [title, setTitle] = useState<Record<string, string>>(initial.title);
  const [options, setOptions] = useState<OptionDraft[]>(initial.options);
  const [saving, setSaving] = useState(false);
  const [advancedScoring, setAdvancedScoring] = useState(
    initial.options.some((option) => ![1, 2, 3].includes(option.points)),
  );

  const hasOptions = questionKindHasOptions(kind);
  const rtl = locale === "ar";
  const input = { kind, title, options };
  const errors = validateCustomQuestion(
    input,
    categories.map((c) => c.code),
  );
  const localeComplete = (candidate: Locale) =>
    Boolean(title[candidate]?.trim()) &&
    (!hasOptions || options.every((option) => option.text[candidate]?.trim()));
  const isDirty =
    JSON.stringify({ kind, title, options }) !== JSON.stringify(initial);

  useEffect(() => {
    if (!isDirty) return;
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  function cancel() {
    if (
      isDirty &&
      !window.confirm("Discard the unsaved changes to this question?")
    ) {
      return;
    }
    onCancel();
  }

  function setOpt(i: number, patch: Partial<OptionDraft>) {
    setOptions((os) =>
      os.map((o, idx) => (idx === i ? { ...o, ...patch } : o)),
    );
  }
  function setOptText(i: number, value: string) {
    setOptions((os) =>
      os.map((o, idx) =>
        idx === i ? { ...o, text: { ...o.text, [locale]: value } } : o,
      ),
    );
  }
  function addOption() {
    setOptions((os) => [
      ...os,
      emptyOption(String.fromCharCode(65 + os.length)),
    ]);
  }
  function removeOption(i: number) {
    setOptions((os) => os.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (errors.length > 0) {
      toast("error", errors[0]);
      return;
    }
    setSaving(true);
    try {
      if (questionId) {
        await saveCustomQuestion(versionId, questionId, input);
      } else {
        await addCustomQuestion(versionId, input);
      }
      toast("success", questionId ? "Question saved." : "Question added.");
      router.refresh();
      onDone();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not save.");
      setSaving(false);
    }
  }

  return (
    <div className="rounded-adm-lg border border-adm-violet/40 bg-adm-card p-4 shadow-adm-sm">
      <div className="mb-4 flex flex-wrap items-center gap-1">
        {supportedLanguages.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={`flex min-h-9 items-center gap-1.5 rounded-adm-sm px-3 py-1 text-[13px] font-semibold transition-colors ${
              locale === l
                ? "bg-adm-violet text-white"
                : "bg-adm-sand text-adm-ink-muted hover:text-adm-ink"
            }`}
          >
            {LOCALE_LABELS[l]}
            {localeComplete(l) ? (
              <Check className="size-3" aria-label="Complete" />
            ) : (
              <span
                className={`size-1.5 rounded-full ${
                  locale === l ? "bg-white/70" : "bg-adm-error"
                }`}
                aria-label="Incomplete"
              />
            )}
          </button>
        ))}
        <div className="ml-auto min-w-44">
          <Select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            aria-label="Question type"
            className="h-8 text-[13px]"
          >
            <option value="single">Single choice</option>
            <option value="binary">Binary</option>
            <option value="select">Dropdown</option>
            <option value="text">Open text</option>
          </Select>
        </div>
      </div>

      <Label htmlFor="q-title">Question ({LOCALE_LABELS[locale]})</Label>
      <Input
        id="q-title"
        value={title[locale] ?? ""}
        onChange={(e) => setTitle((t) => ({ ...t, [locale]: e.target.value }))}
        placeholder={rtl ? "نص السؤال" : "Question text"}
        dir={rtl ? "rtl" : undefined}
        autoFocus
      />

      {hasOptions ? (
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <div>
              <Label className="mb-0">Answers</Label>
              <p className="text-[12px] text-adm-ink-muted">
                Write each choice and choose the result it supports.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAdvancedScoring((value) => !value)}
              className="text-[12px] font-semibold text-adm-violet hover:text-adm-deep"
              aria-expanded={advancedScoring}
            >
              {advancedScoring ? "Use simple strength" : "Advanced points"}
            </button>
          </div>
          <div className="grid gap-3">
            {options.map((o, i) => (
              <div
                key={i}
                className="grid gap-2 rounded-adm-md border border-adm-line bg-adm-sand/60 p-3 md:grid-cols-[44px_minmax(180px,1fr)_minmax(150px,0.55fr)_minmax(120px,0.4fr)_40px] md:items-end"
              >
                <FieldGroup label="Choice">
                  <Input
                    value={o.letter}
                    onChange={(e) =>
                      setOpt(i, {
                        letter: e.target.value.toUpperCase().slice(0, 4),
                      })
                    }
                    className="text-center"
                    aria-label={`Answer ${i + 1} letter`}
                  />
                </FieldGroup>
                <FieldGroup label={`${LOCALE_LABELS[locale]} answer`}>
                  <Input
                    value={o.text[locale] ?? ""}
                    onChange={(e) => setOptText(i, e.target.value)}
                    placeholder={rtl ? "نص الإجابة" : "Answer text"}
                    dir={rtl ? "rtl" : undefined}
                    aria-label={`Answer ${i + 1} text`}
                  />
                </FieldGroup>
                <FieldGroup label="Leads toward">
                  <Select
                    value={o.categoryCode ?? ""}
                    onChange={(e) =>
                      setOpt(i, { categoryCode: e.target.value || null })
                    }
                    aria-label={`Answer ${i + 1} result`}
                  >
                    <option value="">Choose a result</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.name.en || c.code}
                      </option>
                    ))}
                  </Select>
                </FieldGroup>
                <FieldGroup label={advancedScoring ? "Points" : "Strength"}>
                  {advancedScoring ? (
                    <Input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={o.points}
                      onChange={(e) =>
                        setOpt(i, { points: Number(e.target.value) })
                      }
                      aria-label={`Answer ${i + 1} points`}
                    />
                  ) : (
                    <Select
                      value={o.points}
                      onChange={(e) =>
                        setOpt(i, { points: Number(e.target.value) })
                      }
                      aria-label={`Answer ${i + 1} match strength`}
                    >
                      <option value={1}>Low</option>
                      <option value={2}>Medium</option>
                      <option value={3}>High</option>
                    </Select>
                  )}
                </FieldGroup>
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="grid size-10 place-items-center rounded-adm-md border border-transparent text-adm-ink-muted transition-colors hover:border-adm-error/40 hover:bg-adm-error/10 hover:text-adm-error-ink"
                  aria-label={`Remove answer ${i + 1}`}
                  title="Remove answer"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-2 text-[13px] font-semibold text-adm-violet hover:text-adm-deep"
          >
            <Plus className="mr-1 inline size-3.5" aria-hidden="true" />
            Add answer
          </button>
        </div>
      ) : null}

      {errors.length > 0 ? (
        <ul className="mt-3 space-y-0.5">
          {errors.map((e, i) => (
            <li key={i} className="text-[12px] font-medium text-adm-error-ink">
              • {e}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="sticky bottom-0 -mx-4 mt-4 flex gap-2 border-t border-adm-line bg-adm-card/95 px-4 py-3 backdrop-blur-sm">
        <Button
          size="sm"
          onClick={save}
          loading={saving}
          disabled={errors.length > 0}
        >
          {questionId ? "Save" : "Add question"}
        </Button>
        <Button size="sm" variant="ghost" onClick={cancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <span className="mb-1 block text-[11px] font-semibold text-adm-ink-muted">
        {label}
      </span>
      {children}
    </div>
  );
}
