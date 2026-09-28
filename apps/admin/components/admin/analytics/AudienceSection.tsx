import { BreakdownBars } from "@/components/admin/analytics/BreakdownBars";
import { Card } from "@/components/admin/ui/Card";
import type { BreakdownEntry, DemographicsBreakdown } from "@/lib/admin/analytics/types";

const MISSING_WARNING_THRESHOLD = 50;

function splitKnown(entries: BreakdownEntry[]) {
  return {
    known: entries.filter((e) => e.key !== "unknown"),
    unknown: entries.find((e) => e.key === "unknown") ?? null,
  };
}

/**
 * Unknown is deliberately excluded from the ranked bars (so it never reads
 * as "the most popular value") and surfaced as a quiet footnote instead.
 */
function DemographicCard({
  title,
  entries,
  emptyLabel,
}: {
  title: string;
  entries: BreakdownEntry[];
  emptyLabel?: string;
}) {
  const { known, unknown } = splitKnown(entries);
  return (
    <Card className="adm-fade-up p-5">
      <BreakdownBars
        title={title}
        entries={known}
        emptyLabel={emptyLabel ?? "No data yet."}
      />
      {unknown && unknown.count > 0 && (
        <p className="mt-3 border-t border-adm-line pt-3 text-xs text-adm-ink-faint">
          {unknown.count.toLocaleString()} respondent
          {unknown.count === 1 ? "" : "s"} ({unknown.pct}%) not on file
        </p>
      )}
    </Card>
  );
}

export function AudienceSection({
  demographics,
}: {
  demographics: DemographicsBreakdown;
}) {
  const dimensions = [
    { label: "country", entries: demographics.byCountry },
    { label: "gender", entries: demographics.byGender },
    { label: "age", entries: demographics.byAgeBand },
    { label: "education level", entries: demographics.byEducationLevel },
  ];
  const missing = dimensions.filter(
    (d) => (d.entries.find((e) => e.key === "unknown")?.pct ?? 0) >= MISSING_WARNING_THRESHOLD,
  );

  return (
    <section aria-label="Audience" className="space-y-4">
      {missing.length > 0 && (
        <div className="adm-fade-up rounded-adm-lg border border-adm-gold/40 bg-adm-gold/10 p-4 text-[13px] font-semibold text-adm-gold-ink">
          ⚠ Demographic collection is incomplete — most respondents have no{" "}
          {missing.map((d) => d.label).join(", ")} on file. The breakdowns
          below only reflect respondents with that data recorded.
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DemographicCard title="Country" entries={demographics.byCountry} />
        <DemographicCard title="Age band" entries={demographics.byAgeBand} />
        <DemographicCard title="Gender" entries={demographics.byGender} />
        <DemographicCard
          title="Education level"
          entries={demographics.byEducationLevel}
          emptyLabel="No responses have answered the academic-stage question yet."
        />
      </div>
    </section>
  );
}
