"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, FilePenLine, FileUp, Sparkles } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { createAssessment } from "@/lib/admin/assessment-actions";
import {
  type Locale,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
} from "@/lib/admin/locales";

type Method = "manual" | "ai_import";
type AssessmentType = "core" | "custom";

export function NewAssessmentFlow() {
  const router = useRouter();
  const toast = useToast();

  const [method, setMethod] = useState<Method | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [primaryLanguage, setPrimaryLanguage] = useState<Locale>("en");
  const [bilingual, setBilingual] = useState(true);
  const [assessmentType, setAssessmentType] =
    useState<AssessmentType>("custom");

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      toast("error", "Give your assessment a name.");
      return;
    }
    setSubmitting(true);
    try {
      const supportedLanguages = bilingual
        ? [...SUPPORTED_LOCALES]
        : [primaryLanguage];
      // AI import always produces a Custom assessment.
      const effectiveType = method === "ai_import" ? "custom" : assessmentType;
      const { versionId } = await createAssessment({
        name,
        description,
        assessmentType: effectiveType,
        creationMethod: method ?? "manual",
        primaryLanguage,
        supportedLanguages,
      });
      toast("success", "Assessment created.");
      router.push(
        method === "ai_import"
          ? `/admin/content/${versionId}/import`
          : effectiveType === "custom"
            ? `/admin/content/${versionId}/scoring`
            : `/admin/content/${versionId}`,
      );
    } catch (error) {
      toast(
        "error",
        error instanceof Error ? error.message : "Could not create assessment.",
      );
      setSubmitting(false);
    }
  }

  if (method === null) {
    return (
      <div className="max-w-3xl">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-adm-ink">
            How would you like to start?
          </h2>
          <p className="mt-1 text-[13px] text-adm-ink-muted">
            Both options create the same editable draft and use the same review
            and publishing checks.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <MethodCard
            icon={<FilePenLine className="size-5" aria-hidden="true" />}
            title="Create manually"
            description="Define the possible results, write questions, and connect each answer to a result."
            action="Start from a blank draft"
            onClick={() => setMethod("manual")}
          />
          <MethodCard
            icon={<FileUp className="size-5" aria-hidden="true" />}
            title="Import an existing assessment"
            description="Upload or paste your questions and scoring logic. AI structures them for your review."
            action="Import and review"
            badge="AI-assisted"
            onClick={() => setMethod("ai_import")}
          />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onCreate} className="max-w-2xl space-y-5">
      <div className="flex items-start gap-3 rounded-adm-lg border border-adm-line bg-adm-card p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-adm-md bg-adm-violet/10 text-adm-violet">
          {method === "manual" ? (
            <FilePenLine className="size-4.5" aria-hidden="true" />
          ) : (
            <Sparkles className="size-4.5" aria-hidden="true" />
          )}
        </span>
        <div>
          <p className="text-[13px] font-bold text-adm-ink">
            {method === "manual"
              ? "Creating a blank draft"
              : "Importing an existing assessment"}
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-adm-ink-muted">
            {method === "manual"
              ? "After setup, you will add questions, results, scoring, and translations in a guided workspace."
              : "After setup, add your source material. Nothing is imported until you review and approve the structured draft."}
          </p>
        </div>
      </div>

      <Field label="Assessment name">
        {(p) => (
          <Input
            {...p}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Career Discovery"
            autoFocus
            maxLength={120}
          />
        )}
      </Field>

      <Field label="Description" hint="Optional — only admins see this.">
        {(p) => (
          <Textarea
            {...p}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this assessment measures…"
            maxLength={600}
          />
        )}
      </Field>

      <div
        className={
          method === "manual" ? "grid gap-4 sm:grid-cols-2" : "max-w-xs"
        }
      >
        <Field label="Primary language">
          {(p) => (
            <Select
              {...p}
              value={primaryLanguage}
              onChange={(e) => setPrimaryLanguage(e.target.value as Locale)}
            >
              {SUPPORTED_LOCALES.map((locale) => (
                <option key={locale} value={locale}>
                  {LOCALE_LABELS[locale]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        {method === "manual" ? (
          <Field
            label="Assessment type"
            hint={
              assessmentType === "core"
                ? "Uses Tareeq's built-in CORE scoring engine."
                : "Uses the questions and scoring logic you define."
            }
          >
            {(p) => (
              <Select
                {...p}
                value={assessmentType}
                onChange={(e) =>
                  setAssessmentType(e.target.value as AssessmentType)
                }
              >
                <option value="custom">Custom assessment</option>
                <option value="core">CORE assessment</option>
              </Select>
            )}
          </Field>
        ) : null}
      </div>

      <label className="flex items-start gap-2.5 text-sm text-adm-ink-soft">
        <input
          type="checkbox"
          checked={bilingual}
          onChange={(e) => setBilingual(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-adm-line-strong text-adm-violet focus:ring-2 focus:ring-adm-violet/25"
        />
        <span>
          <span className="block font-semibold text-adm-ink">
            Create English and Arabic content
          </span>
          <span className="mt-0.5 block text-[12px] text-adm-ink-muted">
            Publishing will check that all required fields exist in both
            languages.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={submitting}>
          {method === "manual" ? "Create blank draft" : "Continue to import"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setMethod(null)}
          disabled={submitting}
        >
          Back
        </Button>
      </div>
    </form>
  );
}

function MethodCard({
  title,
  description,
  action,
  icon,
  onClick,
  badge,
  disabled,
}: {
  title: string;
  description: ReactNode;
  action: string;
  icon: ReactNode;
  onClick?: () => void;
  badge?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex min-h-48 flex-col rounded-adm-lg border border-adm-line-strong bg-adm-card p-5 text-left transition-[border-color,background-color,box-shadow] duration-adm-fast hover:border-adm-violet hover:bg-adm-violet/5 hover:shadow-adm-sm focus-visible:border-adm-violet disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-adm-line-strong disabled:hover:bg-adm-card"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="grid size-9 place-items-center rounded-adm-md bg-adm-sand text-adm-violet transition-colors group-hover:bg-adm-violet group-hover:text-white">
          {icon}
        </span>
        {badge ? (
          <span className="rounded-full bg-adm-sand px-2 py-0.5 text-[11px] font-semibold text-adm-ink-muted">
            {badge}
          </span>
        ) : null}
      </div>
      <h3 className="mt-5 text-base font-bold text-adm-ink">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-adm-ink-muted">
        {description}
      </p>
      <span className="mt-auto flex items-center gap-1.5 pt-5 text-[12px] font-bold text-adm-violet">
        {action}
        <ArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </button>
  );
}
