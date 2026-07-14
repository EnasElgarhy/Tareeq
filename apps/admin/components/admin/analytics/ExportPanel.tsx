import { Card } from "@/components/admin/ui/Card";
import { InlineStatus } from "@/components/admin/ui/Toast";

const EXPORTS = [
  { type: "summary", label: "Summary metrics (CSV)" },
  { type: "rows", label: "Anonymized assessment rows (CSV)" },
  { type: "flagged", label: "Flagged records (CSV)" },
] as const;

export function ExportPanel({
  queryString,
  saltConfigured,
}: {
  queryString: string;
  saltConfigured: boolean;
}) {
  const suffix = queryString ? `&${queryString}` : "";
  return (
    <Card className="adm-fade-up p-5">
      <h2 className="mb-3 text-base font-bold text-adm-ink">Export</h2>

      {!saltConfigured && (
        <InlineStatus kind="error">
          Export unavailable: ANALYTICS_HASH_SALT is not configured.
        </InlineStatus>
      )}

      <div className="mt-3 flex flex-wrap gap-3">
        {EXPORTS.map((e) =>
          saltConfigured ? (
            <a
              key={e.type}
              href={`/api/admin/analytics/export?type=${e.type}${suffix}`}
              className="inline-flex h-10 items-center rounded-adm-md border border-adm-line-strong px-4 text-[13px] font-semibold text-adm-ink-soft transition-colors duration-adm-fast hover:border-adm-violet hover:text-adm-violet"
            >
              {e.label}
            </a>
          ) : (
            <button
              key={e.type}
              type="button"
              disabled
              title="Set ANALYTICS_HASH_SALT in the environment to enable exports."
              className="inline-flex h-10 cursor-not-allowed items-center rounded-adm-md border border-adm-line px-4 text-[13px] font-semibold text-adm-ink-muted opacity-60"
            >
              {e.label}
            </button>
          ),
        )}
      </div>
      <p className="mt-3 text-xs text-adm-ink-muted">
        Assessment-row and flagged exports use a one-way{" "}
        <code className="rounded bg-adm-sand px-1 py-0.5">user_id_hash</code> —
        no names or emails are included. Exports apply the filters above.
      </p>
    </Card>
  );
}
