"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { useToast } from "@/components/admin/ui/Toast";
import { type Locale, LOCALE_LABELS } from "@/lib/admin/locales";
import { autoTranslateAssessment } from "@/lib/admin/translate-actions";
import {
  coverageByLocale,
  type TranslationGap,
} from "@/lib/admin/translation-coverage";

interface Props {
  catalogId: string;
  versionId: string;
  supportedLocales: Locale[];
  primaryLanguage: Locale;
  gaps: TranslationGap[];
}

export function TranslationsPanel({
  catalogId,
  versionId,
  supportedLocales,
  primaryLanguage,
  gaps,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const byLocale = coverageByLocale(gaps, supportedLocales);

  async function translate(locale: Locale) {
    setBusy(locale);
    try {
      const { translated } = await autoTranslateAssessment(catalogId, versionId, locale);
      toast(
        "success",
        translated > 0
          ? `Translated ${translated} field(s) to ${LOCALE_LABELS[locale]} — review them.`
          : "Nothing to translate.",
      );
      router.refresh();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Translation failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {supportedLocales.map((locale) => {
          const missing = byLocale[locale] ?? 0;
          const complete = missing === 0;
          return (
            <div
              key={locale}
              className="flex items-center justify-between rounded-adm-lg border border-adm-line bg-adm-card p-4"
            >
              <div>
                <p className="text-sm font-bold text-adm-ink">
                  {LOCALE_LABELS[locale]}
                  {locale === primaryLanguage ? (
                    <span className="ml-2 text-[11px] font-semibold text-adm-ink-faint">
                      primary
                    </span>
                  ) : null}
                </p>
                <p
                  className={`text-[12px] font-medium ${
                    complete ? "text-adm-ink-muted" : "text-adm-error-ink"
                  }`}
                >
                  {complete ? "✓ Complete" : `${missing} field(s) missing`}
                </p>
              </div>
              {!complete && locale !== primaryLanguage ? (
                <Button
                  size="sm"
                  onClick={() => translate(locale)}
                  loading={busy === locale}
                >
                  Auto-translate with AI
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>

      {gaps.length > 0 ? (
        <div className="rounded-adm-lg border border-adm-line bg-adm-card p-4">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-adm-ink-faint">
            Missing ({gaps.length})
          </h3>
          <ul className="grid gap-1">
            {gaps.slice(0, 80).map((g, i) => (
              <li key={i} className="text-[12px] text-adm-ink-soft">
                <span className="font-semibold text-adm-ink">{g.locale}</span> · {g.kind}{" "}
                <code className="text-adm-ink-muted">{g.ref}</code> · {g.field}
              </li>
            ))}
          </ul>
          {gaps.length > 80 ? (
            <p className="mt-2 text-[12px] text-adm-ink-faint">
              …and {gaps.length - 80} more.
            </p>
          ) : null}
          <p className="mt-3 text-[12px] text-adm-ink-muted">
            AI translations are machine-generated — review them in the Questions and
            Scoring editors before publishing.
          </p>
        </div>
      ) : (
        <p className="rounded-adm-lg border border-adm-line bg-adm-card px-4 py-6 text-center text-[13px] font-medium text-adm-ink-soft">
          ✓ All required fields are translated for every supported language.
        </p>
      )}
    </section>
  );
}
