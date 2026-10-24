import Link from "next/link";
import { CoreDraftsPanel } from "@/components/admin/core/CoreDraftsPanel";
import { CoreItemCard } from "@/components/admin/core/CoreItemCard";
import { CoreBreadcrumb, CoreTabs } from "@/components/admin/core/CoreTabs";
import { GenerationBadge } from "@/components/admin/GenerationBadge";
import PageHeader from "@/components/admin/PageHeader";
import { versionIdsOf } from "@/lib/admin/assessment-generation";
import { loadVersionGenerations } from "@/lib/admin/assessment-generation.server";
import { listCoreDrafts } from "@/lib/admin/core/drafts";
import {
  CORE_AXES,
  CORE_AXIS_SIDES,
  CORE_PACKAGE_VERSIONS,
  CORE_PARTS,
  CORE_QUESTION_SET,
  countItems,
  itemsInOrder,
} from "@/lib/admin/core/framework";
import { getVersionResponseStats } from "@/lib/admin/responses";

export const dynamic = "force-dynamic";

const doc = CORE_QUESTION_SET;

function CodeList({
  title,
  codes,
}: {
  title: string;
  codes: Record<string, string>;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-adm-ink-muted">
        {title}
      </h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
        {Object.entries(codes).map(([code, name]) => (
          <div key={code} className="contents">
            <dt className="font-bold text-adm-violet">{code}</dt>
            <dd className="text-adm-ink-soft">{name}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default async function CoreFrameworkPage() {
  const [drafts, generations] = await Promise.all([
    listCoreDrafts(),
    loadVersionGenerations(),
  ]);
  const coreVersionId = versionIdsOf(generations, "core-2.0")[0] ?? null;
  const stats = coreVersionId
    ? await getVersionResponseStats(coreVersionId)
    : null;

  return (
    <>
      <CoreBreadcrumb trail={[{ label: "CORE 2.0" }]} />
      <PageHeader
        kicker={`Current assessment · ${countItems(doc)} questions in ${CORE_PARTS.length} parts`}
        title="CORE 2.0"
        description={`Question set ${CORE_PACKAGE_VERSIONS.questionSet} (${doc.date}), scoring ${CORE_PACKAGE_VERSIONS.scoring}, report wording ${CORE_PACKAGE_VERSIONS.reportWording}, career bank ${CORE_PACKAGE_VERSIONS.bank}. Its own structure: curiosities, two-sided axes and motivators, not the v4 clusters.`}
        actions={
          <>
            <GenerationBadge generation="core-2.0" />
            {coreVersionId ? (
              <Link
                href={`/admin/responses/${coreVersionId}`}
                className="rounded-adm-md border border-adm-line px-3 py-1.5 text-[13px] font-semibold text-adm-ink-soft transition hover:bg-adm-sand hover:text-adm-ink"
              >
                Responses{stats ? ` · ${stats.completed}` : ""}
              </Link>
            ) : null}
          </>
        }
      />
      <CoreTabs active="questions" />

      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section
          aria-labelledby="core-codes"
          className="rounded-adm-lg border border-adm-line bg-adm-card p-5"
        >
          <h2 id="core-codes" className="mb-4 text-base font-bold text-adm-ink">
            Codes
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <CodeList
              title="Curiosities · part 1"
              codes={doc.codes.curiosities}
            />
            <CodeList
              title="Motivators · part 3"
              codes={doc.codes.motivators}
            />
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-adm-ink-muted">
                Axes · parts 2 and 4
              </h3>
              <ul className="grid gap-1.5 text-[13px]">
                {CORE_AXES.map((axis) => {
                  const { sideA, sideB } = CORE_AXIS_SIDES[axis];
                  return (
                    <li key={axis}>
                      <span className="font-bold capitalize text-adm-ink">
                        {axis}
                      </span>
                      <span className="text-adm-ink-soft">
                        {" "}
                        · <b className="text-adm-violet">{sideA}</b> or{" "}
                        <b className="text-adm-violet">{sideB}</b>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <ul className="mt-5 list-disc space-y-1 ps-5 text-[12px] text-adm-ink-muted">
            {doc.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
        <CoreDraftsPanel drafts={drafts} baseVersion={doc.version} />
      </div>

      {CORE_PARTS.map((part) => {
        const items = itemsInOrder(doc, part.pillar);
        return (
          <section
            key={part.pillar}
            aria-labelledby={`part-${part.part}`}
            className="mb-8"
          >
            <h2
              id={`part-${part.part}`}
              className="mb-3 text-[13px] font-bold uppercase tracking-wide text-adm-ink-muted"
            >
              Part {part.part} · {part.name} ({items.length})
              <span className="ms-2 font-semibold normal-case tracking-normal text-adm-ink-faint">
                scores{" "}
                {part.axes.length > 0
                  ? `axes: ${part.axes.join(", ")}`
                  : part.scores}
              </span>
            </h2>
            <div className="grid gap-3">
              {items.map((item) => (
                <CoreItemCard key={item.item_id} item={item} doc={doc} />
              ))}
            </div>
          </section>
        );
      })}

      <section aria-labelledby="core-background" className="mb-8">
        <h2
          id="core-background"
          className="mb-3 text-[13px] font-bold uppercase tracking-wide text-adm-ink-muted"
        >
          Background questions ({doc.background_questions.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {doc.background_questions.map((q) => (
            <article
              key={q.question_id}
              className="rounded-adm-lg border border-adm-line bg-adm-card p-4"
            >
              <p className="text-[11px] font-bold text-adm-ink-muted">
                {q.question_id} · {q.heading_en}
              </p>
              <p className="mt-1 text-[13px] font-semibold text-adm-ink">
                {q.text_en}
              </p>
              <p
                dir="rtl"
                lang="ar"
                className="mt-1 text-[13px] text-adm-ink-soft"
              >
                {q.text_ar}
              </p>
              {q.options.length > 0 ? (
                <p className="mt-2 text-[12px] text-adm-ink-muted">
                  {q.options.map((o) => o.text_en).join(" · ")}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="core-screens">
        <h2
          id="core-screens"
          className="mb-3 text-[13px] font-bold uppercase tracking-wide text-adm-ink-muted"
        >
          Screens ({doc.screens.length})
        </h2>
        <div className="grid gap-3">
          {doc.screens.map((s) => (
            <article
              key={s.screen_id}
              className="grid gap-2 rounded-adm-lg border border-adm-line bg-adm-card p-4 sm:grid-cols-[8rem_1fr_1fr]"
            >
              <p className="text-[11px] font-bold text-adm-ink-muted">
                {s.screen_id}
                <span className="block font-semibold text-adm-ink-faint">
                  {s.purpose}
                </span>
              </p>
              <p className="text-[13px] text-adm-ink-soft">{s.text_en}</p>
              <p dir="rtl" lang="ar" className="text-[13px] text-adm-ink-soft">
                {s.text_ar}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
