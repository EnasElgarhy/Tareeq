import { CoreBreadcrumb, CoreTabs } from "@/components/admin/core/CoreTabs";
import PageHeader from "@/components/admin/PageHeader";
import {
  CORE_WORDING,
  type CoreWordingBlock,
} from "@/lib/admin/core/framework";

export const dynamic = "force-static";

function groupBySection(
  blocks: CoreWordingBlock[],
): [string, CoreWordingBlock[]][] {
  const groups = new Map<string, CoreWordingBlock[]>();
  for (const block of blocks) {
    groups.set(block.section, [...(groups.get(block.section) ?? []), block]);
  }
  return [...groups.entries()];
}

/** Report wording 2026-10-19, view-only: the consumer ships it as a file. */
export default function CoreWordingPage() {
  const sections = groupBySection(CORE_WORDING.blocks);
  return (
    <>
      <CoreBreadcrumb
        trail={[
          { label: "CORE 2.0", href: "/admin/content/core" },
          { label: "Report wording" },
        ]}
      />
      <PageHeader
        kicker={`Report wording · ${CORE_WORDING.blocks.length} blocks`}
        title={`Report wording ${CORE_WORDING.date}`}
        description="View-only. Changes come from the client as a new wording file, shipped with the app. Text in [brackets] is filled from the student's result."
      />
      <CoreTabs active="wording" />
      {sections.map(([section, blocks]) => (
        <section key={section} className="mb-8">
          <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-adm-ink-muted">
            {section} ({blocks.length})
          </h2>
          <div className="grid gap-3">
            {blocks.map((b) => (
              <article
                key={b.block_id}
                className="rounded-adm-lg border border-adm-line bg-adm-card p-4"
              >
                <p className="mb-2 text-[11px] font-bold text-adm-ink-muted">
                  {b.block_id}
                  <span className="ms-2 font-semibold text-adm-ink-faint">
                    {b.purpose}
                  </span>
                </p>
                <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                  <p className="whitespace-pre-line text-[13px] text-adm-ink-soft">
                    {b.text_en}
                  </p>
                  <p
                    dir="rtl"
                    lang="ar"
                    className="whitespace-pre-line text-[13px] text-adm-ink-soft"
                  >
                    {b.text_ar}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
