"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import type { ReportModel } from "@/lib/core-v2/report-model";
import { CuriosityRing } from "./glance/deck";
import { Block } from "./parts";
import styles from "./ReportDesign.module.css";

/** The first reward is the student's own result, before explanatory chapters. */
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
      <div className={styles.coverHeading}>
        <div>
          <p className={styles.eyebrow}>
            {t(isPreview ? "core.cover.preview_label" : "core.cover.label")}
          </p>
          <Heading
            id="discovery-title"
            className={`daybreak-heading ${styles.coverTitle}`}
          >
            {t(isPreview ? "core.cover.preview_title" : "core.cover.title")}
          </Heading>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/report/direction-discovery-v1.webp"
          alt=""
          width={360}
          height={240}
          className={styles.coverArt}
        />
      </div>
      <p className={styles.coverBody}>{t("core.cover.body")}</p>
      <p className={styles.resultLabel}>{t("core.cover.curiosities")}</p>
      <ul className={styles.coverResults}>
        {model.result.leadingCuriosities.map((code) => (
          <li key={code}>
            <CuriosityRing code={code} model={model} />
            <div>
              <ResultHeading className="daybreak-heading">
                <Block id={`CUR-${code}-NAME`} />
              </ResultHeading>
              <p>
                <Block id={`CUR-${code}-PULL`} />
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
