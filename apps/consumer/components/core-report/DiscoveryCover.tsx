"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import type { ReportModel } from "@/lib/core-v2/report-model";
import { CuriosityRing, strandFor } from "./glance/deck";
import { CURIOSITY_SCENES } from "./glance/scenes";
import { Block } from "./parts";
import styles from "./ReportDesign.module.css";

/**
 * The first screen a student lands on, so it opens like a reveal: a dawn
 * scene whose two trails meet at the sun, then the student's own leading
 * curiosities as illustrated cards, before any explanatory chapter.
 */
export function DiscoveryCover({
  model,
  isPreview = false,
}: {
  model: ReportModel;
  isPreview?: boolean;
}) {
  const { t } = useLocale();
  const Heading = isPreview ? "h1" : "h2";
  const ResultHeading = isPreview ? "h2" : "h3";
  return (
    <section
      className={styles.discoveryCover}
      aria-labelledby="discovery-title"
    >
      <div className={styles.coverHero}>
        <picture>
          <source
            media="(min-width: 640px)"
            srcSet="/report/cover-dawn-paths-v1.webp"
          />
          <img
            src="/report/cover-dawn-paths-v1-sm.webp"
            alt=""
            width={1800}
            height={771}
            fetchPriority="high"
            className={styles.coverHeroArt}
          />
        </picture>
        <div className={styles.coverHeroText}>
          <p className={styles.eyebrow}>
            {t(isPreview ? "core.cover.preview_label" : "core.cover.label")}
          </p>
          <Heading
            id="discovery-title"
            className={`daybreak-heading ${styles.coverTitle}`}
          >
            {t(isPreview ? "core.cover.preview_title" : "core.cover.title")}
          </Heading>
          <p className={styles.coverBody}>{t("core.cover.body")}</p>
        </div>
      </div>

      <div className={styles.coverReveal}>
        <p className={styles.resultLabel}>{t("core.cover.curiosities")}</p>
        <ul className={styles.coverResults}>
          {model.result.leadingCuriosities.map((code, index) => {
            const scene = CURIOSITY_SCENES[code];
            const strand = strandFor(model, code);
            return (
              <li
                key={code}
                style={{
                  ["--strand" as string]: strand.stroke,
                  ["--reveal-delay" as string]: `${240 + index * 140}ms`,
                }}
              >
                <div className={styles.coverResultArt}>
                  {scene ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={scene} alt="" width={600} height={400} />
                  ) : (
                    <CuriosityRing code={code} model={model} />
                  )}
                </div>
                <div className={styles.coverResultText}>
                  <CuriosityRing code={code} model={model} size="sm" />
                  <div className="min-w-0">
                    <ResultHeading className="daybreak-heading">
                      <Block id={`CUR-${code}-NAME`} />
                    </ResultHeading>
                    <p>
                      <Block id={`CUR-${code}-PULL`} />
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
