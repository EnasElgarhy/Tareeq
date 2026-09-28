"use client";

import {
  Compass,
  Download,
  HeartHandshake,
  MessageCircleQuestion,
  Route,
  X,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getClusterLabel } from "@/lib/results/cluster-visuals";
import {
  getArchetypeKey,
  getEcosystemFitKey,
} from "@/lib/results/report-labels";
import type { PersonalizedCompassReport } from "@/lib/results/types";

interface ParentViewModalProps {
  report: PersonalizedCompassReport;
  studentName: string;
  saveStatus: string;
  saving: boolean;
  onSave(): void;
  onClose(): void;
}

export function ParentViewModal({
  report,
  studentName,
  saveStatus,
  saving,
  onSave,
  onClose,
}: ParentViewModalProps) {
  const { t } = useLocale();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const facts = [
    {
      label: t("results.parent.cluster"),
      value: getClusterLabel(report.clusterCode, t),
    },
    {
      label: t("results.parent.style"),
      value: t(getArchetypeKey(report.archetype)),
    },
    {
      label: t("results.parent.motivation"),
      value: report.primaryDriver,
    },
    {
      label: t("results.parent.environment"),
      value: t(getEcosystemFitKey(report.ecosystemFit)),
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center md:items-center md:p-5">
      <button
        type="button"
        aria-label={t("results.parent.close_aria")}
        onClick={onClose}
        className="anim-backdrop-fade absolute inset-0 cursor-default bg-night/80 backdrop-blur-md"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="parent-view-title"
        aria-describedby="parent-view-intro"
        className="anim-sheet-up relative flex max-h-[92dvh] w-full max-w-[720px] flex-col overflow-hidden rounded-t-[28px] border border-sand/12 bg-[#17102f] text-sand shadow-[0_-24px_80px_rgba(0,0,0,0.55)] md:max-h-[calc(100dvh-40px)] md:rounded-[28px]"
      >
        <header className="flex items-start gap-3 border-b border-sand/10 px-5 pb-4 pt-5 md:px-7 md:pt-6">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint/12 text-mint">
            <HeartHandshake size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-mint">
              {t("results.parent.eyebrow")}
            </p>
            <h2
              id="parent-view-title"
              className="mt-1 text-[22px] font-black leading-tight"
            >
              {t("results.parent.title").replace("{name}", studentName)}
            </h2>
            <p
              id="parent-view-intro"
              className="mt-2 max-w-[60ch] text-[13px] leading-relaxed text-sand/62"
            >
              {t("results.parent.intro")}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="glass-tile grid size-9 shrink-0 place-items-center rounded-full text-sand/70 transition hover:text-sand"
            aria-label={t("results.parent.close_aria")}
          >
            <X size={17} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 md:px-7">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-sand/10 bg-sand/10">
            {facts.map((fact) => (
              <div key={fact.label} className="min-w-0 bg-[#1d1538] p-3.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.09em] text-sand/42">
                  {fact.label}
                </p>
                <p className="mt-1 break-words text-[13px] font-black leading-snug text-sand">
                  {fact.value}
                </p>
              </div>
            ))}
          </div>

          <ParentSection
            icon={<Compass size={18} />}
            title={t("results.parent.noticed_title")}
          >
            <p>{report.summary}</p>
          </ParentSection>

          <ParentSection
            icon={<Route size={18} />}
            title={t("results.parent.paths_title")}
          >
            <p>{t("results.parent.paths_intro")}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                ...report.careerExamples.slice(0, 4),
                ...report.universityMajors.slice(0, 3),
              ].map((path) => (
                <span
                  key={path}
                  className="rounded-full border border-sand/10 bg-sand/[0.055] px-2.5 py-1.5 text-[11px] font-bold leading-none text-sand/76"
                >
                  {path}
                </span>
              ))}
            </div>
          </ParentSection>

          <ParentSection
            icon={<HeartHandshake size={18} />}
            title={t("results.parent.support_title")}
          >
            <NumberedList
              items={[
                t("results.parent.support_interest"),
                t("results.parent.support_experiment"),
                t("results.parent.support_action"),
              ]}
            />
          </ParentSection>

          <ParentSection
            icon={<MessageCircleQuestion size={18} />}
            title={t("results.parent.questions_title")}
          >
            <NumberedList
              items={[
                t("results.parent.question_one"),
                t("results.parent.question_two"),
                t("results.parent.question_three"),
              ]}
            />
          </ParentSection>

          <ParentSection
            icon={<Route size={18} />}
            title={t("results.parent.next_step_title")}
          >
            <p>{report.nextSteps}</p>
          </ParentSection>

          <p className="mt-5 rounded-[16px] border border-gold/20 bg-gold/[0.07] p-3 text-[11.5px] leading-relaxed text-sand/62">
            {t("results.parent.note")}
          </p>
        </div>

        <footer className="border-t border-sand/10 bg-[#17102f] px-5 py-4 md:px-7">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="btn-v2 btn-v2--primary w-full"
            data-size="lg"
          >
            <Download size={17} />
            {saving ? t("results.save.preparing") : t("results.parent.save")}
          </button>
          {saveStatus ? (
            <p
              aria-live="polite"
              className="mt-2 text-center text-[11px] font-semibold text-sand/55"
            >
              {saveStatus}
            </p>
          ) : null}
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function ParentSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-sand/10 py-5 last:border-b-0">
      <div className="mb-2.5 flex items-center gap-2 text-gold">
        {icon}
        <h3 className="text-[15px] font-black text-sand">{title}</h3>
      </div>
      <div className="text-[13px] leading-relaxed text-sand/68">{children}</div>
    </section>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="grid gap-2.5">
      {items.map((item, index) => (
        <li key={item} className="flex items-start gap-2.5">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-violet/15 text-[10px] font-black text-violet-soft">
            {index + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}
