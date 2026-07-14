import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** "tinted" sits on sand for wells; "default" is the white work card */
  tone?: "default" | "tinted";
  /** adds hover lift — use for clickable/link cards only */
  interactive?: boolean;
}

export function Card({
  tone = "default",
  interactive = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  const toneCls =
    tone === "tinted"
      ? "bg-adm-sand border-adm-line"
      : "bg-adm-card border-adm-line shadow-adm-xs";
  const hoverCls = interactive ? "adm-lift hover:shadow-adm-md" : "";
  return (
    <div
      className={`rounded-adm-lg border ${toneCls} ${hoverCls} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  meta,
  actions,
}: {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-adm-line px-5 py-4">
      <div>
        <h3 className="text-base font-bold text-adm-ink">{title}</h3>
        {meta && <p className="mt-0.5 text-xs text-adm-ink-muted">{meta}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
