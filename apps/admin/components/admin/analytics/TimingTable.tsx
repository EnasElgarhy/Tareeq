import Link from "next/link";
import { Table, Td, Th, Tr } from "@/components/admin/ui/Table";
import {
  CORE_PARTS,
  type AttemptTiming,
  type TimingListParams,
  type TimingSortKey,
} from "@/lib/admin/analytics/timing";

const flagBase = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold";

/** "Fast" when any part trips the spec §5 rule, with which part and why. */
export function FastFlag({ attempt }: { attempt: AttemptTiming }) {
  if (!attempt.flagged) {
    return <span className={`${flagBase} bg-adm-mint/25 text-adm-mint-ink`}>OK</span>;
  }
  const reasons = [
    attempt.rushedParts.length > 0 && `rushed P${attempt.rushedParts.join(", P")}`,
    attempt.samePositionParts.length > 0 && `same position P${attempt.samePositionParts.join(", P")}`,
  ].filter(Boolean);
  return (
    <span className="flex flex-col items-start gap-0.5">
      <span className={`${flagBase} bg-adm-error/10 text-adm-error-ink`}>Fast</span>
      <span className="text-[11px] text-adm-ink-muted">{reasons.join(" · ")}</span>
    </span>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  });
}

function fmtSeconds(value: number | undefined): string {
  return value === undefined ? "—" : `${value.toFixed(1)} s`;
}

export interface TimingTableProps {
  attempts: AttemptTiming[];
  params: TimingListParams;
  /** Base query string (range + filter) that sort links keep. */
  baseQuery: string;
}

function SortHeader({
  label,
  sortKey,
  params,
  baseQuery,
  className = "",
}: {
  label: string;
  sortKey: TimingSortKey;
  params: TimingListParams;
  baseQuery: string;
  className?: string;
}) {
  const active = params.sort === sortKey;
  const dir = active && params.dir === "desc" ? "asc" : "desc";
  const query = new URLSearchParams(baseQuery);
  query.set("sort", sortKey);
  query.set("dir", dir);
  return (
    <Th className={className} aria-sort={active ? (params.dir === "asc" ? "ascending" : "descending") : "none"}>
      <Link href={`?${query.toString()}`} className={active ? "text-adm-violet" : "hover:text-adm-ink"}>
        {label}
        {active && <span aria-hidden="true">{params.dir === "asc" ? " ↑" : " ↓"}</span>}
      </Link>
    </Th>
  );
}

function AttemptLabel({ attempt }: { attempt: AttemptTiming }) {
  if (attempt.source === "responses") {
    return (
      <span className="font-semibold text-adm-ink">{attempt.respondentName ?? "Unnamed student"}</span>
    );
  }
  return (
    <span>
      <span className="font-semibold text-adm-ink">Anonymous attempt</span>
      <span className="block font-mono text-[11px] text-adm-ink-faint">{attempt.attemptKey.slice(0, 8)}</span>
    </span>
  );
}

export function TimingTable({ attempts, params, baseQuery }: TimingTableProps) {
  const sortProps = { params, baseQuery };
  return (
    <Table>
      <thead>
        <tr>
          <Th>Attempt</Th>
          <SortHeader label="Started" sortKey="date" {...sortProps} />
          <Th>Source</Th>
          <Th className="text-right">Timed</Th>
          <SortHeader label="Avg / question" sortKey="avg" className="text-right" {...sortProps} />
          {CORE_PARTS.map((part) => (
            <Th key={part} className="text-right">
              P{part} avg · median
            </Th>
          ))}
          <SortHeader label="Fastest part" sortKey="fastest" className="text-right" {...sortProps} />
          <SortHeader label="Flag" sortKey="flagged" {...sortProps} />
        </tr>
      </thead>
      <tbody>
        {attempts.map((attempt) => {
          const fastest = Math.min(...attempt.parts.map((p) => p.medianSeconds));
          return (
            <Tr key={`${attempt.source}:${attempt.attemptKey}`}>
              <Td>
                <AttemptLabel attempt={attempt} />
              </Td>
              <Td className="whitespace-nowrap">{fmtDate(attempt.startedAt)}</Td>
              <Td>
                {attempt.src ?? <span className="text-adm-ink-faint">—</span>}
                {attempt.post && <span className="block text-[11px] text-adm-ink-muted">{attempt.post}</span>}
              </Td>
              <Td className="text-right tabular-nums">{attempt.answered}</Td>
              <Td className="text-right font-semibold tabular-nums text-adm-ink">
                {fmtSeconds(attempt.avgSeconds)}
              </Td>
              {CORE_PARTS.map((part) => {
                const timing = attempt.parts.find((p) => p.part === part);
                return (
                  <Td
                    key={part}
                    className={`whitespace-nowrap text-right tabular-nums ${
                      timing?.flags.flagged ? "font-semibold text-adm-error-ink" : ""
                    }`}
                  >
                    {timing ? `${fmtSeconds(timing.avgSeconds)} · ${fmtSeconds(timing.medianSeconds)}` : "—"}
                  </Td>
                );
              })}
              <Td className="text-right tabular-nums">{fmtSeconds(fastest)}</Td>
              <Td>
                <FastFlag attempt={attempt} />
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}
