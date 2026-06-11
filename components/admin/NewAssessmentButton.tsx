"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBlankVersion } from "@/lib/admin/content-actions";

export function NewAssessmentButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function create() {
    if (!label.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const id = await createBlankVersion(label.trim());
        router.push(`/admin/content/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[#6E48E4] px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#5b39c9]"
      >
        + New assessment
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && create()}
        placeholder="Assessment name"
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-900 outline-none focus:border-[#6E48E4] focus:ring-2 focus:ring-[#6E48E4]/20"
      />
      <button
        type="button"
        disabled={pending || !label.trim()}
        onClick={create}
        className="rounded-lg bg-[#6E48E4] px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#5b39c9] disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create"}
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
