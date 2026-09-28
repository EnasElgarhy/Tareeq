import Link from "next/link";
import { CheckCircle2, CircleAlert } from "lucide-react";
import type { AssessmentReadiness } from "@/lib/admin/assessment-readiness";

interface Props {
  versionId: string;
  readiness: AssessmentReadiness;
}

export function AssessmentReadinessSummary({ versionId, readiness }: Props) {
  const items = [
    {
      label: "Questions and answer mappings",
      complete: readiness.steps.questions === "complete",
      detail:
        readiness.questionCount === 0
          ? "No questions added"
          : readiness.unmappedAnswerCount > 0
            ? `${readiness.unmappedAnswerCount} answer(s) need a result`
            : `${readiness.questionCount} question(s) ready`,
      href: `/admin/content/${versionId}/custom`,
    },
    {
      label: "Results and scoring",
      complete: readiness.steps.scoring === "complete",
      detail: readiness.scoringIssues[0] ?? "All result categories are covered",
      href: `/admin/content/${versionId}/scoring`,
    },
    {
      label: "Language coverage",
      complete: readiness.steps.translations === "complete",
      detail:
        readiness.translationGaps.length > 0
          ? `${readiness.translationGaps.length} field(s) need translation`
          : "All required languages are complete",
      href: `/admin/content/${versionId}/translations`,
    },
  ];

  return (
    <section className="mb-7 border-b border-adm-line pb-7">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-adm-ink">
            Publishing readiness
          </h2>
          <p className="mt-1 text-[12px] text-adm-ink-muted">
            Review the student experience below, then publish when every check
            is complete.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
            readiness.isReadyToPublish
              ? "bg-adm-violet/10 text-adm-violet"
              : "bg-adm-error/10 text-adm-error-ink"
          }`}
        >
          {readiness.isReadyToPublish ? "Ready to publish" : "Needs attention"}
        </span>
      </div>

      <ul className="grid gap-2 lg:grid-cols-3">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex min-w-0 items-start gap-2.5 rounded-adm-md border border-adm-line bg-adm-card px-3 py-3"
          >
            {item.complete ? (
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-adm-violet"
                aria-hidden="true"
              />
            ) : (
              <CircleAlert
                className="mt-0.5 size-4 shrink-0 text-adm-error-ink"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-adm-ink">{item.label}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-adm-ink-muted">
                {item.detail}
              </p>
            </div>
            {!item.complete ? (
              <Link
                href={item.href}
                className="shrink-0 text-[11px] font-bold text-adm-violet hover:text-adm-deep"
              >
                Fix
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
