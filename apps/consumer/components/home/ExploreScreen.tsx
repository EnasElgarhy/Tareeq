"use client";

import { useEffect, useState } from "react";
import { CompassReport } from "@/components/assessment/CompassReport";
import { NoCompassEmptyState } from "@/components/home/NoCompassEmptyState";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { readProfileSnapshot, type ProfileSnapshot } from "@/lib/profile/journey";

/**
 * Explore — the full map: career families, majors, high school subjects,
 * and non-obvious paths from the deterministic CORE report. Deliberately
 * skips repeating the hero result Home already shows up top; this tab is
 * the deep-dive reference material.
 */
export function ExploreScreen() {
  const { t } = useLocale();
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSnapshot(readProfileSnapshot());
    setReady(true);
  }, []);

  if (!ready) return null;
  const report = snapshot?.coreReport ?? null;
  if (!report) {
    return (
      <NoCompassEmptyState
        title={t("home.explore.empty_title")}
        description={t("home.explore.empty_description")}
      />
    );
  }

  return (
    <section className="daybreak-reveal flex flex-1 flex-col gap-5 pb-6">
      <header className="pt-1 lg:pt-2">
        <h1 className="daybreak-heading text-[30px] leading-tight text-[color:var(--day-ink)] lg:text-[38px]">
          {t("home.explore.title")}
        </h1>
        <p className="mt-1 max-w-[58ch] text-[13px] leading-relaxed text-[color:var(--day-ink-2)] lg:text-[15px]">
          {t("home.explore.subtitle")}
        </p>
      </header>

      <CompassReport report={report} kaiHref="/kai?goal=explain_results" />
    </section>
  );
}
