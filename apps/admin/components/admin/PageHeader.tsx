import type { ReactNode } from "react";

/** Editorial page header: violet kicker + display-italic serif title. */
export default function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="adm-fade-up mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="adm-kicker">{kicker}</p>
        <h1 className="adm-display mt-1.5 text-[2rem] leading-tight">{title}</h1>
        {description && (
          <p className="mt-2 max-w-xl text-sm text-adm-ink-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
