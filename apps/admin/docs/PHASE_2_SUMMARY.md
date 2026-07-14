# Phase 2 — Bilingual Question Editor (Custom assessments)

> **Branch:** `feat/hybrid-assessment` · **Status:** code-complete, `tsc` clean, tests green. One step remains: apply the additive Phase 2 migration to the live DB (you run it, as in Phase 1). No production data is modified; CORE is untouched.

## What this delivers

Admins can build a **Custom** assessment's questions in **English + Arabic**, with per-answer scoring under the `custom_points_v1` model (**answer → category → points**). The CORE assessment and its engine are completely untouched.

- Creating a Custom assessment now lands on a dedicated editor at **`/admin/content/[versionId]/custom`** (Manual chooser routes here; opening a custom version from the list redirects here).
- **Scoring categories panel** — define the assessment's categories (`code` + bilingual `{en,ar}` name), e.g. `LEAD → Leadership / القيادة`.
- **Bilingual question editor** — EN / العربية tabs switch the language for the question title *and* every answer's text in one form. Per answer: letter, order, **category** dropdown, **points**. RTL inputs for Arabic.
- **Live validation** — the same pure validator runs in the editor (instant inline errors) and in the server action (authoritative).

## Schema decision (minimal additive — `custom_points_v1`)

`answer → category → points` maps onto storage as:

| Concept | Storage | Notes |
|---|---|---|
| points | `question_options.weight` | existing (added Phase 0) |
| category | **`question_options.category_code`** (new, nullable, **no** global FK) | CORE keeps using `cluster_code`; the engine reads `categoryCode ?? clusterCode` |
| valid categories | **`assessment_categories`** (new table, catalog-scoped) | `{ id, catalog_id, code, name jsonb, display_order }`, `unique(catalog_id, code)`, admin-only RLS |

Migration: [`supabase/migrations/202606140002_custom_categories.sql`](../supabase/migrations/202606140002_custom_categories.sql) — additive + idempotent. CORE's `cluster_code` FK to the global `clusters` table is left intact (that's the "keep CORE untouched" guarantee).

## Validation rules (`lib/admin/custom-question-validation.ts`, pure + tested)

- ❌ empty **English** title (Arabic optional)
- ❌ duplicate answer **letters**
- ❌ fewer than **2 answers** for single-choice (exactly 2 for binary)
- ❌ answer mapping to an **unknown category** (null/unscored is allowed)
- ❌ each scored answer needs **English text**; points must be a finite number ≥ 0
- `text` questions skip all answer/scoring checks

## Files

**New**
- `lib/admin/custom-question-validation.ts` + `.test.ts` (13 tests)
- `lib/admin/custom-content.ts` — reads: `listAssessmentCategories`, `listCustomQuestions`
- `lib/admin/custom-question-actions.ts` — writes: category CRUD + `addCustomQuestion` / `saveCustomQuestion` / `deleteCustomQuestion`
- `components/admin/CustomCategoriesPanel.tsx`, `components/admin/CustomQuestionsEditor.tsx`
- `app/admin/(shell)/content/[versionId]/custom/page.tsx`
- `supabase/migrations/202606140002_custom_categories.sql`, `scripts/apply_phase2_migration.mts`

**Changed**
- `lib/scoring/types.ts` — `QuestionOption.categoryCode?`
- `lib/scoring/spec-executor.ts` — `computeClusterTotals` reads `categoryCode ?? clusterCode` (+ test)
- `lib/admin/catalog.ts` — `getAssessmentForVersion`
- `components/admin/NewAssessmentFlow.tsx` — custom → `/custom`
- `app/admin/(shell)/content/[versionId]/page.tsx` — redirect custom versions to `/custom`

## Verification

- `tsc --noEmit` — clean.
- `vitest run lib/scoring lib/admin` — **69 passing** (28 engine + 13 validation + the rest), including a `categoryCode` engine test and all required validation cases.
- Custom editor route compiles in the dev server.

## To make it live (you run — additive, idempotent, no data touched)

```bash
cd /Users/thisiswahba/Tareeq-admin
pnpm tsx scripts/apply_phase2_migration.mts
# expect: assessment_categories: present · question_options.category_code: present · done
```
Then: `/admin` → New assessment → Manual → (Custom) → the bilingual editor. Add a category, then a question, toggle EN/العربية, map answers to categories with points.

## Deferred to later phases

- **Phase 3** — Result profiles + rule builder over category totals; assemble `scoring_specs.spec_json`; full Cluster Configuration UI (this phase ships minimal category management).
- **Phase 4** — dual-source content list (CORE versions + catalog assessments) and detail tabs.
- **Reordering** custom questions (drag/up-down) — not in this slice; questions order by insertion.
