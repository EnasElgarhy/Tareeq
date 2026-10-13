"use client";

import { useMemo } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { ReportAccessExperience } from "@/components/results/report-access/ReportAccessExperience";
import type { CareerBank } from "@/lib/core-v2/bank";
import { buildReportModel } from "@/lib/core-v2/report-model";
import type { CoreResult } from "@/lib/core-v2/types";
import { CoreReport } from "./CoreReport";
import { LockedCoreStory } from "./LockedCoreStory";

interface CoreReportScreenProps {
  generatedAt: string;
  result: CoreResult;
  bank: CareerBank;
  isFlagged: boolean;
  isFlagsLive: boolean;
  email: string;
  /** Sample data: show the preview note and, when asked, skip the paywall. */
  preview?: { isUnlocked: boolean };
}

/**
 * The Compass tab for a CORE 2.0 result: the same paywall as before, then
 * the report as navigable sections.
 */
export function CoreReportScreen({
  generatedAt,
  result,
  bank,
  isFlagged,
  isFlagsLive,
  email,
  preview,
}: CoreReportScreenProps) {
  const { t } = useLocale();
  const model = useMemo(
    () => buildReportModel(result, bank, { isFlagged, isFlagsLive }),
    [result, bank, isFlagged, isFlagsLive],
  );

  const report = (
    <>
      <header className="grid gap-1 pt-1 lg:pt-2">
        <h1 className="daybreak-heading text-[30px] leading-tight text-[color:var(--day-ink)] lg:text-[38px]">
          {t("home.compass.title")}
        </h1>
        <p className="max-w-[58ch] text-[13px] leading-relaxed text-[color:var(--day-ink-2)] lg:text-[15px]">
          {t("home.compass.subtitle")}
        </p>
      </header>
      <CoreReport model={model} generatedAt={generatedAt} />
    </>
  );

  return (
    <section className="flex flex-1 flex-col gap-4 pb-6">
      {preview ? (
        <p
          role="note"
          className="rounded-[14px] border border-dashed border-[color:var(--daybreak-violet)] bg-[color:var(--day-card)] px-3.5 py-2.5 text-[12px] font-semibold text-[color:var(--daybreak-violet)]"
        >
          {t("core.preview.banner")}
        </p>
      ) : null}
      {preview?.isUnlocked ? (
        <div className="daybreak-reveal flex w-full flex-col gap-5">{report}</div>
      ) : (
        <ReportAccessExperience
          generatedAt={generatedAt}
          email={email}
          renderLocked={(locked) => <LockedCoreStory model={model} {...locked} />}
        >
          {report}
        </ReportAccessExperience>
      )}
    </section>
  );
}
