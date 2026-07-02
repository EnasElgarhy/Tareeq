import Link from "next/link";

type TabKey = "questions" | "scoring" | "translations" | "preview";

const TABS: { key: TabKey; label: string; path: string }[] = [
  { key: "questions", label: "Questions", path: "custom" },
  { key: "scoring", label: "Scoring & Profiles", path: "scoring" },
  { key: "translations", label: "Translations", path: "translations" },
  { key: "preview", label: "Preview", path: "preview" },
];

export function AssessmentTabs({
  versionId,
  active,
}: {
  versionId: string;
  active: TabKey;
}) {
  return (
    <nav className="mb-6 flex gap-1 border-b border-adm-line" aria-label="Assessment sections">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`/admin/content/${versionId}/${tab.path}`}
          aria-current={active === tab.key ? "page" : undefined}
          className={`-mb-px border-b-2 px-3 py-2 text-[13px] font-semibold transition-colors ${
            active === tab.key
              ? "border-adm-violet text-adm-violet"
              : "border-transparent text-adm-ink-muted hover:text-adm-ink"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
