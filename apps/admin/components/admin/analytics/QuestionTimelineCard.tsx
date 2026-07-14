import { Card } from "@/components/admin/ui/Card";
import type { QuestionEventRecord } from "@/lib/admin/analytics/question-events";

const EVENT_LABELS: Record<string, string> = {
  question_viewed: "Viewed",
  question_revisited: "Revisited",
  question_answered: "Answered",
  question_answer_changed: "Changed answer",
  question_auto_advanced: "Auto-advanced",
  question_time_spent: "Left question",
  question_completed: "Completed",
  question_abandoned: "Abandoned",
  question_skipped: "Skipped",
};

function summarize(event: QuestionEventRecord): string {
  const label = EVENT_LABELS[event.eventName] ?? event.eventName;
  const bits: string[] = [];
  if (typeof event.metadata.selectedAnswer === "string") {
    bits.push(`answer ${event.metadata.selectedAnswer}`);
  }
  if (typeof event.metadata.timeSpentMs === "number") {
    bits.push(`${Math.round(event.metadata.timeSpentMs / 1000)}s`);
  }
  return bits.length > 0 ? `${label} — ${bits.join(", ")}` : label;
}

/**
 * A simple recent-activity feed, not a full time-series chart — see
 * QUESTION_ANALYTICS_ARCHITECTURE.md's Known Gaps for why this stays
 * simple until there's real traffic to visualize meaningfully.
 */
export function QuestionTimelineCard({ events }: { events: QuestionEventRecord[] }) {
  return (
    <Card className="adm-fade-up p-5">
      <h2 className="mb-4 text-base font-bold text-adm-ink">Timeline</h2>
      {events.length === 0 ? (
        <p className="py-6 text-center text-sm text-adm-ink-muted">
          No activity recorded for this question yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {events.map((event, i) => (
            <li
              key={`${event.sessionId}-${event.occurredAt}-${i}`}
              className="flex items-center justify-between border-b border-adm-line py-1.5 text-[13px] last:border-b-0"
            >
              <span className="text-adm-ink-soft">{summarize(event)}</span>
              <time className="text-xs text-adm-ink-faint" dateTime={event.occurredAt}>
                {new Date(event.occurredAt).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
