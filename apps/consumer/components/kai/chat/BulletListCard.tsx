"use client";

/** A plain structured list — lighter weight than ChecklistCard (no
 * check-off state), for "Teach"-step content that has real structure
 * but isn't a set of actions. */
export function BulletListCard({ title, items }: { title?: string; items: string[] }) {
  return (
    <div className="justify-self-start rounded-[18px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)] sm:max-w-[480px]">
      {title ? (
        <p className="mb-2 text-[13px] font-black leading-tight text-[color:var(--day-ink,#2a2118)]">{title}</p>
      ) : null}
      <ul className="grid gap-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-[12px] leading-snug text-[color:var(--day-ink-2,#5c5142)]">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[color:var(--day-ink-3,#675d4e)]" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
