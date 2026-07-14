import type { ReactNode } from "react";

type Tone = "brand" | "accent" | "neutral" | "success" | "on-dark";

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  /** Render a small leading dot in the badge color */
  withDot?: boolean;
}

export function Badge({
  tone = "brand",
  children,
  className,
  withDot,
}: BadgeProps) {
  return (
    <span className={`tareeq-badge tareeq-badge--${tone} ${className ?? ""}`}>
      {withDot ? (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full"
          style={{
            background:
              tone === "accent"
                ? "var(--coral)"
                : tone === "success"
                  ? "var(--success)"
                  : tone === "on-dark"
                    ? "var(--coral)"
                    : "var(--tareeq-plum)",
            boxShadow:
              tone === "accent" || tone === "on-dark"
                ? "0 0 10px rgba(255, 107, 71, 0.55)"
                : undefined,
          }}
        />
      ) : null}
      {children}
    </span>
  );
}
