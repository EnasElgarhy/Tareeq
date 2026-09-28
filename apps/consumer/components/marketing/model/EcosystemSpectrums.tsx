"use client";

import { useId, useState } from "react";
import styles from "./EcosystemSpectrums.module.css";
import { SPECTRUMS, type SpectrumPole } from "./modelContent";

const ACCENT = "#2F7A64";
const MIDDLE = 50;
/** Distance from the middle before an end lights up. */
const LEAN = 10;

function Pole({ pole, isActive }: { pole: SpectrumPole; isActive: boolean }) {
  const Icon = pole.icon;
  return (
    <span className="flex w-16 shrink-0 flex-col items-center gap-2 text-center sm:w-20">
      <span
        className="flex size-12 items-center justify-center rounded-2xl transition-[background-color,color,transform] duration-300"
        style={
          isActive
            ? { background: ACCENT, color: "#FFFCF6", transform: "scale(1.08)" }
            : { background: `${ACCENT}1A`, color: ACCENT }
        }
      >
        <Icon size={24} weight="duotone" aria-hidden="true" />
      </span>
      <span className="text-xs font-medium text-[var(--day-ink)] sm:text-sm">
        {pole.label}
      </span>
    </span>
  );
}

function Spectrum({ name, poles }: (typeof SPECTRUMS)[number]) {
  const id = useId();
  const [value, setValue] = useState(MIDDLE);
  const [left, right] = poles;
  const valueText =
    value < MIDDLE - LEAN
      ? `Leaning ${left.label.toLowerCase()}`
      : value > MIDDLE + LEAN
        ? `Leaning ${right.label.toLowerCase()}`
        : "Balanced";

  return (
    <div className="rounded-2xl bg-[var(--day-bg)] p-5 sm:p-6">
      <label
        htmlFor={id}
        className="font-heading block text-lg font-semibold text-[var(--day-ink)]"
      >
        {name}
      </label>
      <div className="mt-5 flex items-start gap-2 sm:gap-4">
        <Pole pole={left} isActive={value < MIDDLE - LEAN} />
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          aria-valuetext={valueText}
          className={`${styles.range} mt-[21px] min-w-0 flex-1`}
          style={{
            background: `linear-gradient(90deg, ${ACCENT}, #6FE0C0 50%, ${ACCENT})`,
          }}
        />
        <Pole pole={right} isActive={value > MIDDLE + LEAN} />
      </div>
    </div>
  );
}

export function EcosystemSpectrums() {
  return (
    <div className="rounded-[28px] border border-[var(--day-line)] bg-[var(--day-card)] p-5 shadow-[var(--day-shadow-hero)] sm:p-8">
      <p className="font-heading text-lg font-semibold text-[var(--day-ink)]">
        Where would you sit?
      </p>
      <p className="mt-1 text-sm text-[var(--day-ink-3)]">
        Drag the dot — neither end is better.
      </p>
      <div className="mt-6 space-y-3">
        {SPECTRUMS.map((s) => (
          <Spectrum key={s.name} {...s} />
        ))}
      </div>
    </div>
  );
}
