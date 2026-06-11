"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ClusterRow } from "@/lib/admin/content";
import { updateCluster } from "@/lib/admin/content-actions";

const FIELD =
  "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-900 outline-none focus:border-[#6E48E4] focus:ring-2 focus:ring-[#6E48E4]/20";

export function ClusterCard({ cluster }: { cluster: ClusterRow }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cluster.name);
  const [description, setDescription] = useState(cluster.description);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateCluster(cluster.code, {
          name: name.trim(),
          description: description.trim(),
        });
        setEditing(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#6E48E4]">
            {cluster.code}
          </p>
          <button
            type="button"
            onClick={() => {
              setName(cluster.name);
              setDescription(cluster.description);
              setError(null);
              setEditing(true);
            }}
            className="text-[11px] font-semibold text-slate-400 transition hover:text-slate-700"
          >
            Edit
          </button>
        </div>
        <p className="mt-0.5 text-[13.5px] font-semibold text-slate-900">
          {cluster.name}
        </p>
        {cluster.description ? (
          <p className="mt-1 line-clamp-3 text-[11.5px] leading-snug text-slate-500">
            {cluster.description}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-[#6E48E4]/30 bg-white p-3">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#6E48E4]">
        {cluster.code}
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className={`${FIELD} font-semibold`}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={3}
        className={`${FIELD} mt-1.5 resize-none`}
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={pending || !name.trim()}
          onClick={save}
          className="rounded-lg bg-[#6E48E4] px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-[#5b39c9] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-[12px] font-semibold text-slate-500 hover:text-slate-900"
        >
          Cancel
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 text-[11px] text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
