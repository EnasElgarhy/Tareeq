import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "ghost"
  | "ghost-on-dark"
  | "destructive";

type Size = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

/**
 * Tareeq Button — verb-first, sentence case labels only.
 * One Primary per view. Coral is for forward action, not decoration.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth,
    loading,
    iconLeft,
    iconRight,
    children,
    disabled,
    className,
    style,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-variant={variant}
      data-size={size}
      className={`tareeq-btn ${className ?? ""}`}
      style={{ width: fullWidth ? "100%" : undefined, ...style }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Loader2 aria-hidden="true" size={16} className="animate-spin" />
      ) : (
        iconLeft
      )}
      <span>{children}</span>
      {!loading && iconRight ? (
        <span data-flip-rtl className="inline-flex">
          {iconRight}
        </span>
      ) : null}
    </button>
  );
});
