"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { useToast } from "@/components/admin/ui/Toast";
import {
  publishAssessment,
  unpublishAssessment,
} from "@/lib/admin/publish-actions";
import { validateScoringConfig } from "@/lib/admin/profile-validation";
import type { AssessmentStatus } from "@/lib/admin/catalog";
import type { ScoringStrategy } from "@/lib/scoring/spec-types";

interface PublishPanelProps {
  catalogId: string;
  versionId: string;
  status: AssessmentStatus;
  strategy: ScoringStrategy;
  categoryCodes: string[];
  profiles: { id: string; categoryCode: string | null }[];
  ruleCount: number;
  questionCount: number;
}

export function PublishPanel({
  catalogId,
  versionId,
  status,
  strategy,
  categoryCodes,
  profiles,
  ruleCount,
  questionCount,
}: PublishPanelProps) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [singleLanguage, setSingleLanguage] = useState(false);

  const issues = [
    ...(questionCount === 0 ? ["Add at least one question."] : []),
    ...validateScoringConfig({
      strategy,
      categories: categoryCodes,
      profiles: profiles.map((p) => ({ id: p.id, categoryCode: p.categoryCode })),
      ruleCount,
    }),
  ];
  const ready = issues.length === 0;
  const published = status === "published";

  async function run(action: "publish" | "unpublish") {
    setBusy(true);
    try {
      if (action === "publish") await publishAssessment(catalogId, versionId, singleLanguage);
      else await unpublishAssessment(catalogId, versionId);
      toast("success", action === "publish" ? "Assessment published." : "Moved back to draft.");
      router.refresh();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-8 rounded-adm-lg border border-adm-line-strong bg-adm-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-adm-ink">Publish</h2>
          <p className="mt-0.5 text-[12px] text-adm-ink-muted">
            Compiles the categories, profiles, and rules into the deterministic
            scoring spec students are scored against.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
            published
              ? "bg-adm-violet/15 text-adm-violet"
              : "bg-adm-sand text-adm-ink-muted"
          }`}
        >
          {published ? "Published" : "Draft"}
        </span>
      </div>

      {!ready ? (
        <ul className="mt-3 space-y-0.5">
          {issues.map((issue, i) => (
            <li key={i} className="text-[12px] font-medium text-adm-error-ink">
              • {issue}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[12px] font-medium text-adm-ink-soft">
          ✓ Ready to publish — {questionCount} question(s), {profiles.length} profile(s),{" "}
          {strategy === "highest_score_wins" ? "highest-score" : `${ruleCount} rule(s)`}.
        </p>
      )}

      <label className="mt-3 flex items-center gap-2 text-[12px] text-adm-ink-soft">
        <input
          type="checkbox"
          checked={singleLanguage}
          onChange={(e) => setSingleLanguage(e.target.checked)}
          className="h-4 w-4 rounded border-adm-line-strong text-adm-violet focus:ring-2 focus:ring-adm-violet/25"
        />
        Publish as single-language (skip the translation-completeness check)
      </label>

      <div className="mt-4 flex gap-2">
        <Button onClick={() => run("publish")} loading={busy} disabled={!ready}>
          {published ? "Re-publish" : "Publish"}
        </Button>
        {published ? (
          <Button variant="ghost" onClick={() => run("unpublish")} disabled={busy}>
            Move to draft
          </Button>
        ) : null}
      </div>
    </section>
  );
}
