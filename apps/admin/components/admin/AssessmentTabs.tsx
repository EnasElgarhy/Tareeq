import Link from "next/link";
import { Check, CircleAlert } from "lucide-react";
import type {
  AssessmentReadiness,
  AssessmentStepKey,
  AssessmentStepStatus,
} from "@/lib/admin/assessment-readiness";

type TabKey = AssessmentStepKey;

const TABS: {
  key: TabKey;
  label: string;
  description: string;
  path: string;
}[] = [
  {
    key: "scoring",
    label: "Results",
    description: "Define possible outcomes",
    path: "scoring",
  },
  {
    key: "questions",
    label: "Questions",
    description: "Write and map answers",
    path: "custom",
  },
  {
    key: "translations",
    label: "Languages",
    description: "Check bilingual content",
    path: "translations",
  },
  {
    key: "preview",
    label: "Review & publish",
    description: "Test the student experience",
    path: "preview",
  },
];

export function AssessmentTabs({
  versionId,
  active,
  readiness,
}: {
  versionId: string;
  active: TabKey;
  readiness?: AssessmentReadiness;
}) {
  return (
    <nav
      className="mb-7 grid gap-px overflow-hidden rounded-adm-lg border border-adm-line bg-adm-line sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Assessment creation steps"
    >
      {TABS.map((tab, index) => (
        <Link
          key={tab.key}
          href={`/admin/content/${versionId}/${tab.path}`}
          aria-current={active === tab.key ? "page" : undefined}
          className={`group flex min-w-0 items-center gap-3 bg-adm-card px-4 py-3 transition-colors ${
            active === tab.key
              ? "bg-adm-violet/5 shadow-[inset_0_-2px_0_var(--adm-violet)]"
              : "hover:bg-adm-sand"
          }`}
        >
          <StepMarker
            index={index + 1}
            status={readiness?.steps[tab.key] ?? "todo"}
            active={active === tab.key}
          />
          <span className="min-w-0">
            <span
              className={`block truncate text-[13px] font-bold ${
                active === tab.key ? "text-adm-violet" : "text-adm-ink"
              }`}
            >
              {tab.label}
            </span>
            <span className="block truncate text-[11px] text-adm-ink-muted">
              {tab.description}
            </span>
          </span>
        </Link>
      ))}
    </nav>
  );
}

function StepMarker({
  index,
  status,
  active,
}: {
  index: number;
  status: AssessmentStepStatus;
  active: boolean;
}) {
  const shared =
    "grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold";

  if (status === "complete" || status === "ready") {
    return (
      <span
        className={`${shared} bg-adm-violet text-white`}
        aria-label="Complete"
      >
        <Check className="size-3.5" aria-hidden="true" />
      </span>
    );
  }

  if (status === "attention") {
    return (
      <span
        className={`${shared} bg-adm-error/10 text-adm-error-ink`}
        aria-label="Needs attention"
      >
        <CircleAlert className="size-3.5" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span
      className={`${shared} ${
        active ? "bg-adm-violet text-white" : "bg-adm-sand text-adm-ink-muted"
      }`}
      aria-hidden="true"
    >
      {index}
    </span>
  );
}
