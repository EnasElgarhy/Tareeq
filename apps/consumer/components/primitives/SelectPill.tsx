"use client";

import { ChevronDown } from "lucide-react";
import {
  forwardRef,
  type SelectHTMLAttributes,
} from "react";

interface SelectPillProps extends SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
  options: ReadonlyArray<
    | { value: string; label: string }
    | { groupLabel: string; options: ReadonlyArray<{ value: string; label: string }> }
  >;
}

/**
 * Cream pill on plum surface — the answer input for selectable questions.
 * Uses a native <select> for full keyboard + screen reader support, wrapped
 * in a styled pill so it still looks designed.
 */
export const SelectPill = forwardRef<HTMLSelectElement, SelectPillProps>(
  function SelectPill(
    { placeholder = "Select an option...", options, value, ...rest },
    ref,
  ) {
    const hasValue = value !== undefined && value !== "";

    return (
      <label
        className="tareeq-select-pill"
        data-has-value={hasValue || undefined}
      >
        <select
          ref={ref}
          value={value}
          aria-label={placeholder}
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) =>
            "groupLabel" in opt ? (
              <optgroup key={opt.groupLabel} label={opt.groupLabel}>
                {opt.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ),
          )}
        </select>
        <ChevronDown aria-hidden="true" data-flip-rtl />
      </label>
    );
  },
);
