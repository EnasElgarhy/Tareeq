import { Bookmark, BookmarkCheck, ExternalLink, ListPlus, ListCheck } from "lucide-react";
import type { ComponentType } from "react";
import {
  ActionPlanIcon,
  AchievementIcon,
  ArticleIcon,
  CommunityIcon,
  GrowthIcon,
  MajorIcon,
  PodcastIcon,
  VideoIcon,
  WebsiteIcon,
} from "@/components/brand/DomainIcons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { trackEvent } from "@/lib/analytics/track";
import type { StringKey } from "@/lib/i18n/strings";
import { buildResourceSearchUrl } from "@/lib/kai/resource-search";
import type { KaiLearningResource } from "@/lib/kai/resource-types";

const RESOURCE_ICON: Record<KaiLearningResource["type"], ComponentType<{ size?: number | string }>> = {
  book: MajorIcon,
  course: GrowthIcon,
  youtube_video: VideoIcon,
  article: ArticleIcon,
  podcast: PodcastIcon,
  community: CommunityIcon,
  website: WebsiteIcon,
  project: ActionPlanIcon,
  competition: AchievementIcon,
};

const DIFFICULTY_TONE: Record<KaiLearningResource["difficulty"], string> = {
  beginner: "border-mint/40 bg-mint/12 text-[color:var(--day-ink-2,#5c5142)]",
  intermediate: "border-gold/40 bg-gold/12 text-[color:var(--day-ink-2,#5c5142)]",
  advanced: "border-violet/30 bg-violet/10 text-[color:var(--day-ink-2,#5c5142)]",
};

/** One premium recommendation card. No URL anywhere by design — the
 * brief is explicit that this is a coaching recommendation, not a link
 * directory; a real "open this" destination is a later, separate concern. */
export function LearningResourceCard({
  resource,
  saved,
  inActionPlan,
  onToggleSave,
  onToggleActionPlan,
}: {
  resource: KaiLearningResource;
  saved: boolean;
  inActionPlan: boolean;
  onToggleSave: () => void;
  onToggleActionPlan: () => void;
}) {
  const { t } = useLocale();
  const Icon = RESOURCE_ICON[resource.type];
  const typeKey = `kai.resource.type.${resource.type}` as StringKey;
  const difficultyKey = `kai.resource.difficulty.${resource.difficulty}` as StringKey;

  return (
    <div className="rounded-[18px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)]">
      <div className="flex items-start gap-2.5">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl"
          style={{ background: "linear-gradient(135deg, rgba(255,107,61,0.14), rgba(255,165,61,0.06))" }}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-[color:var(--day-ink-3,#675d4e)]">
              {t(typeKey)}
            </span>
            <span
              className={`rounded-full border px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.06em] ${DIFFICULTY_TONE[resource.difficulty]}`}
            >
              {t(difficultyKey)}
            </span>
          </div>
          <p className="mt-0.5 text-[13px] font-black leading-tight text-[color:var(--day-ink,#2a2118)]">{resource.title}</p>
          <p className="text-[11px] text-[color:var(--day-ink-3,#675d4e)]">{resource.authorOrProvider}</p>
        </div>
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--day-ink-2,#5c5142)]">{resource.reason}</p>

      <a
        href={buildResourceSearchUrl(resource)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("kai_resource_search_opened", { type: resource.type })}
        className="mt-2.5 flex items-center gap-1.5 rounded-[12px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-inset,#efe7da)] px-2.5 py-1.5 text-[11px] font-bold text-[color:var(--day-ink-2,#5c5142)] transition hover:bg-[color:var(--day-line-strong,rgba(43,36,28,0.2))]"
      >
        <ExternalLink size={12} />
        {t(resource.type === "youtube_video" ? "kai.resource.search_youtube" : "kai.resource.search_web")}
      </a>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-[color:var(--day-ink-3,#675d4e)]">
          {resource.estimatedTime}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleSave}
            aria-pressed={saved}
            aria-label={t(saved ? "kai.resource.saved" : "kai.resource.save")}
            className={`grid size-7 place-items-center rounded-full border transition ${
              saved ? "border-violet/35 bg-violet/10 text-violet" : "border-[color:var(--day-line,rgba(43,36,28,0.1))] text-[color:var(--day-ink-3,#675d4e)] hover:bg-[color:var(--day-inset,#efe7da)]"
            }`}
          >
            {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>
          <button
            type="button"
            onClick={onToggleActionPlan}
            aria-pressed={inActionPlan}
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition ${
              inActionPlan
                ? "border-mint/40 bg-mint/12 text-[color:var(--day-ink-2,#5c5142)]"
                : "border-[color:var(--day-line,rgba(43,36,28,0.1))] text-[color:var(--day-ink-3,#675d4e)] hover:bg-[color:var(--day-inset,#efe7da)]"
            }`}
          >
            {inActionPlan ? <ListCheck size={12} /> : <ListPlus size={12} />}
            {t(inActionPlan ? "kai.resource.added_to_plan" : "kai.resource.add_to_plan")}
          </button>
        </div>
      </div>
    </div>
  );
}
