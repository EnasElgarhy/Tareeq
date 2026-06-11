"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  type ClusterRow,
  QUESTION_TYPES,
  type QuestionRow,
  questionTypeLabel,
  typeHasOptions,
} from "@/lib/admin/content";
import {
  deleteQuestion,
  moveQuestion,
  saveQuestion,
} from "@/lib/admin/content-actions";
import {
  type EditOption,
  OPT_INPUT,
  OptionsBuilder,
} from "@/components/admin/OptionsBuilder";

function loc(t: Record<string, string>): string {
  return t?.en ?? Object.values(t ?? {})[0] ?? "";
}

const TYPE_SELECT = `${OPT_INPUT} font-semibold`;

export function QuestionEditor({
  versionId,
  question,
  clusters,
  canMoveUp = false,
  canMoveDown = false,
}: {
  versionId: string;
  question: QuestionRow;
  clusters: ClusterRow[];
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState<Record<string, string>>(question.title);
  const [axis, setAxis] = useState(question.axis ?? "");
  const [kind, setKind] = useState(question.kind);
  const [options, setOptions] = useState<EditOption[]>([]);

  function startEdit() {
    setTitle(question.title);
    setAxis(question.axis ?? "");
    setKind(question.kind);
    setOptions(
      question.options.map((o) => ({
        key: o.id,
        letter: o.letter,
        text: o.text,
        cluster_code: o.cluster_code,
        driver_code: o.driver_code,
        axis_value: o.axis_value,
      })),
    );
    setError(null);
    setEditing(true);
  }

  function save() {
    setError(null);
    const withOptions = typeHasOptions(kind);
    const payload = {
      kind,
      title: { ...title, en: (title.en ?? "").trim() },
      axis: axis.trim() ? axis.trim() : null,
      options: withOptions
        ? options.map((o) => ({
            letter: o.letter.trim(),
            text: { ...o.text, en: (o.text.en ?? "").trim() },
            cluster_code: o.cluster_code || null,
            driver_code: o.driver_code?.trim() ? o.driver_code.trim() : null,
            axis_value: o.axis_value?.trim() ? o.axis_value.trim() : null,
          }))
        : [],
    };
    startTransition(async () => {
      try {
        await saveQuestion(versionId, question.id, payload);
        setEditing(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function del() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteQuestion(versionId, question.id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  function move(dir: "up" | "down") {
    setError(null);
    startTransition(async () => {
      try {
        await moveQuestion(versionId, question.id, dir);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Move failed");
      }
    });
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">
            {question.external_id}
          </span>
          <span className="rounded bg-[#6E48E4]/10 px-1.5 py-0.5 text-[11px] font-semibold text-[#6E48E4]">
            {questionTypeLabel(question.kind)}
          </span>
          {question.axis ? (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
              axis: {question.axis}
            </span>
          ) : null}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => move("up")}
              disabled={!canMoveUp || pending}
              title="Move up"
              className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move("down")}
              disabled={!canMoveDown || pending}
              title="Move down"
              className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={startEdit}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Edit
            </button>
          </div>
        </div>
        <p className="text-[14px] font-semibold text-slate-900">
          {loc(question.title)}
        </p>
        {question.options.length > 0 ? (
          <ul className="mt-2.5 grid gap-1.5">
            {question.options.map((o) => {
              const tag = o.cluster_code ?? o.driver_code ?? o.axis_value;
              return (
                <li
                  key={o.id}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5"
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded bg-white text-[11px] font-bold text-slate-600">
                    {o.letter}
                  </span>
                  <span className="text-[13px] text-slate-700">
                    {loc(o.text)}
                  </span>
                  {tag ? (
                    <span className="ml-auto shrink-0 rounded-full bg-[#6E48E4]/10 px-2 py-0.5 text-[11px] font-bold text-[#6E48E4]">
                      {tag}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-[#6E48E4]/30 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">
          {question.external_id}
        </span>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className={TYPE_SELECT}
          title="Question type"
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t.kind} value={t.kind}>
              {t.label}
            </option>
          ))}
        </select>
        <label className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          axis
          <input
            value={axis}
            onChange={(e) => setAxis(e.target.value)}
            placeholder="—"
            className={`${OPT_INPUT} w-20 py-1`}
          />
        </label>
      </div>

      <input
        value={title.en ?? ""}
        onChange={(e) => setTitle((t) => ({ ...t, en: e.target.value }))}
        placeholder="Question title"
        className={`${OPT_INPUT} w-full text-[14px] font-semibold`}
      />

      {typeHasOptions(kind) ? (
        <div className="mt-3">
          <OptionsBuilder
            options={options}
            onChange={setOptions}
            clusters={clusters}
          />
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[12.5px] text-slate-500">
          Free-text questions have no preset answers — the respondent types their
          own.
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="rounded-lg bg-[#6E48E4] px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#5b39c9] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setEditing(false)}
          className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-slate-500 transition hover:text-slate-900"
        >
          Cancel
        </button>
        {error ? (
          <span className="text-[12px] text-red-600">{error}</span>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm("Delete this question? This can't be undone."))
              del();
          }}
          className="ml-auto text-[12px] font-semibold text-red-600 hover:underline disabled:opacity-60"
        >
          Delete question
        </button>
      </div>
    </div>
  );
}
