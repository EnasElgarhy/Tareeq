"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  type ClusterRow,
  PILLAR_NAMES,
  QUESTION_TYPES,
  typeHasOptions,
} from "@/lib/admin/content";
import { addQuestion } from "@/lib/admin/content-actions";
import {
  type EditOption,
  makeOption,
  OPT_INPUT,
  OptionsBuilder,
} from "@/components/admin/OptionsBuilder";

function seedOptions(): EditOption[] {
  return [makeOption("A"), makeOption("B")];
}

export function QuestionBuilder({
  versionId,
  clusters,
}: {
  versionId: string;
  clusters: ClusterRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pillar, setPillar] = useState(1);
  const [kind, setKind] = useState("single");
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<EditOption[]>(seedOptions);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setPillar(1);
    setKind("single");
    setTitle("");
    setOptions(seedOptions());
    setError(null);
  }

  function save() {
    if (!title.trim()) return;
    setError(null);
    const withOptions = typeHasOptions(kind);
    const payload = {
      pillar,
      kind,
      title: title.trim(),
      options: withOptions
        ? options
            .filter((o) => o.letter.trim() || (o.text.en ?? "").trim())
            .map((o) => ({
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
        await addQuestion(versionId, payload);
        close();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not add question");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-slate-500 transition hover:border-[#6E48E4] hover:text-[#6E48E4]"
      >
        + Add question
      </button>
    );
  }

  const hint = QUESTION_TYPES.find((t) => t.kind === kind)?.hint;

  return (
    <div className="rounded-xl border-2 border-[#6E48E4]/30 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className={`${OPT_INPUT} font-semibold`}
          title="Question type"
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t.kind} value={t.kind}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={pillar}
          onChange={(e) => setPillar(Number(e.target.value))}
          className={OPT_INPUT}
          title="Pillar"
        >
          {Object.entries(PILLAR_NAMES).map(([value, name]) => (
            <option key={value} value={value}>
              Pillar {value} · {name}
            </option>
          ))}
        </select>
        {hint ? (
          <span className="text-[11.5px] text-slate-400">{hint}</span>
        ) : null}
      </div>

      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
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
          Free-text questions have no preset answers — the respondent types
          their own.
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          disabled={pending || !title.trim()}
          onClick={save}
          className="rounded-lg bg-[#6E48E4] px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#5b39c9] disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add question"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={close}
          className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-slate-500 transition hover:text-slate-900"
        >
          Cancel
        </button>
        {error ? (
          <span className="text-[12px] text-red-600">{error}</span>
        ) : null}
      </div>
    </div>
  );
}
