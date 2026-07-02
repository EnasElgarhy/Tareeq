# Phase 3–7 — Result Profiles, Rules, Publish, AI Import, Dispatch

> **Branch:** `feat/hybrid-assessment`. **Status:** code-complete + `tsc` clean + **126 tests passing**. The Phase 3 migration `202606160001` is **not yet applied** (your gate) — runtime verification of the DB-backed paths waits on it. No deploy, no commit.

## Phase 3 — Result Categories, Profiles & Rule Builder ✅

- **Categories** reuse Phase 2's `assessment_categories` (Leadership/Technology/… with bilingual names).
- **Profiles** (`result_profiles`, extended additively): `code`, `title_en/ar` (`name` jsonb), `description_en/ar`, `recommended_majors`, `recommended_careers`, `strengths`, `development_areas` (localised lists), `category_code` (for highest-score mapping), `is_fallback`.
- **Rule Builder** (`result_rules`): `first_match` (threshold `LEAD >= 12` **and** category-vs-category `TECH > LEAD`, AND/OR, priority) and `highest_score_wins`. Rules stored as JSON specs.
- **Engine** outputs `{ categoryScores (clusterTotals), winningProfile, matchedRuleId, matchedBy }`. Pure + deterministic; AI never selects the profile.
- **Preview** runs the real engine client-side over sample answers.
- **Hardening (post-audit):** highest-score winner is deterministic by `(code,id)` even on duplicate mappings; `categoryCode` validated on save; category deletion refuses to orphan a profile/rule; editing is draft-only; duplicate category→profile mappings flagged.

**Migration:** `supabase/migrations/202606160001_result_profiles_rules.sql` (additive) · apply via `scripts/apply_phase3_migration.mts`.

## Phase 4 — Publish ✅ (code)

- `publishAssessment` / `unpublishAssessment` (`lib/admin/publish-actions.ts`): assembles the editing tables → `ScoringSpec`, runs `validateScoringConfig` **server-side**, structural sanity via `executeScoringSpec`, writes `scoring_specs.spec_json` as the single `is_current`, flips `status`. This is the publish-time validation the executor's guarantee relies on.
- `PublishPanel` on the Scoring page shows readiness + publish/unpublish.

## Phase 5 — AI Import ✅ (code; CSV/text)

- `lib/admin/ai-extract.ts`: **`extractAssessmentDraft({questionsText, scoringText})`** (Gemini, `GEMINI_API_KEY`) — signature takes **document text only, never answers**. Pure **`normalizeExtractedDraft`** coerces AI JSON into a clean draft (drops unmapped categories, dangling rules, etc.) — fully unit-tested.
- `lib/admin/ai-import-actions.ts`: `runExtraction` (records `source_documents`, returns draft) + `applyExtractedDraft` (persists categories→questions→profiles→rules; re-normalises, never trusts client).
- UI: **AI Import** enabled in the creation chooser → `/admin/content/[id]/import` (paste → Extract → review draft → Apply).
- **Deferred:** PDF/DOCX parsing (needs `pdf-parse`/`mammoth`, which would mutate the **shared, symlinked** `node_modules` — paste/CSV works now).

## Phase 7 — Deterministic dispatch ✅ (code)

- `lib/scoring/dispatch.ts`: pure `dispatchScore({engine, answers, questions, spec})` → `core` uses untouched `computeScore`, `custom` uses `scoreCustomAssessment`. Tested.
- `lib/admin/score-runner.ts`: `scoreCatalogAssessment` loads the published spec + questions and dispatches — the server seam the live route will call.
- **Deferred:** wiring into the live student app (separate branch, localStorage/seed-based) — a deliberate, sensitive step, not done silently.

## Phase 6 — Translations & bilingual publish ✅ (code)

- Pure `findMissingTranslations` (tested) drives a **Translations tab** (`/translations`): per-locale coverage + **AI auto-translate** (`autoTranslateAssessment`, Gemini, flagged for human review).
- **Bilingual publish validation:** `publishAssessment` blocks a missing-locale publish unless "publish single-language" is chosen; records `published_locales`.
- **Detail tabs** (`AssessmentTabs`: Questions | Scoring & Profiles | Translations) across the custom-assessment pages; **dual-source content list** separates Custom assessments from Core versions (no double-listing).

## Remaining to go fully live

- **Apply the Phase 3 migration** (your gate): `pnpm tsx scripts/apply_phase3_migration.mts` — unblocks runtime verification of Phases 4–7.
- **Deferrals (need your ok):** PDF/DOCX import parsers (would mutate the shared, symlinked `node_modules`); wiring custom scoring into the live student app (separate branch, localStorage/seed).

## Tests
`tsc` clean · **130 passing** — engine (incl. edge + determinism), dispatch, assemble-spec, profile/rule/config validation, AI-draft normaliser, translation coverage, question validation.
