"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { Block } from "../parts";
import styles from "../ReportDesign.module.css";
import { LETTER_FILL } from "./palette";

const LETTERS = ["C", "O", "R", "E"] as const;

/** Anchor id of each letter's card on the At a glance screen. */
export function glanceCardId(letter: (typeof LETTERS)[number]): string {
  return `core-glance-${letter}`;
}

function formatReportDate(
  iso: string | undefined,
  locale: string,
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(locale === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Top of At a glance: report date and title, then a compact CORE key
 * that jumps to each card below without competing with the result.
 */
export function GlanceHeader({
  generatedAt,
  hideKey = false,
}: {
  generatedAt?: string;
  /** The card stack has its own C·O·R·E tabs, so the key is not repeated. */
  hideKey?: boolean;
}) {
  const { t, locale } = useLocale();
  const date = formatReportDate(generatedAt, locale);

  return (
    <header className={styles.glanceHeader}>
      <div>
        {date ? (
          <p className={styles.reportDate}>
            {t("core.glance.report_date").replace("{date}", date)}
          </p>
        ) : null}
        <h2 className={`daybreak-heading ${styles.glanceTitle}`}>
          <Block id="S2-TITLE" />
        </h2>
      </div>

      {hideKey ? null : (
        <nav aria-label={t("core.glance.key_label")}>
          <ul className={styles.keyList}>
            {LETTERS.map((letter) => (
              <li key={letter}>
                <a href={`#${glanceCardId(letter)}`} className={styles.keyLink}>
                  <span
                    className={styles.keyLetter}
                    style={{ color: LETTER_FILL[letter] }}
                  >
                    {letter}
                  </span>
                  <span>{t(`core.glance.key.${letter}`)}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
