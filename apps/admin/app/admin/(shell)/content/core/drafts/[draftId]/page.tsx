import { notFound } from "next/navigation";
import { CoreDraftActions } from "@/components/admin/core/CoreDraftActions";
import { CoreDraftItemForm } from "@/components/admin/core/CoreDraftItemForm";
import { CoreBreadcrumb } from "@/components/admin/core/CoreTabs";
import PageHeader from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/ui/Badge";
import { getCoreDraft } from "@/lib/admin/core/drafts";
import {
  changedItemIds,
  compareStructure,
  CORE_PARTS,
  CORE_QUESTION_SET,
  itemsInOrder,
  validateQuestionSet,
} from "@/lib/admin/core/framework";

export const dynamic = "force-dynamic";

export default async function CoreDraftPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  const draft = await getCoreDraft(draftId).catch(() => null);
  if (!draft) notFound();

  const isDraft = draft.status === "draft";
  const problems = [
    ...compareStructure(CORE_QUESTION_SET, draft.body),
    ...validateQuestionSet(draft.body),
  ];
  const changed = new Set(changedItemIds(CORE_QUESTION_SET, draft.body));

  return (
    <>
      <CoreBreadcrumb
        trail={[
          { label: "CORE 2.0", href: "/admin/content/core" },
          { label: `Draft ${draft.targetVersion}` },
        ]}
      />
      <PageHeader
        kicker={`Wording draft · from question set ${draft.baseVersion} · ${changed.size} questions edited`}
        title={`Question set ${draft.targetVersion}`}
        description="Wording only: ids, codes, axes and order are locked to the live set so scoring 2.0 still applies. Students keep seeing the live set until this file is shipped."
        actions={
          <>
            <StatusBadge status={isDraft ? "draft" : "archived"} />
            <CoreDraftActions
              draftId={draft.id}
              body={draft.body}
              isDraft={isDraft}
              hasProblems={problems.length > 0}
            />
          </>
        }
      />

      {problems.length > 0 ? (
        <div
          role="alert"
          className="mb-6 rounded-adm-lg border border-adm-error/60 bg-adm-error/10 px-4 py-3 text-[13px] text-adm-error-ink"
        >
          <p className="font-bold">Fix these before downloading:</p>
          <ul className="mt-1 list-disc ps-5">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {CORE_PARTS.map((part) => (
        <section key={part.pillar} className="mb-8">
          <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-adm-ink-muted">
            Part {part.part} · {part.name}
          </h2>
          <div className="grid gap-2">
            {itemsInOrder(draft.body, part.pillar).map((item) => (
              <CoreDraftItemForm
                key={item.item_id}
                draftId={draft.id}
                item={item}
                isChanged={changed.has(item.item_id)}
                isReadOnly={!isDraft}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
