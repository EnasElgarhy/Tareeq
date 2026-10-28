"use client";

import { useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { StudentPayScreen } from "@/components/parent-pay/ParentPayScreen";
import type { LockedStoryProps } from "@/components/results/report-access/ReportAccessExperience";
import { formatOfferPrice } from "@/components/results/report-access/story/story-data";
import type { ReportModel } from "@/lib/core-v2/report-model";
import { AskParentSheet, useParentLink } from "./AskParent";
import { UnlockPanel } from "./UnlockPanel";
import { CORE_LETTERS } from "./v3/chrome";
import { LockedGlancePreview } from "./v3/OpeningSections";
import styles from "./UnlockPanel.module.css";

type Sheet = { kind: "parent"; reuse: boolean } | { kind: "me" } | null;

/**
 * The locked Compass tab: the real At a glance opening with the student's
 * curiosities open and the rest under glass, and a sticky panel where they
 * choose who unlocks it. Nothing is preselected.
 */
export function LockedCoreStory({
  model,
  generatedAt,
  offer,
  onOpen,
  assessmentId,
  onParentPaid,
  tone = "light",
}: LockedStoryProps & {
  model: ReportModel;
  generatedAt?: string;
  /** "dark" sets the night palette on the locked page (being evaluated). */
  tone?: "light" | "dark";
}) {
  const { locale, t } = useLocale();
  const price = formatOfferPrice(offer, locale);
  const [sheet, setSheet] = useState<Sheet>(null);
  const parentLink = useParentLink(assessmentId, onParentPaid);
  const linkOut =
    parentLink.status &&
    (parentLink.status.state === "pending" || parentLink.status.state === "expired")
      ? parentLink.status
      : null;

  return (
    <div className={`${styles.page} daybreak-reveal`} data-tone={tone}>
      <LockedGlancePreview
        model={model}
        generatedAt={generatedAt}
        veil={
          <div className={styles.veil}>
            <span className={styles.veilLetters} aria-hidden="true">
              {CORE_LETTERS.filter((letter) => letter !== "C").map((letter) => (
                <span key={letter} data-letter={letter}>
                  {letter}
                </span>
              ))}
            </span>
            <p className={`daybreak-heading ${styles.veilTitle}`}>{t("unlock.panel.veil_title")}</p>
            <p className={styles.veilBody}>{t("unlock.panel.veil_body")}</p>
          </div>
        }
      />

      <UnlockPanel
        offer={offer}
        price={price}
        canAskParent={assessmentId != null}
        waiting={linkOut}
        onMe={() => setSheet({ kind: "me" })}
        onParent={(reuse) => setSheet({ kind: "parent", reuse })}
        onPayMyself={onOpen}
      />

      {sheet?.kind === "parent" && assessmentId ? (
        <AskParentSheet
          assessmentId={assessmentId}
          reuse={sheet.reuse}
          onClose={() => setSheet(null)}
          onSent={parentLink.setStatus}
        />
      ) : null}
      {sheet?.kind === "me" ? (
        <StudentPayScreen
          onClose={() => setSheet(null)}
          onPay={() => {
            setSheet(null);
            onOpen();
          }}
        />
      ) : null}
    </div>
  );
}
