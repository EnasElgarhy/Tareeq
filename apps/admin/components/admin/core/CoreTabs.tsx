import Link from "next/link";

const TABS = [
  { key: "questions", label: "Question set", href: "/admin/content/core" },
  {
    key: "wording",
    label: "Report wording",
    href: "/admin/content/core/wording",
  },
  { key: "bank", label: "Career bank", href: "/admin/content/core/bank" },
] as const;

export type CoreTab = (typeof TABS)[number]["key"];

/** Section switcher for the CORE 2.0 pages. */
export function CoreTabs({ active }: { active: CoreTab }) {
  return (
    <nav
      aria-label="CORE 2.0 content"
      className="mb-6 border-b border-adm-line"
    >
      <ul className="-mb-px flex gap-1">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-block border-b-2 px-3 py-2 text-[13px] font-semibold transition ${
                  isActive
                    ? "border-adm-violet text-adm-ink"
                    : "border-transparent text-adm-ink-muted hover:border-adm-line-strong hover:text-adm-ink"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Breadcrumb back to the content list. */
export function CoreBreadcrumb({
  trail,
}: {
  trail: { label: string; href?: string }[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 text-[13px] text-adm-ink-muted"
    >
      <Link
        href="/admin/content"
        className="font-semibold text-adm-violet hover:text-adm-deep"
      >
        Content
      </Link>
      {trail.map((t) => (
        <span key={t.label}>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          {t.href ? (
            <Link
              href={t.href}
              className="font-semibold text-adm-violet hover:text-adm-deep"
            >
              {t.label}
            </Link>
          ) : (
            <span className="text-adm-ink-soft">{t.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
