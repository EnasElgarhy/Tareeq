import type { ReactNode } from "react";

/** Branded empty state — compass glyph, serif headline, optional action. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="adm-fade-up flex flex-col items-center rounded-adm-xl border border-dashed border-adm-line-strong bg-adm-sand/60 px-8 py-16 text-center">
      <svg
        viewBox="0 0 48 48"
        className="mb-5 h-12 w-12"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r="21" stroke="var(--adm-lilac)" strokeWidth="2" />
        <circle cx="24" cy="24" r="14" stroke="var(--adm-line-strong)" strokeWidth="1" strokeDasharray="3 4" />
        <path d="M24 10 L28 24 L24 38 L20 24 Z" fill="var(--adm-violet)" />
        <path d="M24 10 L28 24 H20 Z" fill="var(--adm-gold)" />
        <circle cx="24" cy="24" r="2.5" fill="var(--adm-ink)" />
      </svg>
      <h2 className="adm-display text-2xl">{title}</h2>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-adm-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
