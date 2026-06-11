"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  type ImportResult,
  importQuestionsCsv,
} from "@/lib/admin/content-actions";
import { QUESTION_CSV_TEMPLATE } from "@/lib/admin/csv";

export function CsvImport({ versionId }: { versionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const blob = new Blob([QUESTION_CSV_TEMPLATE], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tareeq-questions-template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function runImport() {
    if (!file) return;
    setResult(null);
    startTransition(async () => {
      const text = await file.text();
      try {
        const res = await importQuestionsCsv(versionId, text);
        setResult(res);
        if (res.ok) {
          setFile(null);
          if (inputRef.current) inputRef.current.value = "";
          router.refresh();
        }
      } catch (e) {
        setResult({
          ok: false,
          questionsImported: 0,
          optionsImported: 0,
          errors: [e instanceof Error ? e.message : "Import failed"],
        });
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
        ⇪ Import CSV
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-slate-900">
          Import questions from CSV
        </h3>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setResult(null);
          }}
          className="text-[12px] font-semibold text-slate-400 transition hover:text-slate-700"
        >
          Close
        </button>
      </div>

      <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">
        One row per answer — rows that share a{" "}
        <code className="rounded bg-slate-100 px-1">question_key</code> become one
        question. Columns:{" "}
        <code className="rounded bg-slate-100 px-1">
          question_key, pillar (0–4), type (single/binary/select/text), title,
          axis, answer_key, answer_text, cluster, driver, axis_value
        </code>
        . Start from the template so the headers match.
      </p>

      <button
        type="button"
        onClick={downloadTemplate}
        className="mt-2.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        ↓ Download template
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
          }}
          className="text-[12.5px] text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-[12.5px] file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
        />
        <button
          type="button"
          disabled={!file || pending}
          onClick={runImport}
          className="rounded-lg bg-[#6E48E4] px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#5b39c9] disabled:opacity-60"
        >
          {pending ? "Importing…" : "Import"}
        </button>
      </div>

      {result ? (
        result.ok ? (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[12.5px] font-semibold text-emerald-700">
            Imported {result.questionsImported} question
            {result.questionsImported === 1 ? "" : "s"} and{" "}
            {result.optionsImported} answer
            {result.optionsImported === 1 ? "" : "s"} ✓
          </p>
        ) : (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
            <p className="font-semibold">Import stopped — nothing was added:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )
      ) : null}
    </div>
  );
}
