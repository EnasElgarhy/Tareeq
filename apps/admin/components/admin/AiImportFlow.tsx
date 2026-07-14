"use client";

import { useRouter } from "next/navigation";
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
      router.push(`/admin/content/${versionId}/custom`);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not apply draft.");
      setApplying(false);
    }
  }

  return (
    <div className="max-w-3xl">
      {!draft ? (
        <div className="space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label htmlFor="ai-q">Questions source</Label>
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
              placeholder="Upload a CSV / PDF / DOCX / TXT — or paste your questions and answer options here…"
              className="min-h-[180px] font-mono text-[13px]"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label htmlFor="ai-s">Scoring / rubric source (optional)</Label>
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
              placeholder="How answers map to categories and how categories map to result profiles…"
              className="min-h-[120px] font-mono text-[13px]"
            />
          </div>
          <Button onClick={extract} loading={extracting} disabled={uploading !== null}>
            Extract with AI
          </Button>
          <p className="text-[12px] text-adm-ink-muted">
            Accepts CSV, TXT, Markdown, PDF, and DOCX (max 5 MB). The original file
            is stored privately for provenance.
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
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-adm-lg border border-adm-violet/30 bg-adm-violet/5 px-4 py-3">
        <p className="text-[13px] font-semibold text-adm-ink">
          AI drafted {draft.categories.length} categories · {draft.questions.length} questions ·{" "}
          {draft.profiles.length} profiles · {draft.rules.length} rules
        </p>
        <span className="text-[12px] font-semibold text-adm-violet">
          confidence {Math.round(draft.confidence * 100)}%
          {draft.detectedLanguage ? ` · ${draft.detectedLanguage}` : ""}
        </span>
      </div>

      <ReviewBlock title="Categories">
        {draft.categories.map((c) => (
          <Chip key={c.code}>{c.code} · {c.name.en}</Chip>
        ))}
      </ReviewBlock>

      <ReviewBlock title="Questions">
        <ul className="grid gap-1.5">
          {draft.questions.map((q, i) => (
            <li key={i} className="rounded-adm-md bg-adm-sand px-3 py-2 text-[13px] text-adm-ink-soft">
              <span className="font-semibold text-adm-ink">{q.title.en || "(untitled)"}</span>
              {q.options.length > 0 ? (
                <span className="text-adm-ink-muted">
                  {" "}— {q.options.map((o) => `${o.letter}${o.categoryCode ? `→${o.categoryCode}+${o.points}` : ""}`).join(", ")}
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
                IF {r.conditions.map((c) => `${c.cluster} ${c.operator} ${c.valueCategory ?? c.value}`).join(` ${r.combinator} `)} → {r.resultProfileCode}
              </code>
            </li>
          ))}
        </ul>
      </ReviewBlock>

      <div className="flex gap-2">
        <Button onClick={onApply} loading={applying}>
          Apply draft
        </Button>
        <Button variant="ghost" onClick={onDiscard} disabled={applying}>
          Discard &amp; re-paste
        </Button>
      </div>
      <p className="text-[12px] text-adm-ink-muted">
        Applying creates the categories, questions, profiles, and rules — then refine them in the editor and Scoring step before publishing.
      </p>
    </div>
  );
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
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
      className={`cursor-pointer text-[12px] font-semibold text-adm-violet hover:text-adm-deep ${
        disabled ? "pointer-events-none opacity-60" : ""
      }`}
    >
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
