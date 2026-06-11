"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PILLAR_NAMES } from "@/lib/admin/content";
import { addQuestion } from "@/lib/admin/content-actions";

const FIELD =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-900 outline-none focus:border-[#6E48E4] focus:ring-2 focus:ring-[#6E48E4]/20";

export function AddQuestionForm({ versionId }: { versionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pillar, setPillar] = useState(1);
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add() {
    if (!title.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await addQuestion(versionId, { pillar, title: title.trim() });
        setTitle("");
        setOpen(false);
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

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <select
        value={pillar}
        onChange={(e) => setPillar(Number(e.target.value))}
        className={FIELD}
      >
        {Object.entries(PILLAR_NAMES).map(([value, name]) => (
          <option key={value} value={value}>
            Pillar {value} · {name}
          </option>
        ))}
      </select>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        placeholder="Question title"
        className={`${FIELD} min-w-[280px] flex-1`}
      />
      <button
        type="button"
        disabled={pending || !title.trim()}
        onClick={add}
        className="rounded-lg bg-[#6E48E4] px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#5b39c9] disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-[13px] font-semibold text-slate-500 hover:text-slate-900"
      >
        Cancel
      </button>
      {error ? <span className="text-[12px] text-red-600">{error}</span> : null}
    </div>
  );
}
