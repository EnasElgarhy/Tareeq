"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { ClusterRow, QuestionRow } from "@/lib/admin/content";
import { deleteQuestion, saveQuestion } from "@/lib/admin/content-actions";

interface EditOption {
  key: string;
  letter: string;
  text: Record<string, string>;
  cluster_code: string | null;
  driver_code: string | null;
  axis_value: string | null;
}

function loc(t: Record<string, string>): string {
  return t?.en ?? Object.values(t ?? {})[0] ?? "";
}

function nextLetter(options: EditOption[]): string {
  const used = new Set(options.map((o) => o.letter.toUpperCase()));
  for (let i = 0; i < 26; i++) {
    const l = String.fromCharCode(65 + i);
    if (!used.has(l)) return l;
  }
  return "";
}

const INPUT =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-900 outline-none focus:border-[#6E48E4] focus:ring-2 focus:ring-[#6E48E4]/20";

export function QuestionEditor({
  versionId,
  question,
  clusters,
}: {
  versionId: string;
  question: QuestionRow;
  clusters: ClusterRow[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState<Record<string, string>>(question.title);
  const [axis, setAxis] = useState(question.axis ?? "");
  const [options, setOptions] = useState<EditOption[]>([]);
  const tmp = useRef(0);

  function startEdit() {
    setTitle(question.title);
    setAxis(question.axis ?? "");
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

  function patchOption(key: string, patch: Partial<EditOption>) {
    setOptions((prev) =>
      prev.map((o) => (o.key === key ? { ...o, ...patch } : o)),
    );
  }

  function setOptionText(key: string, en: string) {
    setOptions((prev) =>
      prev.map((o) =>
        o.key === key ? { ...o, text: { ...o.text, en } } : o,
      ),
    );
  }

  function addOption() {
    setOptions((prev) => [
      ...prev,
      {
        key: `tmp-${tmp.current++}`,
        letter: nextLetter(prev),
        text: { en: "" },
        cluster_code: null,
        driver_code: null,
        axis_value: null,
      },
    ]);
  }

  function removeOption(key: string) {
    setOptions((prev) => prev.filter((o) => o.key !== key));
  }

  function save() {
    setError(null);
    const payload = {
      title: { ...title, en: (title.en ?? "").trim() },
      axis: axis.trim() ? axis.trim() : null,
      options: options.map((o) => ({
        letter: o.letter.trim(),
        text: { ...o.text, en: (o.text.en ?? "").trim() },
        cluster_code: o.cluster_code || null,
        driver_code: o.driver_code?.trim() ? o.driver_code.trim() : null,
        axis_value: o.axis_value?.trim() ? o.axis_value.trim() : null,
      })),
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

  if (!editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">
            {question.external_id}
          </span>
          {question.axis ? (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
              axis: {question.axis}
            </span>
          ) : null}
          <button
            type="button"
            onClick={startEdit}
            className="ml-auto rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Edit
          </button>
        </div>
        <p className="text-[14px] font-semibold text-slate-900">
          {loc(question.title)}
        </p>
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
                <span className="text-[13px] text-slate-700">{loc(o.text)}</span>
                {tag ? (
                  <span className="ml-auto shrink-0 rounded-full bg-[#6E48E4]/10 px-2 py-0.5 text-[11px] font-bold text-[#6E48E4]">
                    {tag}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-[#6E48E4]/30 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">
          {question.external_id}
        </span>
        <label className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          axis
          <input
            value={axis}
            onChange={(e) => setAxis(e.target.value)}
            placeholder="—"
            className={`${INPUT} w-20 py-1`}
          />
        </label>
      </div>

      <input
        value={title.en ?? ""}
        onChange={(e) => setTitle((t) => ({ ...t, en: e.target.value }))}
        placeholder="Question title"
        className={`${INPUT} w-full text-[14px] font-semibold`}
      />

      <div className="mt-3 grid gap-1.5">
        {options.map((o) => (
          <div key={o.key} className="flex items-center gap-1.5">
            <input
              value={o.letter}
              onChange={(e) => patchOption(o.key, { letter: e.target.value })}
              className={`${INPUT} w-10 text-center font-bold`}
              maxLength={2}
            />
            <input
              value={o.text.en ?? ""}
              onChange={(e) => setOptionText(o.key, e.target.value)}
              placeholder="Option text"
              className={`${INPUT} flex-1`}
            />
            <select
              value={o.cluster_code ?? ""}
              onChange={(e) =>
                patchOption(o.key, { cluster_code: e.target.value || null })
              }
              className={`${INPUT} w-20`}
              title="Cluster"
            >
              <option value="">—</option>
              {clusters.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
            <input
              value={o.driver_code ?? ""}
              onChange={(e) =>
                patchOption(o.key, { driver_code: e.target.value || null })
              }
              placeholder="driver"
              className={`${INPUT} w-20`}
              title="Driver code"
            />
            <input
              value={o.axis_value ?? ""}
              onChange={(e) =>
                patchOption(o.key, { axis_value: e.target.value || null })
              }
              placeholder="axis"
              className={`${INPUT} w-16`}
              title="Axis value"
            />
            <button
              type="button"
              onClick={() => removeOption(o.key)}
              className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              title="Remove option"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addOption}
        className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-[12.5px] font-semibold text-slate-500 transition hover:border-[#6E48E4] hover:text-[#6E48E4]"
      >
        + Add option
      </button>

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
