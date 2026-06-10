"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

interface TabPlaceholderProps {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  eyebrow: string;
  title: string;
  description: string;
  /** Short preview of what's coming, as bullet chips. */
  preview: string[];
}

/**
 * A designed "coming soon" surface for tabs that aren't built yet. Keeps
 * the tab bar fully navigable and tells the user what each tab will hold,
 * rather than dropping them on a dead screen.
 */
export function TabPlaceholder({
  icon: Icon,
  eyebrow,
  title,
  description,
  preview,
}: TabPlaceholderProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-5 px-2 text-center">
      <span className="grid size-16 place-items-center rounded-[22px] border border-[color:var(--day-line)] bg-[color:var(--day-card)] text-[color:var(--day-ink-2)] shadow-[var(--day-shadow-card)]">
        <Icon size={28} strokeWidth={1.8} />
      </span>
      <div className="grid gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--day-ink-3)]">
          {eyebrow} · Coming soon
        </p>
        <h1 className="text-[24px] font-black leading-tight text-[color:var(--day-ink)]">
          {title}
        </h1>
        <p className="mx-auto max-w-[34ch] text-[13.5px] leading-relaxed text-[color:var(--day-ink-2)]">
          {description}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {preview.map((item) => (
          <span
            key={item}
            className="rounded-full border border-[color:var(--day-line)] bg-[color:var(--day-inset)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--day-ink-2)]"
          >
            {item}
          </span>
        ))}
      </div>
      <Link
        href="/home"
        className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-bold text-[color:var(--day-ink-3)] transition hover:text-[color:var(--day-ink)]"
      >
        <ArrowLeft size={14} />
        Back to Overview
      </Link>
    </section>
  );
}
