import { CoreBreadcrumb, CoreTabs } from "@/components/admin/core/CoreTabs";
import PageHeader from "@/components/admin/PageHeader";
import {
  CORE_BANK,
  CORE_QUESTION_SET,
  codeLabel,
} from "@/lib/admin/core/framework";

export const dynamic = "force-static";

/** Career bank 1.1, view-only: the consumer ships it as a file. */
export default function CoreBankPage() {
  const jobCount = CORE_BANK.families.reduce((n, f) => n + f.jobs.length, 0);
  const families = [...CORE_BANK.families].sort(
    (a, b) =>
      a.clusters.join().localeCompare(b.clusters.join()) ||
      a.bank_order - b.bank_order,
  );
  return (
    <>
      <CoreBreadcrumb
        trail={[
          { label: "CORE 2.0", href: "/admin/content/core" },
          { label: "Career bank" },
        ]}
      />
      <PageHeader
        kicker={`Career bank · ${CORE_BANK.families.length} families · ${jobCount} jobs`}
        title={`Career bank ${CORE_BANK.version}`}
        description={`View-only (${CORE_BANK.status}, ${CORE_BANK.date}). ${CORE_BANK.source_credit}`}
      />
      <CoreTabs active="bank" />
      <div className="grid gap-3">
        {families.map((f) => (
          <details
            key={f.family_id}
            className="rounded-adm-lg border border-adm-line bg-adm-card"
          >
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-4 py-3">
              <span className="rounded bg-adm-sand px-1.5 py-0.5 text-[11px] font-bold text-adm-ink-muted">
                {f.family_id}
              </span>
              <span className="text-[14px] font-semibold text-adm-ink">
                {f.family}
              </span>
              <span
                dir="rtl"
                lang="ar"
                className="text-[13px] text-adm-ink-soft"
              >
                {f.family_ar}
              </span>
              <span className="ms-auto flex gap-1">
                {f.clusters.map((c) => (
                  <span
                    key={c}
                    title={codeLabel(CORE_QUESTION_SET, c)}
                    className="rounded-full bg-adm-violet/10 px-2 py-0.5 text-[11px] font-bold text-adm-violet"
                  >
                    {c}
                  </span>
                ))}
              </span>
            </summary>
            <div className="border-t border-adm-line px-4 py-3">
              <p className="mb-2 text-[12px] text-adm-ink-muted">
                {f.study_fields}
              </p>
              <ul className="grid gap-1 text-[13px]">
                {f.jobs.map((j) => (
                  <li
                    key={j.job_id}
                    className="flex flex-wrap gap-x-3 gap-y-0.5"
                  >
                    <span className="font-semibold text-adm-ink">{j.job}</span>
                    <span dir="rtl" lang="ar" className="text-adm-ink-soft">
                      {j.job_ar}
                    </span>
                    <span className="text-[12px] text-adm-ink-faint">
                      {[j.structure, j.focus, j.team, j.setting].join(" · ")}
                      {j.changing_work ? " · changing work" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
