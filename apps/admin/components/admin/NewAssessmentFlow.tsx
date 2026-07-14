"use client";

import { useRouter } from "next/navigation";
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
  const [assessmentType, setAssessmentType] = useState<AssessmentType>("custom");

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
            ? `/admin/content/${versionId}/custom`
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
      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <MethodCard
          title="Manual Builder"
          description="Create questions, clusters, and scoring rules by hand. Full control, step by step."
          onClick={() => setMethod("manual")}
        />
        <MethodCard
          title="AI Import"
          description="Paste existing questions and scoring rubric — AI drafts a Custom assessment for you to review and apply."
          badge="Beta"
          onClick={() => setMethod("ai_import")}
        />
      </div>
    );
  }

  return (
    <form onSubmit={onCreate} className="max-w-xl space-y-5">
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

      <div className="grid gap-4 sm:grid-cols-2">
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

        <Field
          label="Assessment type"
          hint={
            assessmentType === "core"
              ? "Scored by the built-in CORE engine."
              : "Scored by your own rules."
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
              <option value="core">Core assessment</option>
            </Select>
          )}
        </Field>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-adm-ink-soft">
        <input
          type="checkbox"
          checked={bilingual}
          onChange={(e) => setBilingual(e.target.checked)}
          className="h-4 w-4 rounded border-adm-line-strong text-adm-violet focus:ring-2 focus:ring-adm-violet/25"
        />
        Bilingual — English + العربية
      </label>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={submitting}>
          Create assessment
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
  onClick,
  badge,
  disabled,
}: {
  title: string;
  description: ReactNode;
  onClick?: () => void;
  badge?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group rounded-adm-lg border border-adm-line-strong bg-adm-card p-5 text-left transition-colors duration-adm-fast hover:border-adm-violet hover:bg-adm-violet/5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-adm-line-strong disabled:hover:bg-adm-card"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-adm-ink">{title}</h3>
        {badge ? (
          <span className="rounded-full bg-adm-sand px-2 py-0.5 text-[11px] font-semibold text-adm-ink-muted">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-adm-ink-muted">
        {description}
      </p>
    </button>
  );
}
