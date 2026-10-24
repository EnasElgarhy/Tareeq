import {
  codeLabel,
  type CoreItem,
  type CoreQuestionSetDoc,
} from "@/lib/admin/core/framework";

/** Read-only CORE question: stem and options in English and Arabic, with codes. */
export function CoreItemCard({
  item,
  doc,
}: {
  item: CoreItem;
  doc: CoreQuestionSetDoc;
}) {
  return (
    <article
      aria-labelledby={`core-${item.item_id}`}
      className="rounded-adm-lg border border-adm-line bg-adm-card p-4"
    >
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <span
          id={`core-${item.item_id}`}
          className="rounded bg-adm-sand px-1.5 py-0.5 text-[11px] font-bold text-adm-ink-muted"
        >
          {item.item_id}
        </span>
        {item.axis ? (
          <span className="rounded bg-adm-violet/10 px-1.5 py-0.5 text-[11px] font-bold text-adm-deep">
            axis: {item.axis}
          </span>
        ) : null}
        {item.context_zone ? (
          <span className="text-[11px] text-adm-ink-muted">
            {item.context_zone}
          </span>
        ) : null}
        {item.review_status ? (
          <span className="ml-auto text-[11px] text-adm-ink-faint">
            {item.review_status}
          </span>
        ) : null}
      </header>
      <div className="grid gap-1 sm:grid-cols-2 sm:gap-4">
        <p className="text-[14px] font-semibold text-adm-ink">{item.stem_en}</p>
        <p
          dir="rtl"
          lang="ar"
          className="text-[14px] font-semibold text-adm-ink"
        >
          {item.stem_ar}
        </p>
      </div>
      <ul className="mt-3 grid gap-1.5">
        {item.options.map((o) => (
          <li
            key={o.option_id}
            className="grid items-start gap-1 rounded-adm-md bg-adm-sand px-3 py-2 sm:grid-cols-[1fr_1fr_auto] sm:gap-4"
          >
            <span className="text-[13px] text-adm-ink-soft">{o.text_en}</span>
            <span dir="rtl" lang="ar" className="text-[13px] text-adm-ink-soft">
              {o.text_ar}
            </span>
            <span
              title={codeLabel(doc, o.code)}
              className="justify-self-start rounded-full bg-adm-violet/10 px-2 py-0.5 text-[11px] font-bold text-adm-violet sm:justify-self-end"
            >
              {o.code}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
