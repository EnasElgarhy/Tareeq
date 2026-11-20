"use client";

import { Clock, Eye, LockOpen, Send, UserRound, Users, type LucideIcon } from "lucide-react";
import { useState, type ReactNode, type CSSProperties } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  fill,
  formatOfferListPrice,
  hasOfferDiscount,
} from "@/components/results/report-access/story/story-data";
import type { ReportOffer } from "@/lib/payments/report-access";
import type { ParentLinkStatus } from "./AskParent";
import styles from "./UnlockPanel.module.css";

type Who = "me" | "parent";

interface UnlockPanelProps {
  offer: ReportOffer;
  price: string;
  /** A parent link needs the server-side assessment id. */
  canAskParent: boolean;
  /** A link that is out (pending or expired) turns the panel into its status. */
  waiting: ParentLinkStatus | null;
  onMe(): void;
  /** `reuse` resends the link already out instead of minting a new one. */
  onParent(reuse: boolean): void;
  /** Straight to the report's checkout, from the waiting state. */
  onPayMyself(): void;
}

/**
 * Sticky at the bottom of the locked report, so the choice is on screen
 * without scrolling. It sits on the page's own paper, with the report fading
 * into it, rather than as a separate sheet.
 */
export function UnlockPanel(props: UnlockPanelProps) {
  return (
    <div className={styles.dock}>
      <div className={styles.fade} aria-hidden="true" />
      <section
        className={styles.panel}
        data-mode={props.waiting ? "waiting" : "choice"}
        aria-labelledby="unlock-panel-title"
      >
        {props.waiting ? <WaitingBody {...props} waiting={props.waiting} /> : <ChoiceBody {...props} />}
      </section>
    </div>
  );
}

function PanelHead({ title, price }: { title: string; price?: { offer: ReportOffer; label: string } }) {
  const { locale } = useLocale();
  return (
    <div className={styles.head}>
      <h2 id="unlock-panel-title" className={`daybreak-heading ${styles.title}`}>
        {title}
      </h2>
      {price ? (
        <p className={styles.price}>
          {hasOfferDiscount(price.offer) ? <s>{formatOfferListPrice(price.offer, locale)}</s> : null}
          <strong className="daybreak-heading">{price.label}</strong>
        </p>
      ) : null}
    </div>
  );
}

function ChoiceBody({ offer, price, canAskParent, onMe, onParent }: UnlockPanelProps) {
  const { t } = useLocale();
  const [who, setWho] = useState<Who | null>(null);

  const label =
    who === "me"
      ? fill(t("unlock.panel.continue_me"), { price })
      : who === "parent"
        ? t("unlock.choice.create_link")
        : t("unlock.choice.pick");

  return (
    <>
      <PanelHead title={t("unlock.panel.title")} price={{ offer, label: price }} />
      <div role="radiogroup" aria-labelledby="unlock-panel-title" className={styles.options}>
        <Option
          isChosen={who === "me"}
          onChoose={() => setWho("me")}
          icon={<UserRound size={20} aria-hidden="true" />}
          title={t("unlock.choice.me")}
          note={t("unlock.choice.me.note")}
        />
        {canAskParent ? (
          <Option
            isChosen={who === "parent"}
            onChoose={() => setWho("parent")}
            icon={<Users size={20} aria-hidden="true" />}
            title={t("unlock.choice.parent")}
            note={t("unlock.choice.parent.note")}
          />
        ) : null}
      </div>
      <button
        type="button"
        className={styles.cta}
        disabled={!who}
        onClick={() => (who === "me" ? onMe() : who === "parent" ? onParent(false) : undefined)}
      >
        {label}
      </button>
    </>
  );
}

function Option({
  isChosen,
  onChoose,
  icon,
  title,
  note,
}: {
  isChosen: boolean;
  onChoose(): void;
  icon: ReactNode;
  title: string;
  note: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isChosen}
      className={styles.option}
      onClick={onChoose}
    >
      <span className={styles.optionIcon}>{icon}</span>
      <span className={styles.optionText}>
        <strong>{title}</strong>
        <span>{note}</span>
      </span>
      <span className={styles.radio} aria-hidden="true" />
    </button>
  );
}

function WaitingBody({
  waiting,
  onParent,
  onPayMyself,
}: UnlockPanelProps & { waiting: ParentLinkStatus }) {
  const { t, locale } = useLocale();
  const expired = waiting.state === "expired";
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" });
  const shortDay = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const when = (iso: string | null) => (iso ? shortDay.format(new Date(iso)) : null);
  const steps: { label: string; icon: LucideIcon; doneOn: string | null; isDone: boolean }[] = [
    { label: t("unlock.panel.step_sent"), icon: Send, doneOn: when(waiting.createdAt), isDone: true },
    {
      label: t("unlock.panel.step_opened"),
      icon: Eye,
      doneOn: when(waiting.openedAt),
      isDone: Boolean(waiting.openedAt),
    },
    { label: t("unlock.panel.step_paid"), icon: LockOpen, doneOn: null, isDone: false },
  ];
  // The step being waited on: the first one not done yet.
  const currentIndex = steps.findIndex((step) => !step.isDone);

  return (
    <>
      <div className={styles.waitHead}>
        <PanelHead title={t("unlock.panel.waiting_title")} />
        <p className={styles.expiry} data-expired={expired}>
          <Clock size={14} aria-hidden="true" />
          {expired
            ? t("unlock.wait.expired")
            : fill(t("unlock.wait.expires"), { date: day.format(new Date(waiting.expiresAt)) })}
        </p>
      </div>
      {/* Three stations on one rail. The rail fills up to the last step done;
       * the step being waited on says so under its name. */}
      <div
        className={styles.tracker}
        style={{ "--progress": Math.max(0, currentIndex - 1) / (steps.length - 1) } as CSSProperties}
      >
        <span className={styles.rail} aria-hidden="true">
          <i />
        </span>
        <ol className={styles.steps} aria-live="polite">
          {steps.map((step, index) => {
            const isCurrent = !expired && index === currentIndex;
            const state = step.isDone ? "done" : isCurrent ? "current" : "todo";
            return (
              <li key={step.label} data-state={state}>
                <span className={styles.node} aria-hidden="true">
                  <step.icon size={16} strokeWidth={2.2} />
                </span>
                <span className={styles.stepLabel}>{step.label}</span>
                <span className={styles.stepMeta}>
                  {step.isDone ? step.doneOn : isCurrent ? t("unlock.wait.waiting") : "\u00a0"}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <div className={styles.waitActions}>
        {/* While the link is live nothing needs doing, so resending stays quiet;
         * once it has expired, sending a new one is the main action. */}
        <button
          type="button"
          className={expired ? styles.cta : styles.secondary}
          onClick={() => onParent(!expired)}
        >
          {t("unlock.wait.again")}
        </button>
        <button type="button" className={styles.textButton} onClick={onPayMyself}>
          {t("unlock.wait.myself")}
        </button>
      </div>
    </>
  );
}
