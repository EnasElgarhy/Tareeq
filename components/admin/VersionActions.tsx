"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createDraftFromVersion,
  deleteDraftVersion,
  publishVersion,
} from "@/lib/admin/content-actions";

const BTN =
  "rounded-lg px-3 py-1.5 text-[13px] font-semibold transition disabled:opacity-60";

export function VersionActions({
  versionId,
  isActive,
}: {
  versionId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<unknown>, onDone?: (r: unknown) => void) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        onDone?.(result);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {isActive ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () => createDraftFromVersion(versionId),
              (id) => router.push(`/admin/content/${id as string}`),
            )
          }
          className={`${BTN} bg-slate-900 text-white hover:bg-slate-700`}
        >
          {pending ? "Cloning…" : "Clone to draft"}
        </button>
      ) : (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => publishVersion(versionId))}
            className={`${BTN} bg-emerald-600 text-white hover:bg-emerald-500`}
          >
            {pending ? "Working…" : "Publish"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (
                window.confirm(
                  "Delete this draft? Its questions and options are removed. This can't be undone.",
                )
              ) {
                run(
                  () => deleteDraftVersion(versionId),
                  () => router.push("/admin/content"),
                );
              }
            }}
            className={`${BTN} border border-red-200 text-red-600 hover:bg-red-50`}
          >
            Delete
          </button>
        </>
      )}
      {error ? (
        <span className="text-[12px] text-red-600">{error}</span>
      ) : null}
    </div>
  );
}
