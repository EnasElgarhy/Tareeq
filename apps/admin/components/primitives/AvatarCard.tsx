import type { ReactNode } from "react";

interface AvatarCardProps {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}

/**
 * The coral-glowing character holder above the speech bubble.
 * 144 × 144, 32px radius, coral gradient, soft inner highlight.
 */
export function AvatarCard({
  children,
  className,
  "aria-label": ariaLabel,
}: AvatarCardProps) {
  return (
    <div
      className={`tareeq-avatar-card ${className ?? ""}`}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    >
      {children}
    </div>
  );
}
