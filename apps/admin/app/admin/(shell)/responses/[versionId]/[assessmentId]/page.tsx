import Link from "next/link";
import { notFound } from "next/navigation";
import { AttemptTimingCard } from "@/components/admin/analytics/AttemptTimingCard";
import { CoreResultPanel } from "@/components/admin/core/CoreResultPanel";
import { GenerationBadge } from "@/components/admin/GenerationBadge";
import { ResultSummary } from "@/components/admin/responses/ResultSummary";
import PageHeader from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/ui/Card";
import { StatusBadge } from "@/components/admin/ui/Badge";
import { PILLAR_NAMES } from "@/lib/admin/content";
import {
  CORE_PARTS,
  CORE_QUESTION_SET,
  countItems,
  type DecodedCoreAnswer,
} from "@/lib/admin/core/framework";
import { respondentLabel } from "@/lib/admin/response-format";
import { getAttemptTiming } from "@/lib/admin/analytics/timing-queries";
import { getRunDetail } from "@/lib/admin/responses";
import type { DecodedAnswer } from "@/lib/admin/response-format";

export const dynamic = "force-dynamic";

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-adm-ink-faint">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-adm-ink">{value}</p>
    </div>
  );
}

function AnswerRow({
  id,
  question,
  letter,
  text,
  tag,
}: {
  id: string;
  question: string;
  letter: string | null;
  text: string | null;
  tag?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5 first:pt-0 last:pb-0">
      <p className="flex-1 text-sm text-adm-ink-soft">
        <span className="mr-2 text-xs font-semibold text-adm-ink-faint">{id}</span>
        {question}
      </p>
      <p className="text-sm font-semibold text-adm-ink">
        {letter || text ? (
          <>
            {letter && <span className="mr-1.5 text-adm-violet">{letter}.</span>}
            {text ?? "(answered)"}
            {tag && (
              <span className="ml-2 rounded-full bg-adm-violet/10 px-2 py-0.5 text-[11px] font-bold text-adm-violet">
                {tag}
              </span>
            )}
          </>
        ) : (
          <span className="text-adm-ink-faint">Not answered</span>
        )}
      </p>
    </div>
  );
}

function LegacyAnswers({ decoded }: { decoded: DecodedAnswer[] }) {
  // Group answers by pillar, preserving question order within each.
  const pillars = [...new Set(decoded.map((d) => d.pillar))].sort((a, b) => a - b);
  return (
    <div className="space-y-6">
      {pillars.map((pillar) => (
        <div key={pillar}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-adm-violet">
            {PILLAR_NAMES[pillar] ?? `Pillar ${pillar}`}
          </h3>
          <Card className="divide-y divide-adm-line p-5">
            {decoded
              .filter((d) => d.pillar === pillar)
              .map((d) => (
                <AnswerRow
                  key={d.externalId}
                  id={d.externalId}
                  question={d.questionTitle}
                  letter={d.answered ? d.chosenLetter : null}
                  text={d.answered ? (d.chosenText ?? "(answered)") : null}
                />
              ))}
          </Card>
        </div>
      ))}
    </div>
  );
}

function CoreAnswers({ decoded }: { decoded: DecodedCoreAnswer[] }) {
  const groups = [
    ...CORE_PARTS.map((p) => ({
      key: p.pillar,
      title: `Part ${p.part} · ${p.name}`,
      rows: decoded.filter((d) => d.pillar === p.pillar),
    })),
    {
      key: "other",
      title: "Other answers",
      rows: decoded.filter((d) => d.pillar === null),
    },
  ].filter((g) => g.rows.length > 0);
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.key}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-adm-violet">
            {g.title}
          </h3>
          <Card className="divide-y divide-adm-line p-5">
            {g.rows.map((d) => (
              <AnswerRow
                key={d.itemId}
                id={d.itemId}
                question={d.stem}
                letter={d.letter}
                text={d.answerText ?? (d.pillar ? "Unknown option" : null)}
                tag={d.code ? `${d.code} · ${d.codeName}` : null}
              />
            ))}
          </Card>
        </div>
      ))}
    </div>
  );
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ versionId: string; assessmentId: string }>;
}) {
  const { versionId, assessmentId } = await params;
  const [detail, timing] = await Promise.all([
    getRunDetail(assessmentId),
    getAttemptTiming(assessmentId),
  ]);
  if (!detail) notFound();

  const { run, versionLabel } = detail;
  const name = respondentLabel(run);
  const isCore = detail.generation === "core-2.0";
  const answeredCount = isCore
    ? detail.decodedCore.filter((d) => d.pillar !== null).length
    : detail.decoded.filter((d) => d.answered).length;
  const questionCount = isCore
    ? countItems(CORE_QUESTION_SET)
    : detail.decoded.length;

  return (
    <>
      <nav className="adm-fade-up mb-4 text-[13px] text-adm-ink-muted">
        <Link href="/admin/responses" className="hover:text-adm-violet">
          Responses
        </Link>
        <span className="mx-2 text-adm-ink-faint">/</span>
        <Link
          href={`/admin/responses/${versionId}`}
          className="hover:text-adm-violet"
        >
          {versionLabel}
        </Link>
        <span className="mx-2 text-adm-ink-faint">/</span>
        <span className="text-adm-ink">{name}</span>
      </nav>

      <PageHeader
        kicker="Admin · Responses"
        title={name}
        description={`${answeredCount} of ${questionCount} questions answered · ${versionLabel}`}
        actions={
          <>
            <GenerationBadge generation={detail.generation} />
            <StatusBadge status={run.completedAt ? "published" : "draft"} />
          </>
        }
      />

      {/* Respondent + run metadata */}
      <Card className="mb-6 p-5">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Meta label="Email" value={run.respondentEmail ?? "—"} />
          <Meta label="Language" value={run.locale.toUpperCase()} />
          <Meta label="Started" value={fmtDateTime(run.startedAt)} />
          <Meta label="Completed" value={fmtDateTime(run.completedAt)} />
          <Meta
            label="Identity"
            value={
              run.userId
                ? "Registered user"
                : run.anonSessionId
                  ? "Anonymous"
                  : "—"
            }
          />
          {run.anonSessionId && (
            <Meta label="Session" value={run.anonSessionId} />
          )}
        </div>
      </Card>

      {/* Result */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-bold text-adm-ink">Result</h2>
        <Card className="p-5">
          {isCore ? (
            <CoreResultPanel result={run.result} />
          ) : (
            <ResultSummary result={run.result} />
          )}
        </Card>
      </section>

      {isCore && (
        <section className="mb-8">
          <h2 className="mb-3 text-base font-bold text-adm-ink">Time per question</h2>
          <AttemptTimingCard lookup={timing} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-base font-bold text-adm-ink">Answers</h2>
        {detail.generation === "core-2.0" ? (
          <CoreAnswers decoded={detail.decodedCore} />
        ) : (
          <LegacyAnswers decoded={detail.decoded} />
        )}
      </section>
    </>
  );
}
