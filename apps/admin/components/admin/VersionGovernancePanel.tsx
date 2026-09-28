"use client";

import Link from "next/link";
import { useState } from "react";

interface VersionGovernancePanelProps {
  /** Human label of this published version (e.g. "CORE Compass v4"). */
  label: string;
  /** ISO timestamp the version row was created (proxy for "live since"). */
  createdAt: string;
  /** Total responses attached to this version. */
  responseCount: number;
  /** How many of those responses were completed. */
  completedCount: number;
  /** Number of questions in this version. */
  questionCount: number;
  /**
   * Link target for the Translations tab (still editable on published CORE
   * versions). Omitted for custom assessments, which are edited bilingually
   * inline and have no separate translations tab.
   */
  translationsHref?: string;
}

function formatDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  return new Date(t).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysSince(iso: string): number | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000)));
}

/** One node in the lifecycle flow. `here` marks the reader's current step. */
function FlowStep({ children, here = false }: { children: React.ReactNode; here?: boolean }) {
  return (
    <span
      className={
        here
          ? "rounded-adm-md bg-adm-violet px-2.5 py-1 text-[12px] font-bold text-white"
          : "rounded-adm-md bg-adm-card px-2.5 py-1 text-[12px] font-semibold text-adm-ink-soft ring-1 ring-adm-line"
      }
    >
      {children}
    </span>
  );
}

function Arrow() {
  return (
    <span aria-hidden="true" className="px-0.5 text-adm-ink-faint">
      →
    </span>
  );
}

/**
 * Read-only governance panel shown at the top of a published (live) version.
 * Communicates the mental model — this is an immutable snapshot, WHY it's
 * immutable, and how to make changes (clone → edit → publish) — instead of
 * presenting editable-looking fields that silently do nothing.
 *
 * Purely informational: it changes no data and gates no behavior (the page
 * already renders read-only question cards for published versions).
 */
export function VersionGovernancePanel({
  label,
  createdAt,
  responseCount,
  completedCount,
  questionCount,
  translationsHref,
}: VersionGovernancePanelProps) {
  const [showWhy, setShowWhy] = useState(false);
  const days = daysSince(createdAt);

  return (
    <section
      aria-label="Version governance"
      className="adm-fade-up mb-6 overflow-hidden rounded-adm-lg border border-adm-line bg-adm-sand"
    >
      {/* Header: snapshot identity */}
      <div className="border-l-4 border-adm-violet px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-adm-violet/12 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-adm-violet">
            Published snapshot
          </span>
          <span className="text-[13px] font-semibold text-adm-ink">{label}</span>
        </div>
        <p className="mt-2 text-[14px] font-semibold text-adm-ink">
          You’re viewing a published snapshot — it can’t be edited.
        </p>
        <p className="mt-0.5 text-[13px] text-adm-ink-soft">
          Responses and analytics depend on this version staying exactly as it
          is. To change anything, clone it to a draft and publish a new version.
        </p>

        {/* Lineage / stats strip (from real data only) */}
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-adm-ink-muted">
          <div className="flex items-center gap-1.5">
            <dt className="font-semibold text-adm-ink-soft">Live since</dt>
            <dd>{formatDate(createdAt)}{days !== null ? ` · ${days} day${days === 1 ? "" : "s"}` : ""}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="font-semibold text-adm-ink-soft">Responses</dt>
            <dd>
              {responseCount.toLocaleString()} attached
              {responseCount > 0 ? ` (${completedCount.toLocaleString()} completed)` : ""}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="font-semibold text-adm-ink-soft">Questions</dt>
            <dd>{questionCount}</dd>
          </div>
        </dl>
      </div>

      {/* Lifecycle flow */}
      <div className="flex flex-wrap items-center gap-1 border-t border-adm-line bg-adm-card/40 px-5 py-3 text-[12px]">
        <FlowStep here>This version (live)</FlowStep>
        <Arrow />
        <FlowStep>Clone to draft</FlowStep>
        <Arrow />
        <FlowStep>Edit draft</FlowStep>
        <Arrow />
        <FlowStep>Publish new version</FlowStep>
        <span className="ml-1 text-adm-ink-faint">
          — new students get the new version; existing responses stay attached to
          this one, forever.
        </span>
      </div>

      {/* Why disclosure + translations note */}
      <div className="border-t border-adm-line px-5 py-3">
        <button
          type="button"
          onClick={() => setShowWhy((v) => !v)}
          aria-expanded={showWhy}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-adm-violet transition hover:text-adm-deep"
        >
          <span aria-hidden="true" className={showWhy ? "rotate-90 transition" : "transition"}>
            ›
          </span>
          Why can’t I edit published content?
        </button>
        {showWhy && (
          <ul className="mt-2.5 grid gap-1.5 pl-1 text-[13px] text-adm-ink-soft">
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-adm-violet">•</span>
              Historical assessments must stay reproducible — a student’s result
              only means something against the exact questions they answered.
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-adm-violet">•</span>
              Changing questions after students answer them would invalidate
              comparisons across cohorts and over time.
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-adm-violet">•</span>
              Analytics, archetypes and Compass results are all computed against
              a fixed version. Editing in place would silently rewrite history.
            </li>
          </ul>
        )}
        <p className="mt-3 text-[12px] text-adm-ink-muted">
          <span className="font-semibold text-adm-ink-soft">Cloning to a draft</span>{" "}
          duplicates every question (keeping their IDs), creates a new version
          you can edit freely, and leaves this version’s responses untouched.
          {translationsHref && (
            <>
              {" "}
              Arabic translations can still be edited here on the{" "}
              <Link href={translationsHref} className="font-semibold text-adm-violet underline">
                Translations
              </Link>{" "}
              tab without cloning.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
