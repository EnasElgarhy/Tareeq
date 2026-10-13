"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Compass,
  Info,
  Route,
  Search,
  Users,
  Flag,
  Footprints,
  ChevronDown,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { ReportModel } from "@/lib/core-v2/report-model";
import type { SectionId } from "@/lib/core-v2/report-plan";
import { ReportSection } from "./sections";
import styles from "./ReportDesign.module.css";

const SECTION_ICONS = {
  "FLAG-NOTE": Flag,
  S1: BookOpen,
  S2: Compass,
  S3: Search,
  S4: Route,
  S5: Footprints,
  S6: Users,
  S7: Info,
} as const;

/**
 * The CORE 2.0 report inside the Compass tab: one section per screen, a
 * chapter sidebar on desktop, a selector on mobile, and Back / Next at
 * the end of each section. The open section lives in the URL (?section=S3) so the browser
 * back button, refresh and shared links land on the same screen.
 */
export function CoreReport({
  model,
  generatedAt,
}: {
  model: ReportModel;
  generatedAt?: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const topRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const { sections } = model;
  const requested = searchParams.get("section");
  const current: SectionId =
    sections.find((id) => id === requested) ?? sections[0];
  const index = sections.indexOf(current);
  const previous = index > 0 ? sections[index - 1] : null;
  const next = index < sections.length - 1 ? sections[index + 1] : null;

  function goTo(section: SectionId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", section);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // A new section starts at its top, with the active desktop chapter in view.
  useEffect(() => {
    if (!requested) return;
    topRef.current?.scrollIntoView({ block: "start" });
    navRef.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [requested]);

  return (
    <div ref={topRef} className={styles.report}>
      <nav
        ref={navRef}
        aria-label={t("core.nav.label")}
        className={styles.navigation}
      >
        <p className={styles.navigationTitle}>{t("core.nav.label")}</p>
        <div className={styles.mobileNavigation}>
          <select
            aria-label={t("core.nav.label")}
            value={current}
            onChange={(event) => {
              const section = sections.find((id) => id === event.target.value);
              if (section) goTo(section);
            }}
          >
            {sections.map((section, i) => (
              <option key={section} value={section}>
                {i + 1}. {t(`core.nav.${section}`)}
              </option>
            ))}
          </select>
          <ChevronDown size={18} aria-hidden="true" />
        </div>
        <ol className={styles.chapterList}>
          {sections.map((section, i) => {
            const isCurrent = section === current;
            const Icon = SECTION_ICONS[section];
            return (
              <li key={section}>
                <button
                  type="button"
                  onClick={() => goTo(section)}
                  aria-current={isCurrent ? "page" : undefined}
                  className={styles.chapter}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span className="sr-only">{i + 1} </span>
                  {t(`core.nav.${section}`)}
                </button>
              </li>
            );
          })}
        </ol>
        <p className={styles.progress}>
          {t("core.nav.progress")
            .replace("{current}", String(index + 1))
            .replace("{total}", String(sections.length))}
        </p>
      </nav>

      <div className={styles.readingColumn}>
        <div key={current} className="daybreak-reveal">
          <ReportSection
            section={current}
            model={model}
            generatedAt={generatedAt}
            onNavigate={goTo}
          />
        </div>

        <div className={styles.pagination}>
          {previous ? (
            <button
              type="button"
              onClick={() => goTo(previous)}
              className={styles.backButton}
            >
              <ArrowLeft
                size={15}
                aria-hidden="true"
                className="rtl:-scale-x-100"
              />
              {t("core.nav.back")}
            </button>
          ) : null}
          {next && current !== "S1" ? (
            <button
              type="button"
              onClick={() => goTo(next)}
              className={styles.nextButton}
            >
              <span className="truncate">
                {t("core.nav.next")}: {t(`core.nav.${next}`)}
              </span>
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="shrink-0 rtl:-scale-x-100"
              />
            </button>
          ) : !next ? (
            <button
              type="button"
              onClick={() => goTo("S5")}
              className={styles.nextButton}
            >
              {t("core.nav.finish")}
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="rtl:-scale-x-100"
              />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
