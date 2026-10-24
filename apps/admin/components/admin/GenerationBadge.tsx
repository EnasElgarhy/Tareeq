import {
  GENERATION_LABELS,
  GENERATION_SCORING,
  type AssessmentGeneration,
} from "@/lib/admin/assessment-generation";

const badgeBase =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold";

const TONES: Record<AssessmentGeneration, string> = {
  "core-2.0": "bg-adm-violet/10 text-adm-deep",
  "legacy-v4": "bg-adm-sand text-adm-ink-muted border border-adm-line-strong",
  custom: "bg-adm-gold/25 text-adm-gold-ink",
};

/** Which assessment model a version or attempt belongs to, with its scoring. */
export function GenerationBadge({
  generation,
}: {
  generation: AssessmentGeneration;
}) {
  const scoring = GENERATION_SCORING[generation];
  return (
    <span className={`${badgeBase} ${TONES[generation]}`}>
      {GENERATION_LABELS[generation]}
      {scoring ? (
        <span className="font-semibold opacity-75">· scoring {scoring}</span>
      ) : null}
    </span>
  );
}
