import { useEffect } from "react";
import { ActionPlanCard } from "@/components/kai/chat/ActionPlanCard";
import { BulletListCard } from "@/components/kai/chat/BulletListCard";
import { CareerCard } from "@/components/kai/chat/CareerCard";
import { ChecklistCard } from "@/components/kai/chat/ChecklistCard";
import { ComparisonCard } from "@/components/kai/chat/ComparisonCard";
import { ComparisonTableCard } from "@/components/kai/chat/ComparisonTableCard";
import { DecisionMatrixCard } from "@/components/kai/chat/DecisionMatrixCard";
import { FamilyScriptCard } from "@/components/kai/chat/FamilyScriptCard";
import { GoalCard } from "@/components/kai/chat/GoalCard";
import { InsightBlockCard } from "@/components/kai/chat/InsightBlockCard";
import { JourneyCard } from "@/components/kai/chat/JourneyCard";
import { LearningResourcesCard } from "@/components/kai/chat/LearningResourcesCard";
import { MemoryCard } from "@/components/kai/chat/MemoryCard";
import { MilestoneCard } from "@/components/kai/chat/MilestoneCard";
import { ObjectionResponseCard } from "@/components/kai/chat/ObjectionResponseCard";
import { RecommendationHistoryCard } from "@/components/kai/chat/RecommendationHistoryCard";
import { ReflectionQuestionCard } from "@/components/kai/chat/ReflectionQuestionCard";
import { ResumeConversationCard } from "@/components/kai/chat/ResumeConversationCard";
import { TalkingPointsCard } from "@/components/kai/chat/TalkingPointsCard";
import { UniversityCard } from "@/components/kai/chat/UniversityCard";
import { trackEvent } from "@/lib/analytics/track";
import type { KaiMessageBlock } from "@/lib/kai/chat-types";
import type { KaiMemoryProfile } from "@/lib/kai/memory/memory-types";
import type { NextMilestone } from "@/lib/profile/activity";
import type { ProfileSnapshot } from "@/lib/profile/journey";

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
  // Fired once per rendered block, keyed by type — one central place
  // rather than duplicating a trackEvent call inside every card. `blocks`
  // is a stable reference per message (see chat-storage.ts's immutable
  // append pattern), so this only re-fires when the message's own
  // blocks actually change, not on unrelated parent re-renders.
  useEffect(() => {
    for (const block of blocks) {
      trackEvent("kai_block_rendered", { type: block.type });
    }
  }, [blocks]);

  return (
    <div className="grid gap-2">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "career_card":
            return (
              <CareerCard
                key={index}
                title={block.title}
                description={block.description}
                onOpen={onRecommendationOpen ? () => onRecommendationOpen(block.title) : undefined}
              />
            );
          case "university_card":
            return (
              <UniversityCard
                key={index}
                title={block.title}
                description={block.description}
                onOpen={onRecommendationOpen ? () => onRecommendationOpen(block.title) : undefined}
              />
            );
          case "action_plan":
            return (
              <ActionPlanCard
                key={index}
                title={block.title}
                durationLabel={block.durationLabel}
                tasks={block.tasks}
                onPlanSaved={onPlanSaved}
              />
            );
          case "comparison":
            return (
              <ComparisonCard
                key={index}
                leftLabel={block.leftLabel}
                leftPoints={block.leftPoints}
                rightLabel={block.rightLabel}
                rightPoints={block.rightPoints}
              />
            );
          case "journey":
            return <JourneyCard key={index} title={block.title} modules={modules} />;
          case "memory_card":
            return <MemoryCard key={index} title={block.title} memory={memory} />;
          case "recommendation_history":
            return <RecommendationHistoryCard key={index} title={block.title} memory={memory} />;
          case "resume_conversation":
            return (
              <ResumeConversationCard
                key={index}
                title={block.title}
                description={block.description}
                onContinue={() => onResumeContinue?.()}
              />
            );
          case "goal_card":
            return <GoalCard key={index} title={block.title} description={block.description} />;
          case "milestone_card":
            return <MilestoneCard key={index} title={block.title} milestone={nextMilestone} />;
          case "learning_resources":
            return <LearningResourcesCard key={index} title={block.title} resources={block.resources} />;
          case "insight_block":
            return <InsightBlockCard key={index} title={block.title} body={block.body} />;
          case "bullet_list":
            return <BulletListCard key={index} title={block.title} items={block.items} />;
          case "checklist":
            return <ChecklistCard key={index} title={block.title} items={block.items} />;
          case "talking_points":
            return <TalkingPointsCard key={index} title={block.title} points={block.points} />;
          case "family_script":
            return <FamilyScriptCard key={index} title={block.title} script={block.script} />;
          case "objection_response_list":
            return <ObjectionResponseCard key={index} title={block.title} items={block.items} />;
          case "reflection_question":
            return <ReflectionQuestionCard key={index} question={block.question} />;
          case "comparison_table":
            return <ComparisonTableCard key={index} title={block.title} columns={block.columns} rows={block.rows} />;
          case "decision_matrix":
            return (
              <DecisionMatrixCard
                key={index}
                title={block.title}
                options={block.options}
                rows={block.rows}
                recommendation={block.recommendation}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
