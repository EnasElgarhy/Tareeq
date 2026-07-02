"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import type { AssessmentCategory } from "@/lib/admin/custom-content";
import {
  deleteResultProfile,
  saveResultProfile,
} from "@/lib/admin/profile-actions";
import { validateResultProfile } from "@/lib/admin/profile-validation";
import type { ResultProfileRow } from "@/lib/admin/scoring-content";
import { type Locale, LOCALE_LABELS, SUPPORTED_LOCALES } from "@/lib/admin/locales";
import type { ScoringStrategy } from "@/lib/scoring/spec-types";

type ListField = "majors" | "careers" | "strengths" | "development";

interface ProfileDraft {
  code: string;
  categoryCode: string;
  title: Record<string, string>;
  description: Record<string, string>;
  majors: Record<string, string[]>;
  careers: Record<string, string[]>;
  strengths: Record<string, string[]>;
  development: Record<string, string[]>;
  isFallback: boolean;
}

function blankDraft(): ProfileDraft {
  return {
    code: "",
    categoryCode: "",
    title: {},
    description: {},
    majors: {},
    careers: {},
    strengths: {},
    development: {},
    isFallback: false,
  };
}

function toDraft(p: ResultProfileRow): ProfileDraft {
  return {
    code: p.code ?? "",
    categoryCode: p.category_code ?? "",
    title: { ...(p.name ?? {}) },
    description: { ...(p.description ?? {}) },
    majors: { ...(p.recommended_majors ?? {}) },
    careers: { ...(p.recommended_careers ?? {}) },
    strengths: { ...(p.strengths ?? {}) },
    development: { ...(p.development_areas ?? {}) },
    isFallback: p.is_fallback,
  };
}

const LIST_LABELS: Record<ListField, string> = {
  majors: "Recommended majors",
  careers: "Recommended careers",
  strengths: "Strengths",
  development: "Development areas",
};

interface PanelProps {
  catalogId: string;
  versionId: string;
  categories: AssessmentCategory[];
  profiles: ResultProfileRow[];
  strategy: ScoringStrategy;
}

export function ResultProfilesPanel({
  catalogId,
  versionId,
  categories,
  profiles,
  strategy,
}: PanelProps) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-adm-ink">Result profiles</h2>
          <p className="text-[12px] text-adm-ink-muted">
            The outcomes an assessment can produce.
            {strategy === "highest_score_wins"
              ? " In highest-score mode, set each profile's category."
              : ""}
          </p>
        </div>
        {!adding ? (
          <Button size="sm" onClick={() => setAdding(true)}>
            + Add profile
          </Button>
        ) : null}
      </div>

      {adding ? (
        <div className="mb-3">
          <ProfileForm
            catalogId={catalogId}
            versionId={versionId}
            categories={categories}
            existingCodes={profiles.map((p) => p.code ?? "").filter(Boolean)}
            strategy={strategy}
            initial={blankDraft()}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : null}

      {profiles.length === 0 && !adding ? (
        <p className="rounded-adm-lg border border-dashed border-adm-line-strong bg-adm-card px-4 py-6 text-center text-[13px] text-adm-ink-muted">
          No profiles yet. Add the outcomes this assessment can assign.
        </p>
      ) : null}

      <div className="grid gap-2">
        {profiles.map((p) =>
          editingId === p.id ? (
            <ProfileForm
              key={p.id}
              catalogId={catalogId}
              versionId={versionId}
              categories={categories}
              existingCodes={profiles
                .filter((x) => x.id !== p.id)
                .map((x) => x.code ?? "")
                .filter(Boolean)}
              strategy={strategy}
              profileId={p.id}
              initial={toDraft(p)}
              onDone={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <ProfileCard
              key={p.id}
              versionId={versionId}
              profile={p}
              categories={categories}
              onEdit={() => setEditingId(p.id)}
            />
          ),
        )}
      </div>
    </section>
  );
}

function ProfileCard({
  versionId,
  profile,
  categories,
  onEdit,
}: {
  versionId: string;
  profile: ResultProfileRow;
  categories: AssessmentCategory[];
  onEdit: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const categoryName = categories.find((c) => c.code === profile.category_code);

  async function del() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    try {
      await deleteResultProfile(profile.id, versionId);
      toast("success", "Profile deleted.");
      router.refresh();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not delete.");
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-adm-lg border border-adm-line bg-adm-card p-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="rounded bg-adm-sand px-1.5 py-0.5 text-[11px] font-bold text-adm-ink-soft">
            {profile.code ?? "—"}
          </span>
          <span className="truncate text-[14px] font-semibold text-adm-ink">
            {profile.name?.en || (
              <span className="text-adm-error-ink">⚠ missing English title</span>
            )}
          </span>
          {profile.is_fallback ? (
            <span className="rounded-full bg-adm-gold/20 px-2 py-0.5 text-[10px] font-bold text-adm-gold-ink">
              fallback
            </span>
          ) : null}
          {profile.category_code ? (
            <span className="rounded-full bg-adm-violet/10 px-2 py-0.5 text-[10px] font-bold text-adm-violet">
              {profile.category_code}
              {categoryName?.name.en ? ` · ${categoryName.name.en}` : ""}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <Button size="sm" variant="ghost" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="danger" onClick={del} loading={busy}>
          {confirming ? "Sure?" : "Delete"}
        </Button>
      </div>
    </div>
  );
}

function ProfileForm({
  catalogId,
  versionId,
  categories,
  existingCodes,
  strategy,
  profileId,
  initial,
  onDone,
  onCancel,
}: {
  catalogId: string;
  versionId: string;
  categories: AssessmentCategory[];
  existingCodes: string[];
  strategy: ScoringStrategy;
  profileId?: string;
  initial: ProfileDraft;
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [locale, setLocale] = useState<Locale>("en");
  const [draft, setDraft] = useState<ProfileDraft>(initial);
  const [saving, setSaving] = useState(false);
  const rtl = locale === "ar";

  const errors = validateResultProfile(
    { code: draft.code, title: draft.title },
    existingCodes,
  );

  function setLoc(field: "title" | "description", value: string) {
    setDraft((d) => ({ ...d, [field]: { ...d[field], [locale]: value } }));
  }
  function setList(field: ListField, value: string) {
    const items = value
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    setDraft((d) => ({ ...d, [field]: { ...d[field], [locale]: items } }));
  }

  async function save() {
    if (errors.length > 0) {
      toast("error", errors[0]);
      return;
    }
    setSaving(true);
    try {
      await saveResultProfile(
        catalogId,
        profileId ?? null,
        {
          code: draft.code,
          title: draft.title,
          description: draft.description,
          categoryCode: draft.categoryCode || null,
          recommendedMajors: draft.majors,
          recommendedCareers: draft.careers,
          strengths: draft.strengths,
          developmentAreas: draft.development,
          isFallback: draft.isFallback,
        },
        versionId,
      );
      toast("success", profileId ? "Profile saved." : "Profile added.");
      router.refresh();
      onDone();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not save.");
      setSaving(false);
    }
  }

  return (
    <div className="rounded-adm-lg border border-adm-violet/40 bg-adm-card p-4 shadow-adm-sm">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {SUPPORTED_LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className={`rounded-adm-sm px-3 py-1 text-[13px] font-semibold transition-colors ${
                locale === l
                  ? "bg-adm-violet text-white"
                  : "bg-adm-sand text-adm-ink-muted hover:text-adm-ink"
              }`}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-[13px] text-adm-ink-soft">
          <input
            type="checkbox"
            checked={draft.isFallback}
            onChange={(e) => setDraft((d) => ({ ...d, isFallback: e.target.checked }))}
            className="h-4 w-4 rounded border-adm-line-strong text-adm-violet focus:ring-2 focus:ring-adm-violet/25"
          />
          Fallback (when nothing matches)
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <div>
          <Label htmlFor="p-code">Code</Label>
          <Input
            id="p-code"
            value={draft.code}
            onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
            placeholder="LEADER"
            maxLength={32}
          />
        </div>
        <div>
          <Label htmlFor="p-cat">
            Category {strategy === "highest_score_wins" ? "(required for highest-score)" : "(optional)"}
          </Label>
          <Select
            id="p-cat"
            value={draft.categoryCode}
            onChange={(e) => setDraft((d) => ({ ...d, categoryCode: e.target.value }))}
          >
            <option value="">— none —</option>
            {categories.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
                {c.name.en ? ` · ${c.name.en}` : ""}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-3">
        <Label htmlFor="p-title">Title ({LOCALE_LABELS[locale]})</Label>
        <Input
          id="p-title"
          value={draft.title[locale] ?? ""}
          onChange={(e) => setLoc("title", e.target.value)}
          placeholder={rtl ? "اسم الملف" : "Profile title"}
          dir={rtl ? "rtl" : undefined}
        />
      </div>

      <div className="mt-3">
        <Label htmlFor="p-desc">Description ({LOCALE_LABELS[locale]})</Label>
        <Textarea
          id="p-desc"
          value={draft.description[locale] ?? ""}
          onChange={(e) => setLoc("description", e.target.value)}
          placeholder={rtl ? "وصف الملف" : "What this profile means…"}
          dir={rtl ? "rtl" : undefined}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {(Object.keys(LIST_LABELS) as ListField[]).map((field) => (
          <div key={field}>
            <Label htmlFor={`p-${field}`}>
              {LIST_LABELS[field]} ({LOCALE_LABELS[locale]}) — one per line
            </Label>
            <Textarea
              id={`p-${field}`}
              value={(draft[field][locale] ?? []).join("\n")}
              onChange={(e) => setList(field, e.target.value)}
              dir={rtl ? "rtl" : undefined}
              className="min-h-[72px]"
            />
          </div>
        ))}
      </div>

      {errors.length > 0 ? (
        <ul className="mt-3 space-y-0.5">
          {errors.map((e, i) => (
            <li key={i} className="text-[12px] font-medium text-adm-error-ink">
              • {e}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={save} loading={saving} disabled={errors.length > 0}>
          {profileId ? "Save profile" : "Add profile"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
