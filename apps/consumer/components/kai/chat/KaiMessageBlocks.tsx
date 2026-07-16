import { useEffect } from "react";
import { AnswerBullets, AnswerSection } from "@/components/kai/chat/AnswerSection";
import { ActionPlanCard } from "@/components/kai/chat/ActionPlanCard";
import { ComparisonTableCard } from "@/components/kai/chat/ComparisonTableCard";
import { DecisionMatrixCard } from "@/components/kai/chat/DecisionMatrixCard";
import { GoalCard } from "@/components/kai/chat/GoalCard";
import { JourneyCard } from "@/components/kai/chat/JourneyCard";
import { LearningResourcesCard } from "@/components/kai/chat/LearningResourcesCard";
import { MemoryCard } from "@/components/kai/chat/MemoryCard";
import { MilestoneCard } from "@/components/kai/chat/MilestoneCard";
import { RecommendationHistoryCard } from "@/components/kai/chat/RecommendationHistoryCard";
import { ResumeConversationCard } from "@/components/kai/chat/ResumeConversationCard";
import { trackEvent } from "@/lib/analytics/track";
import type { KaiMessageBlock } from "@/lib/kai/chat-types";
import type { KaiMemoryProfile } from "@/lib/kai/memory/memory-types";
import type { NextMilestone } from "@/lib/profile/activity";
import type { ProfileSnapshot } from "@/lib/profile/journey";

const ink = "text-[color:var(--day-ink,#2a2118)]";
const ink2 = "text-[color:var(--day-ink-2,#5c5142)]";

/** A career/university recommendation as a flat, tappable row — no card. */
function RecoRow({
  title,
  description,
  onOpen,
}: {
  title: string;
  description: string;
  onOpen?: () => void;
}) {
  const inner = (
    <>
      <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--day-accent,#6e48e4)]" />
      <span className="min-w-0">
        <span className={`block text-[13.5px] font-bold ${ink}`}>{title}</span>
        {description ? <span className={`block text-[12.5px] leading-relaxed ${ink2}`}>{description}</span> : null}
      </span>
    </>
  );
  return onOpen ? (
    <button type="button" onClick={onOpen} className="-mx-2 flex w-full items-start gap-2.5 rounded-lg px-2 py-1 text-start transition hover:bg-[color:var(--day-inset,#efe7da)]">
      {inner}
    </button>
  ) : (
    <span className="flex items-start gap-2.5 px-0 py-1">{inner}</span>
  );
}

/**
 * Renders one Kai answer's blocks as a single flowing surface — typographic
 * sections separated by whitespace, not a stack of bordered cards (see the
 * chat redesign brief). Simple content (insight/bullets/points/script/
 * comparison/recommendations) renders inline as flat sections; only the
 * genuinely interactive or structural blocks (action plan, resources, journey,
 * matrices, system cards) keep a dedicated component.
 */
export function KaiMessageBlocks({
  blocks,
  modules,
  memory,
  nextMilestone,
  onRecommendationOpen,
  onResumeContinue,
  onPlanSaved,
}: {
  blocks: KaiMessageBlock[];
  modules: ProfileSnapshot["modules"];
  memory: KaiMemoryProfile;
  nextMilestone: NextMilestone | null;
  onRecommendationOpen?: (title: string) => void;
  onResumeContinue?: () => void;
  onPlanSaved?: () => void;
}) {
  useEffect(() => {
    for (const block of blocks) trackEvent("kai_block_rendered", { type: block.type });
  }, [blocks]);

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "insight_block":
            return (
              <AnswerSection key={index} title={block.title}>
                <p className={`text-[13.5px] leading-relaxed ${ink2}`}>{block.body}</p>
              </AnswerSection>
            );
          case "bullet_list":
          case "checklist":
            return (
              <AnswerSection key={index} title={block.title}>
                <AnswerBullets items={block.items} />
              </AnswerSection>
            );
          case "talking_points":
            return (
              <AnswerSection key={index} title={block.title}>
                <AnswerBullets items={block.points} />
              </AnswerSection>
            );
          case "family_script":
            return (
              <AnswerSection key={index} title={block.title}>
                <div className="grid gap-2">
                  {block.script.map((line, i) => (
                    <p key={i} className={`border-l-2 border-[color:var(--day-accent,#6e48e4)]/30 ps-3 text-[13.5px] italic leading-relaxed ${ink2}`}>
                      “{line}”
                    </p>
                  ))}
                </div>
              </AnswerSection>
            );
          case "reflection_question":
            return (
              <p key={index} className={`border-l-2 border-[color:var(--day-accent,#6e48e4)]/40 ps-3 text-[14px] font-semibold italic leading-relaxed ${ink}`}>
                {block.question}
              </p>
            );
          case "comparison":
            return (
              <AnswerSection key={index}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: block.leftLabel, points: block.leftPoints },
                    { label: block.rightLabel, points: block.rightPoints },
                  ].map((side, i) => (
                    <div key={i}>
                      <p className={`mb-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-[color:var(--day-ink-3,#675d4e)]`}>{side.label}</p>
                      <AnswerBullets items={side.points} />
                    </div>
                  ))}
                </div>
              </AnswerSection>
            );
          case "career_card":
          case "university_card":
            return (
              <AnswerSection key={index} title={block.type === "career_card" ? "Career example" : "Where to study"}>
                <RecoRow
                  title={block.title}
                  description={block.description}
                  onOpen={onRecommendationOpen ? () => onRecommendationOpen(block.title) : undefined}
                />
              </AnswerSection>
            );

          // Interactive / structural blocks keep a dedicated component.
          case "action_plan":
            return <ActionPlanCard key={index} title={block.title} durationLabel={block.durationLabel} tasks={block.tasks} onPlanSaved={onPlanSaved} />;
          case "learning_resources":
            return <LearningResourcesCard key={index} title={block.title} resources={block.resources} />;
          case "journey":
            return <JourneyCard key={index} title={block.title} modules={modules} />;
          case "memory_card":
            return <MemoryCard key={index} title={block.title} memory={memory} />;
          case "recommendation_history":
            return <RecommendationHistoryCard key={index} title={block.title} memory={memory} />;
          case "resume_conversation":
            return <ResumeConversationCard key={index} title={block.title} description={block.description} onContinue={() => onResumeContinue?.()} />;
          case "goal_card":
            return <GoalCard key={index} title={block.title} description={block.description} />;
          case "milestone_card":
            return <MilestoneCard key={index} title={block.title} milestone={nextMilestone} />;
          case "comparison_table":
            return <ComparisonTableCard key={index} title={block.title} columns={block.columns} rows={block.rows} />;
          case "decision_matrix":
            return <DecisionMatrixCard key={index} title={block.title} options={block.options} rows={block.rows} recommendation={block.recommendation} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
