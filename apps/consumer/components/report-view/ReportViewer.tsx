"use client";

import { useMemo } from "react";
import { CoreReport } from "@/components/core-report/CoreReport";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { coreBank } from "@/lib/core-v2/content/core-content";
import { buildReportModel } from "@/lib/core-v2/report-model";
import type { CoreResult } from "@/lib/core-v2/types";
import type { Locale } from "@/lib/i18n/locale";

interface ReportViewerProps {
  result: CoreResult;
  generatedAt: string;
  locale: Locale;
  /** The signed link's parts, kept when switching language. */
  linkQuery: { exp: string; sig: string };
}

const LANGUAGES: readonly { locale: Locale; label: string }[] = [
  { locale: "en", label: "English" },
  { locale: "ar", label: "العربية" },
];

function Report({
  result,
  generatedAt,
  locale,
}: Omit<ReportViewerProps, "linkQuery">) {
  const model = useMemo(
    () =>
      buildReportModel(
        result,
        coreBank(locale),
        { isFlagged: false, isFlagsLive: false },
        locale,
      ),
    [result, locale],
  );
  return <CoreReport model={model} generatedAt={generatedAt} />;
}

/** The full report, read-only, with a bar saying whose view this is. */
export function ReportViewer({
  result,
  generatedAt,
  locale,
  linkQuery,
}: ReportViewerProps) {
  return (
    <LocaleProvider initialLocale={locale}>
      {/* surface-day carries the report's colour tokens, as AppShell does. */}
      <div className="surface-day relative min-h-dvh text-[color:var(--day-ink)]">
        <header
          dir="ltr"
          className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 border-b border-[#14101F]/10 bg-[#221248] px-4 py-2.5 text-[13px] text-[#F5EEE6]"
        >
          <p className="font-semibold">
            Admin view · read-only · the student sees this report
          </p>
          <nav aria-label="Report language" className="flex gap-1">
            {LANGUAGES.map((lang) => (
              <a
                key={lang.locale}
                href={`?${new URLSearchParams({ ...linkQuery, lang: lang.locale }).toString()}`}
                aria-current={lang.locale === locale ? "true" : undefined}
                className="rounded-full px-3 py-1 font-semibold aria-[current=true]:bg-[#F4C660] aria-[current=true]:text-[#14101F] hover:bg-white/10"
              >
                {lang.label}
              </a>
            ))}
          </nav>
        </header>
        <main
          dir={locale === "ar" ? "rtl" : "ltr"}
          lang={locale}
          className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 px-4 py-6"
        >
          <Report result={result} generatedAt={generatedAt} locale={locale} />
        </main>
      </div>
    </LocaleProvider>
  );
}

const MESSAGES = {
  expired: {
    title: "This link has expired",
    body: "Report links from the admin work for 15 minutes. Open the report again from the admin's Responses page.",
  },
  unavailable: {
    title: "This report isn't available",
    body: "The assessment wasn't found, isn't a CORE assessment, or its answers are incomplete.",
  },
} as const;

export function ReportViewMessage({ kind }: { kind: keyof typeof MESSAGES }) {
  const message = MESSAGES[kind];
  return (
    <main className="grid min-h-dvh place-items-center bg-[#08051A] px-6 text-center text-[#F5EEE6]">
      <div className="max-w-sm">
        <h1 className="text-xl font-bold">{message.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#F5EEE6]/75">
          {message.body}
        </p>
      </div>
    </main>
  );
}
