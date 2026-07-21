"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, Check, FileText, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Label, Textarea } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import type { ExtractedDraft } from "@/lib/admin/ai-extract";
import {
  applyExtractedDraft,
  parseUploadedDocument,
  runExtraction,
} from "@/lib/admin/ai-import-actions";

type SourceTarget = "questions" | "scoring";

interface Props {
  catalogId: string;
  versionId: string;
}

export function AiImportFlow({ catalogId, versionId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [questionsText, setQuestionsText] = useState("");
  const [scoringText, setScoringText] = useState("");
  const [questionsPath, setQuestionsPath] = useState<string | null>(null);
  const [scoringPath, setScoringPath] = useState<string | null>(null);
  const [draft, setDraft] = useState<ExtractedDraft | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [uploading, setUploading] = useState<SourceTarget | null>(null);

  async function onFile(target: SourceTarget, file: File | undefined) {
    if (!file) return;
    setUploading(target);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await parseUploadedDocument(catalogId, fd);
      if (target === "questions") {
        setQuestionsText(res.text);
        setQuestionsPath(res.storagePath);
      } else {
        setScoringText(res.text);
        setScoringPath(res.storagePath);
      }
      toast("success", `Loaded ${res.fileName}.`);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not read file.");
    } finally {
      setUploading(null);
    }
  }

  async function extract() {
    if (!questionsText.trim()) {
      toast("error", "Upload or paste your questions source first.");
      return;
    }
    setExtracting(true);
    try {
      const result = await runExtraction(catalogId, {
        questionsText,
        scoringText,
        questionsStoragePath: questionsPath,
        scoringStoragePath: scoringPath,
      });
      setDraft(result);
      toast("success", "Draft extracted — review below.");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Extraction failed.");
    } finally {
      setExtracting(false);
    }
  }

  async function apply() {
    if (!draft) return;
    setApplying(true);
    try {
      const counts = await applyExtractedDraft(catalogId, versionId, draft);
      toast(
        "success",
        `Applied: ${counts.categories} categories, ${counts.questions} questions, ${counts.profiles} profiles, ${counts.rules} rules.`,
      );
      router.push(`/admin/content/${versionId}/scoring`);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not apply draft.");
      setApplying(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <ImportSteps hasDraft={Boolean(draft)} />
      {!draft ? (
        <div className="space-y-4">
          <div className="rounded-adm-lg border border-adm-line bg-adm-card px-4 py-3">
            <p className="text-[13px] font-bold text-adm-ink">
              Add the assessment you already designed
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-adm-ink-muted">
              Include question text, answer choices, possible results, and any
              scoring instructions. The importer preserves your logic and flags
              anything it cannot map confidently.
            </p>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label htmlFor="ai-q">Assessment source</Label>
              <UploadButton
                label={uploading === "questions" ? "Reading…" : "Upload file"}
                disabled={uploading !== null}
                onFile={(f) => onFile("questions", f)}
              />
            </div>
            <Textarea
              id="ai-q"
              value={questionsText}
              onChange={(e) => setQuestionsText(e.target.value)}
              placeholder="Paste questions, answer choices, result profiles, and category mappings here…"
              className="min-h-[180px] font-mono text-[13px]"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label htmlFor="ai-s">
                Additional scoring instructions (optional)
              </Label>
              <UploadButton
                label={uploading === "scoring" ? "Reading…" : "Upload file"}
                disabled={uploading !== null}
                onFile={(f) => onFile("scoring", f)}
              />
            </div>
            <Textarea
              id="ai-s"
              value={scoringText}
              onChange={(e) => setScoringText(e.target.value)}
              placeholder="Example: each answer adds points to one result; the result with the highest total wins. Question 12 has double weight…"
              className="min-h-[120px] font-mono text-[13px]"
            />
          </div>
          <Button
            onClick={extract}
            loading={extracting}
            disabled={uploading !== null}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Analyze source
          </Button>
          <p className="text-[12px] text-adm-ink-muted">
            Accepts CSV, TXT, Markdown, PDF, and DOCX up to 5 MB. Nothing is
            added to the editor during analysis.
          </p>
        </div>
      ) : (
        <DraftReview
          draft={draft}
          applying={applying}
          onApply={apply}
          onDiscard={() => setDraft(null)}
        />
      )}
    </div>
  );
}

function DraftReview({
  draft,
  applying,
  onApply,
  onDiscard,
}: {
  draft: ExtractedDraft;
  applying: boolean;
  onApply: () => void;
  onDiscard: () => void;
}) {
  const unmappedAnswers = draft.questions.reduce(
    (total, question) =>
      total + question.options.filter((option) => !option.categoryCode).length,
    0,
  );
  const unmappedProfiles = draft.profiles.filter(
    (profile) => !profile.categoryCode,
  ).length;
  const warnings = [
    ...(draft.categories.length === 0
      ? ["No result categories were detected."]
      : []),
    ...(draft.questions.length === 0 ? ["No questions were detected."] : []),
    ...(draft.profiles.length === 0
      ? ["No possible results were detected."]
      : []),
    ...(unmappedAnswers > 0
      ? [`${unmappedAnswers} answer(s) are not connected to a result category.`]
      : []),
    ...(unmappedProfiles > 0
      ? [`${unmappedProfiles} result(s) are not connected to a category.`]
      : []),
  ];
  const canApply = draft.questions.length > 0;

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-adm-ink">
              Review the interpreted structure
            </h2>
            <p className="mt-1 text-[12px] text-adm-ink-muted">
              Confirm that the counts and mappings reflect your source before
              creating the editable draft.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-adm-ink-muted">
            {Math.round(draft.confidence * 100)}% extraction confidence
            {draft.detectedLanguage ? ` · ${draft.detectedLanguage}` : ""}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <Metric label="Categories" value={draft.categories.length} />
          <Metric label="Questions" value={draft.questions.length} />
          <Metric label="Results" value={draft.profiles.length} />
          <Metric label="Rules" value={draft.rules.length} />
        </div>
      </div>

      <div
        className={`rounded-adm-lg border px-4 py-3 ${
          warnings.length > 0
            ? "border-adm-error/30 bg-adm-error/5"
            : "border-adm-violet/25 bg-adm-violet/5"
        }`}
      >
        <div className="flex gap-2.5">
          {warnings.length > 0 ? (
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-adm-error-ink"
              aria-hidden="true"
            />
          ) : (
            <Check
              className="mt-0.5 size-4 shrink-0 text-adm-violet"
              aria-hidden="true"
            />
          )}
          <div>
            <p className="text-[12px] font-bold text-adm-ink">
              {warnings.length > 0
                ? `${warnings.length} item(s) need review`
                : "The source structure is ready to import"}
            </p>
            {warnings.length > 0 ? (
              <ul className="mt-1 space-y-0.5">
                {warnings.map((warning) => (
                  <li key={warning} className="text-[12px] text-adm-error-ink">
                    {warning}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      <ReviewBlock title="Categories">
        {draft.categories.map((c) => (
          <Chip key={c.code}>
            {c.code} · {c.name.en}
          </Chip>
        ))}
      </ReviewBlock>

      <ReviewBlock title="Questions">
        <ul className="grid gap-1.5">
          {draft.questions.map((q, i) => (
            <li
              key={i}
              className="rounded-adm-md bg-adm-sand px-3 py-2 text-[13px] text-adm-ink-soft"
            >
              <span className="font-semibold text-adm-ink">
                {q.title.en || "(untitled)"}
              </span>
              {q.options.length > 0 ? (
                <span className="text-adm-ink-muted">
                  {" "}
                  —{" "}
                  {q.options
                    .map(
                      (o) =>
                        `${o.letter}${o.categoryCode ? `→${o.categoryCode}+${o.points}` : ""}`,
                    )
                    .join(", ")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </ReviewBlock>

      <ReviewBlock title="Profiles">
        {draft.profiles.map((p) => (
          <Chip key={p.code}>
            {p.code} · {p.title.en}
            {p.categoryCode ? ` (${p.categoryCode})` : ""}
          </Chip>
        ))}
      </ReviewBlock>

      <ReviewBlock title="Rules">
        <ul className="grid gap-1">
          {draft.rules.map((r, i) => (
            <li key={i} className="text-[13px] text-adm-ink-soft">
              <code>
                IF{" "}
                {r.conditions
                  .map(
                    (c) =>
                      `${c.cluster} ${c.operator} ${c.valueCategory ?? c.value}`,
                  )
                  .join(` ${r.combinator} `)}{" "}
                → {r.resultProfileCode}
              </code>
            </li>
          ))}
        </ul>
      </ReviewBlock>

      <div className="flex gap-2">
        <Button onClick={onApply} loading={applying} disabled={!canApply}>
          Import as editable draft
        </Button>
        <Button variant="ghost" onClick={onDiscard} disabled={applying}>
          Edit source
        </Button>
      </div>
      <p className="text-[12px] text-adm-ink-muted">
        Importing creates a draft only. You will review results, questions,
        translations, and scoring again before publishing.
      </p>
    </div>
  );
}

function ImportSteps({ hasDraft }: { hasDraft: boolean }) {
  const steps = ["Add source", "Review structure", "Edit & publish"];
  const current = hasDraft ? 1 : 0;

  return (
    <ol className="mb-6 grid gap-2 border-b border-adm-line pb-4 sm:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step} className="flex min-w-0 items-center gap-2">
          <span
            className={`grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
              index < current
                ? "bg-adm-violet text-white"
                : index === current
                  ? "border-2 border-adm-violet text-adm-violet"
                  : "bg-adm-sand text-adm-ink-muted"
            }`}
          >
            {index < current ? (
              <Check className="size-3.5" aria-hidden="true" />
            ) : (
              index + 1
            )}
          </span>
          <span
            className={`truncate text-[12px] font-semibold ${
              index === current ? "text-adm-ink" : "text-adm-ink-muted"
            }`}
          >
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-adm-md border border-adm-line bg-adm-card px-3 py-3">
      <span className="block text-xl font-bold text-adm-ink">{value}</span>
      <span className="mt-0.5 block text-[11px] font-semibold text-adm-ink-muted">
        {label}
      </span>
    </div>
  );
}

function ReviewBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-adm-ink-faint">
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-adm-line bg-adm-card px-2.5 py-1 text-[12px] font-semibold text-adm-ink-soft">
      {children}
    </span>
  );
}

function UploadButton({
  label,
  disabled,
  onFile,
}: {
  label: string;
  disabled?: boolean;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-1.5 text-[12px] font-semibold text-adm-violet hover:text-adm-deep ${
        disabled ? "pointer-events-none opacity-60" : ""
      }`}
    >
      <FileText className="size-3.5" aria-hidden="true" />
      {label}
      <input
        type="file"
        accept=".csv,.txt,.md,.pdf,.docx"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
    </label>
  );
}
