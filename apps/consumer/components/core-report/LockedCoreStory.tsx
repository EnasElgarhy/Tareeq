"use client";

import { ArrowRight, Check, LockKeyhole } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { LockedStoryProps } from "@/components/results/report-access/ReportAccessExperience";
import {
  fill,
  formatOfferListPrice,
  formatOfferPrice,
  hasOfferDiscount,
} from "@/components/results/report-access/story/story-data";
import type { ReportModel } from "@/lib/core-v2/report-model";
import { DiscoveryCover } from "./DiscoveryCover";
import styles from "./ReportDesign.module.css";

const BENEFITS = [
  "core.offer.picture",
  "core.offer.careers",
  "core.offer.study",
  "core.offer.steps",
] as const;

/** A real first taste and a readable offer, before checkout handles purchase state. */
export function LockedCoreStory({
  model,
  offer,
  onOpen,
}: LockedStoryProps & { model: ReportModel }) {
  const { locale, t } = useLocale();
  return (
    <div className={`${styles.report} ${styles.lockedReport} daybreak-reveal`}>
      <DiscoveryCover model={model} isPreview />
      <section
        className={styles.unlockOffer}
        aria-labelledby="core-offer-title"
      >
        <p className={styles.eyebrow}>
          <LockKeyhole size={13} aria-hidden="true" />
          {t("paywall.product")}
        </p>
        <h2
          id="core-offer-title"
          className={`daybreak-heading ${styles.offerTitle}`}
        >
          {t("core.offer.title")}
        </h2>
        <p className={styles.coverBody}>{t("core.offer.body")}</p>
        <div className={styles.offerPrice}>
          <strong className="daybreak-heading">
            {formatOfferPrice(offer, locale)}
          </strong>
          {hasOfferDiscount(offer) ? (
            <>
              <s>{formatOfferListPrice(offer, locale)}</s>
              <span>
                {fill(t("paywall.offer.percent_off"), {
                  percent: String(offer.discountPercent),
                })}
              </span>
            </>
          ) : null}
        </div>
        <button type="button" onClick={onOpen} className={styles.coverButton}>
          {t("paywall.v2.cta")}
          <ArrowRight
            size={18}
            aria-hidden="true"
            className="rtl:-scale-x-100"
          />
        </button>
        <p className={styles.offerReassurance}>{t("paywall.v2.secure")}</p>
        <ul className={styles.offerBenefits}>
          {BENEFITS.map((key) => (
            <li key={key}>
              <Check size={16} aria-hidden="true" />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
