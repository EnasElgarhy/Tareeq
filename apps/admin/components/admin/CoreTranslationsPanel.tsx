"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { QuestionRow } from "@/lib/admin/content";
import {
  updateOptionArabicText,
  updateQuestionArabicTitle,
} from "@/lib/admin/core-translation-actions";

function ArabicField({
  englishText,
  arabicText,
  onSave,
}: {
  englishText: string;
  arabicText: string;
  onSave: (value: string) => Promise<string>;
}) {
  const [value, setValue] = useState(arabicText);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const dirty = value !== arabicText;

  function save() {
    setError(null);
    setSavedNote(null);
    startTransition(async () => {
      try {
        const note = await onSave(value);
        setSavedNote(note);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      <p className="rounded-adm-md bg-adm-sand px-3 py-2 text-[13px] text-adm-ink-soft">
        {englishText}
      </p>
      <div>
        <textarea
          dir="rtl"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSavedNote(null);
          }}
          rows={2}
          placeholder="Arabic translation…"
          className="w-full rounded-adm-md border border-adm-line bg-adm-card px-3 py-2 text-[13px] text-adm-ink outline-none transition focus:border-adm-violet"
        />
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            disabled={pending || !dirty}
            onClick={save}
            className="rounded-adm-md bg-adm-violet px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-adm-deep disabled:opacity-40"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          {savedNote && !dirty ? (
            <span className="text-[12px] font-semibold text-adm-ink-muted">
              {savedNote}
            </span>
          ) : null}
          {error ? (
            <span className="text-[12px] text-adm-error-ink">{error}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CoreTranslationsPanel({
  versionId,
  questions,
}: {
  versionId: string;
  questions: QuestionRow[];
}) {
  const router = useRouter();
  const missingTitles = questions.filter((q) => !q.title.ar?.trim()).length;
  const missingOptions = questions.reduce(
    (total, q) => total + q.options.filter((o) => !o.text.ar?.trim()).length,
    0,
  );

  return (
    <div>
      <p className="mb-6 rounded-adm-md border border-adm-line bg-adm-sand px-4 py-3 text-[13px] text-adm-ink-soft">
        {missingTitles + missingOptions === 0
          ? "All questions and options have an Arabic translation."
          : `${missingTitles} question title${missingTitles === 1 ? "" : "s"} and ${missingOptions} option${missingOptions === 1 ? "" : "s"} still need an Arabic translation.`}
      </p>

      <div className="grid gap-4">
        {questions.map((q) => (
          <div
            key={q.id}
            className="rounded-adm-lg border border-adm-line bg-adm-card p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-adm-sand px-1.5 py-0.5 text-[11px] font-bold text-adm-ink-muted">
                {q.external_id}
              </span>
            </div>
            <ArabicField
              englishText={q.title.en ?? ""}
              arabicText={q.title.ar ?? ""}
              onSave={async (value) => {
                const { audio } = await updateQuestionArabicTitle(versionId, {
                  questionId: q.id,
                  ar: value,
                });
                router.refresh();
                return audio === "failed"
                  ? "Saved · audio regen failed, will retry at publish"
                  : "Saved · audio updated";
              }}
            />
            {q.options.length > 0 ? (
              <ul className="mt-3 grid gap-2 border-t border-adm-line pt-3">
                {q.options.map((o) => (
                  <li key={o.id} className="flex items-start gap-2">
                    <span className="mt-2 grid size-5 shrink-0 place-items-center rounded bg-adm-sand text-[11px] font-bold text-adm-ink-soft">
                      {o.letter}
                    </span>
                    <div className="flex-1">
                      <ArabicField
                        englishText={o.text.en ?? ""}
                        arabicText={o.text.ar ?? ""}
                        onSave={async (value) => {
                          await updateOptionArabicText(versionId, {
                            optionId: o.id,
                            ar: value,
                          });
                          router.refresh();
                          return "Saved";
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
