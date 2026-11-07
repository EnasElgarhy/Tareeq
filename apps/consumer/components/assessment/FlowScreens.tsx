"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAssessmentAudio } from "@/components/assessment/AssessmentAudioProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { uiSounds } from "@/lib/audio/ui-sounds";
import { partIntroPath } from "@/lib/assessment/flow";
import { coreScreenText } from "@/lib/core-v2/content/core-content";

/**
 * The short screens around the questions (corrections of 6 Nov 2026,
 * sections 5, 6, 7 and 9, and the under-13 stop). Text and one action, so the
 * step from one stage to the next is unmistakable.
 */

function Screen({ children, label }: { children: ReactNode; label: string }) {
  return (
    <section
      aria-label={label}
      className="anim-screen-enter flex flex-1 flex-col items-center justify-center gap-5 pb-6 text-center"
    >
      {children}
    </section>
  );
}

function Action({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  useEffect(() => router.prefetch(href), [href, router]);
  return (
    <button
      type="button"
      onClick={() => {
        uiSounds.advance();
        router.push(href);
      }}
      className="btn-v2 btn-v2--primary mt-3 w-full max-w-[320px]"
      data-size="lg"
    >
      {label}
      <ArrowRight size={18} strokeWidth={2} aria-hidden="true" className="flip-rtl" />
    </button>
  );
}

export function AboutYouOpening() {
  const { t } = useLocale();
  const [lead, rest] = t("flow.about.head").split(" · ");
  return (
    <Screen label={t("flow.about.head")}>
      <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-gold">{lead}</p>
      <h1 className="text-display-2 max-w-[18ch] text-sand">{rest}</h1>
      <Action href="/q/0" label={t("nav.continue")} />
    </Screen>
  );
}

export function DividerScreen() {
  const { t } = useLocale();
  return (
    <Screen label={t("flow.divider.head")}>
      <h1 className="text-display-2 max-w-[16ch] text-sand">{t("flow.divider.head")}</h1>
      <p className="max-w-[38ch] text-[17px] leading-relaxed text-sand/75">{t("flow.divider.text")}</p>
      <p className="text-[14px] font-semibold text-gold">{t("flow.divider.meta")}</p>
      <Action href={partIntroPath(1)} label={t("flow.divider.cta")} />
    </Screen>
  );
}

/** "Part 1 of 4 · What sparks your curiosity. Each question…" from file 03. */
function splitIntro(text: string) {
  const at = text.indexOf(" · ");
  const lead = text.slice(0, at);
  const after = text.slice(at + 3);
  const stop = after.indexOf(". ");
  return { lead, title: after.slice(0, stop), body: after.slice(stop + 2) };
}

export function PartIntroScreen({
  part,
  firstQuestionIndex,
  firstAudioId,
  versionId,
}: {
  part: number;
  firstQuestionIndex: number;
  firstAudioId: string;
  versionId: string | null;
}) {
  const { locale, t } = useLocale();
  const { preloadNarration } = useAssessmentAudio();
  const { lead, title, body } = splitIntro(coreScreenText(locale, `S-P${part}`) ?? "");

  useEffect(() => {
    preloadNarration({ audioId: firstAudioId, locale, versionId });
  }, [firstAudioId, locale, preloadNarration, versionId]);

  return (
    <Screen label={lead}>
      <p className="text-[13px] font-bold tracking-[0.08em] text-gold">{lead}</p>
      <h1 className="text-display-2 max-w-[16ch] text-sand">{title}</h1>
      <p className="max-w-[38ch] text-[17px] leading-relaxed text-sand/75">{body}</p>
      <Action href={`/q/${firstQuestionIndex}`} label={t("nav.continue")} />
    </Screen>
  );
}

export function EndScreen() {
  const { t } = useLocale();
  return (
    <Screen label={t("flow.end")}>
      <h1 className="text-display-2 max-w-[18ch] text-sand">{t("flow.end")}</h1>
      <Action href="/register" label={t("nav.continue")} />
    </Screen>
  );
}

export function UnderThirteenScreen() {
  const { locale } = useLocale();
  const text = coreScreenText(locale, "S-UNDER13") ?? "";
  return (
    <Screen label={text}>
      <p className="max-w-[36ch] text-[19px] font-semibold leading-relaxed text-sand">{text}</p>
    </Screen>
  );
}
