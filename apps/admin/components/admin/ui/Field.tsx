"use client";

import {
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useId,
} from "react";

const control =
  "w-full rounded-adm-sm border bg-adm-card text-adm-ink text-[15px] " +
  "placeholder:text-adm-ink-faint transition-colors duration-adm-fast " +
  "border-adm-line-strong hover:border-adm-ink-faint " +
  "focus:border-adm-violet focus:outline-none focus:ring-2 focus:ring-adm-violet/25 " +
  "disabled:bg-adm-sand disabled:text-adm-ink-muted disabled:cursor-not-allowed";

const controlError = "border-adm-error focus:border-adm-error focus:ring-adm-error/25";

export function Label({
  className = "",
  children,
  ...rest
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`mb-1.5 block text-[13px] font-semibold text-adm-ink-soft ${className}`}
      {...rest}
    >
      {children}
    </label>
  );
}

export interface FieldProps {
  label: ReactNode;
  error?: string;
  hint?: string;
  children: (props: {
    id: string;
    "aria-invalid"?: true;
    "aria-describedby"?: string;
  }) => ReactNode;
}

/** Wires label, hint and error to the control with correct aria. */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        ...(error ? { "aria-invalid": true as const, "aria-describedby": msgId } : {}),
      })}
      {error ? (
        <p id={msgId} role="alert" className="mt-1.5 text-xs font-medium text-adm-error-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="mt-1.5 text-xs text-adm-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid, className = "", ...rest }: InputProps) {
  return (
    <input
      className={`${control} ${invalid ? controlError : ""} h-10 px-3 ${className}`}
      {...rest}
    />
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ invalid, className = "", children, ...rest }: SelectProps) {
  return (
    <select
      className={`${control} ${invalid ? controlError : ""} h-10 px-3 pr-8 ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ invalid, className = "", ...rest }: TextareaProps) {
  return (
    <textarea
      className={`${control} ${invalid ? controlError : ""} min-h-[96px] px-3 py-2.5 ${className}`}
      {...rest}
    />
  );
}
