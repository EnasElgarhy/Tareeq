"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { StatusBadge } from "@/components/admin/ui/Badge";
import { Field, Input } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { createCoreDraft } from "@/lib/admin/core/draft-actions";
import type { CoreDraftList } from "@/lib/admin/core/drafts";

/** Wording drafts of the CORE question set: list and create. */
export function CoreDraftsPanel({
  drafts,
  baseVersion,
}: {
  drafts: CoreDraftList;
  baseVersion: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [target, setTarget] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsBusy(true);
    try {
      const id = await createCoreDraft({ targetVersion: target });
      router.push(`/admin/content/core/drafts/${id}`);
    } catch (err) {
      toast(
        "error",
        err instanceof Error ? err.message : "Could not create the draft.",
      );
      setIsBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="core-drafts"
      className="rounded-adm-lg border border-adm-line bg-adm-card p-5"
    >
      <h2 id="core-drafts" className="text-base font-bold text-adm-ink">
        Wording drafts
      </h2>
      <p className="mt-1 text-[13px] text-adm-ink-muted">
        Edit question and option wording (English and Arabic) in a copy of
        question set {baseVersion}. Ids, codes, axes and order stay locked, so
        scoring 2.0 still applies. A finished draft is downloaded and shipped as
        the next question-set file; students keep seeing {baseVersion} until
        then.
      </p>

      {!drafts.available ? (
        <p className="mt-4 rounded-adm-md bg-adm-sand px-3 py-2 text-[13px] text-adm-ink-soft">
          Drafts need the database table from migration
          202610240001_core_question_set_drafts.sql, which isn&apos;t applied
          yet.
        </p>
      ) : (
        <>
          {drafts.drafts.length > 0 ? (
            <ul className="mt-4 divide-y divide-adm-line">
              {drafts.drafts.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center gap-3 py-2.5"
                >
                  <Link
                    href={`/admin/content/core/drafts/${d.id}`}
                    className="font-bold text-adm-ink underline-offset-2 hover:text-adm-violet hover:underline"
                  >
                    Question set {d.targetVersion}
                  </Link>
                  <span className="text-xs text-adm-ink-muted">
                    from {d.baseVersion} · updated{" "}
                    {new Date(d.updatedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span className="ml-auto">
                    <StatusBadge
                      status={d.status === "draft" ? "draft" : "archived"}
                    />
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <form
            onSubmit={handleCreate}
            className="mt-4 flex flex-wrap items-end gap-3"
          >
            <div className="w-40">
              <Field label="Next version" hint="e.g. 5.3">
                {(field) => (
                  <Input
                    {...field}
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="5.3"
                    inputMode="decimal"
                    required
                  />
                )}
              </Field>
            </div>
            <Button type="submit" loading={isBusy} disabled={!target.trim()}>
              New wording draft
            </Button>
          </form>
        </>
      )}
    </section>
  );
}
