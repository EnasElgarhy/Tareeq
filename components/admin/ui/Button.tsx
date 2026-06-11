"use client";

import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";
type Size = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-adm-md " +
  "transition-[transform,opacity,background-color,box-shadow] duration-adm-fast ease-adm " +
  "active:translate-y-px disabled:pointer-events-none select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-adm-violet text-white shadow-adm-sm hover:bg-adm-deep hover:shadow-adm-md " +
    "disabled:bg-adm-line-strong disabled:text-adm-ink-muted disabled:shadow-none",
  ghost:
    "bg-transparent text-adm-ink-soft border border-adm-line-strong hover:border-adm-violet " +
    "hover:text-adm-violet hover:bg-adm-violet/5 disabled:text-adm-ink-muted disabled:border-adm-line",
  danger:
    "bg-transparent text-adm-error-ink border border-adm-error/60 hover:bg-adm-error/10 " +
    "hover:border-adm-error disabled:text-adm-ink-muted disabled:border-adm-line",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-5 text-sm",
};

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin motion-reduce:animate-none"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
