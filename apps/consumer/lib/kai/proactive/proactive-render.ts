import type { StringKey } from "@/lib/i18n/strings";
import type { KaiProactiveMoment } from "@/lib/kai/proactive/proactive-types";

/**
 * The one place that turns a KaiProactiveMoment into an actual sentence —
 * shared by Overview and the Kai tab so the two surfaces never drift
 * into rendering the same moment differently. Takes `t` as a parameter
 * rather than calling useLocale() itself, so this stays plain,
 * synchronously-testable TypeScript.
 */
export function renderProactiveMomentText(moment: KaiProactiveMoment, t: (key: StringKey) => string): string {
  switch (moment.kind) {
    case "resume_conversation":
      return moment.params.summary
        ? t("profile.proactive.resume_conversation").replace("{summary}", moment.params.summary)
        : t("kai.memory.resume_cta");
    case "resume_topic":
      return t("profile.proactive.resume_topic").replace("{topic}", moment.params.topic);
    case "next_step":
      return t("profile.proactive.next_step")
        .replace("{module}", moment.params.module)
        .replace("{duration}", moment.params.duration);
    case "compass_highlight":
      return t("profile.proactive.compass_highlight")
        .replace("{cluster}", moment.params.cluster)
        .replace("{archetype}", moment.params.archetype);
    default:
      return moment satisfies never;
  }
}

/** Where tapping the moment's CTA should go — `/start` for the one
 * moment that isn't a chat goal, `/kai-chat` (optionally scoped to a
 * goal) for everything else. */
export function proactiveMomentHref(moment: KaiProactiveMoment): string {
  if (moment.kind === "next_step") return "/start";
  if ("goal" in moment) return `/kai-chat?goal=${moment.goal}`;
  return "/kai-chat";
}

export function proactiveMomentCtaKey(moment: KaiProactiveMoment): StringKey {
  return moment.kind === "next_step" ? "profile.proactive.start_cta" : "kai.panel.continue_cta";
}
