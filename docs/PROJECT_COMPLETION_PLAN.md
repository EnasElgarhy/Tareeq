# Tareeq — Gap Analysis & Completion Plan

_Last updated: 2026-06-26. Grounded in a current-code audit of both branches._

## TL;DR

Tareeq is **~75–85% built**, but the work is **split across two diverged branches** and the
consumer app is **not connected to the CMS database**. Those two facts are the whole story:
everything else is finish-work.

- **Consumer** (`feat/bilingual-assessment`, `/Users/thisiswahba/Tareeq`): assessment flow,
  bilingual EN/AR, Kai narration, **real Supabase email-OTP auth + account profile + DB
  persistence** (just added), Claude results pipeline with fallback. Reads questions from the
  **hardcoded seed**, not the DB.
- **Admin** (`feat/hybrid-assessment`, `/Users/thisiswahba/Tareeq-admin`): full CMS, hybrid
  assessment authoring (manual + AI import), deterministic scoring engine + spec executor,
  result profiles/rules, **Responses viewer**, home-feed app. Users/Analytics pages are stubs.
- **Schema**: catalog/scoring/respondent migrations are **applied to live Supabase**; RLS is
  complete and production-coherent.

The two branches have diverged by **225 files** with **~11 conflict hotspots**.

---

## The two structural gaps (everything hinges on these)

### G1 — Branch convergence (do this FIRST)
The consumer and admin live on separate branches; **60+ admin files are untracked** on the
hybrid worktree and will be lost on a branch switch. Until they're one codebase, every other
fix has to be done twice.

- merge-base is ~2 weeks old; bilingual is 9 commits ahead, hybrid 19.
- Conflict hotspots (same files edited on both): `middleware.ts`, `lib/supabase/*`,
  `components/assessment/{IntroScreen,QuestionScreen,ResultsScreen,AnalyzingScreen}.tsx`,
  `app/globals.css`, `app/api/results/generate/route.ts`, `lib/audio/use-kai-narration.ts`.

### G2 — Consumer is disconnected from the CMS (the "keystone")
`lib/assessment/questions.ts` builds questions from `lib/content/seed.ts`. The consumer never
queries `content_versions`/`questions`. Consequences:
1. **CMS edits never reach students** — the app is frozen at seed time.
2. **Custom/hybrid assessments can't be taken at all** — the scoring `dispatch.ts` engine is
   built and tested but **never called** in the live results flow; there's no student route to
   load a custom assessment.

This is the difference between "a CMS demo" and "a product."

---

## Gap inventory (by area)

### A. Architecture / integration
| # | Gap | Severity | Evidence |
|---|-----|----------|----------|
| A1 | Two branches unmerged; 60+ untracked admin files at risk | 🔴 Critical | `git status` on hybrid worktree |
| A2 | Consumer reads seed, not DB active `content_version` | 🔴 Critical | `lib/assessment/questions.ts:4-24` |
| A3 | No student runner for custom assessments; `dispatchScore()` never called live | 🔴 Critical | `lib/scoring/dispatch.ts` vs `app/api/results/generate/route.ts` |
| A4 | Drizzle `db/schema.ts` not updated with new catalog tables (raw SQL only) | 🟡 Medium | `db/schema.ts` |

### B. Feature completeness
| # | Gap | Severity | Evidence |
|---|-----|----------|----------|
| B1 | Admin **Users** page is an empty stub | 🟠 High | `app/admin/(shell)/users/page.tsx` |
| B2 | Admin **Analytics** page is an empty stub | 🟠 High | `app/admin/(shell)/analytics/page.tsx` |
| B3 | AI Import flow UI wired but backend incomplete | 🟠 High | `app/admin/(shell)/content/[versionId]/import` |
| B4 | Admin authoring threads `en` only — Arabic titles not saved in add/CSV paths | 🟠 High | `lib/admin/*-actions.ts` (HYBRID doc HIGH-2) |
| B5 | Consumer profile is local-only for results (no cross-device read from DB) | 🟡 Medium | `ProfileScreen.tsx` / `lib/profile/journey.ts` |
| B6 | Locked profile modules (Deep Dive, Skills, Pulse) — intentional Phase-2 placeholders | ⚪ By design | `lib/profile/journey.ts:20-65` |

### C. i18n
| # | Gap | Severity | Evidence |
|---|-----|----------|----------|
| C1 | ~12 UI-chrome strings hardcoded English (Profile, Start, Registration) | 🟠 High | `ProfileScreen.tsx`, `AssessmentStart.tsx`, `RegistrationScreen.tsx` |
| C2 | Root layout hardcodes `lang="en" dir="ltr"` | 🟠 High | `app/layout.tsx:72` |

### D. Production hardening
| # | Gap | Severity | Evidence |
|---|-----|----------|----------|
| D1 | **Rotate exposed secrets** (service-role key, DB password, Gemini key seen in transcripts) | 🔴 Critical | `.env.local` (gitignored, but exposed in chat history) |
| D2 | Email OTP needs `{{ .Token }}` in Supabase email template + SMTP for volume | 🟠 High | Supabase dashboard (auth just shipped) |
| D3 | No CI/CD (`.github/workflows` absent) — no automated type/lint/test gate | 🟠 High | repo root |
| D4 | No E2E tests; Playwright not installed | 🟠 High | `package.json` |
| D5 | No startup env validation (fails on first call, not eagerly) | 🟡 Medium | `lib/supabase/admin.ts` |
| D6 | No Docker / `vercel.json` (Vercel project exists; config minimal) | 🟡 Medium | `.vercel/project.json`, `next.config.ts` |
| D7 | Unused `GEMINI_API_KEY` in consumer `.env.example` (results use Claude) | ⚪ Low | `.env.example` |

**What's already solid:** scoring engine (extensively unit-tested), RLS (all tables protected,
admin-only where needed), results fallback (never blocks the user), Supabase auth wiring,
applied migrations, Vercel project.

---

## The plan (phased, dependency-ordered)

### Phase 0 — Converge the branches  ⏱ ~1–1.5 days  · BLOCKS everything
1. In the **hybrid** worktree: `git add` + commit all untracked admin work (split into logical
   commits: admin CMS, scoring engine, Responses, home-feed).
2. In the **bilingual** checkout: commit the Arabic-voice WIP + the new auth.
3. Pick a trunk and merge. **Recommendation: base = `feat/hybrid-assessment`** (it carries the
   larger unique surface — admin tier, home feed, results framework — so there's less to
   re-apply), then merge `feat/bilingual-assessment` in (i18n, consumer auth, fonts, Kai
   videos). _Either direction works; the cost is the same ~8–11 conflict files._
4. Resolve conflicts in order: `middleware.ts` (combine admin gating + consumer session
   refresh) → `lib/supabase/*` → assessment screens (keep auto-play + i18n + auth, layer in
   hybrid's results framework) → `ResultsScreen.tsx` → `globals.css` (keep both token blocks).
5. Gate: `tsc`, `vitest run`, `next build`, manual smoke of `/admin/login` and the assessment
   flow in both locales. Tag the result as `main`.

### Phase 1 — Connect the consumer to the CMS (the keystone)  ⏱ ~2–3 days
1. **DB question loader**: replace the seed import with a query for the active
   `content_version` → `questions`+`options`; keep seed as a typed fallback. (A2)
2. **Custom-assessment runner**: a route like `/a/[catalogId]` (or `?catalogId=`) that loads a
   specific assessment's questions + `scoring_specs`. (A3)
3. **Wire dispatch**: in the results path, call `dispatchScore({engine, answers, questions,
   spec})` — core → `computeScore`, custom → spec executor. Persist via the existing
   `/api/assessments/persist`. (A3)
4. Verify the full loop: admin publishes → student takes → result scored → appears in admin
   **Responses**. (This connects the auth/persistence already shipped to the admin viewer.)

### Phase 2 — Finish the admin surfaces  ⏱ ~2–3 days
- Users page: student search + per-user assessment history (reuse Responses read layer). (B1)
- Analytics: completion funnel, drop-off, cluster distribution from `assessments`. (B2)
- Complete AI Import (parse → extract → review → apply). (B3)
- Thread Arabic through authoring (add/CSV/edit). (B4)

### Phase 3 — i18n completion  ⏱ ~0.5 day
- Move the ~12 chrome strings into `lib/i18n/strings.ts`; wire `useLocale()` in Profile/Start. (C1)
- Make root layout `lang`/`dir` dynamic. (C2)

### Phase 4 — Production hardening  ⏱ ~2 days
- **Rotate the exposed secrets** in Supabase + Google; update `.env.local`. (D1) ← do early
- Configure the OTP email template (`{{ .Token }}`) + production SMTP. (D2)
- GitHub Actions: type-check, lint, test on PR. (D3)
- Playwright + 5 critical E2E flows (take assessment, results, language switch, auth, admin
  login). (D4)
- Startup env validation; optional `vercel.json`; sync Drizzle schema; drop unused Gemini key.
  (D5, D6, A4, D7)

### Phase 5 — Launch readiness  ⏱ ~1 day
- Security review pass (RLS re-check post-merge, consumer DB access paths).
- Performance/CWV check on the consumer; bundle budget.
- Basic monitoring/error reporting; seed real production content version; remove sample data.

**Rough total: ~9–12 working days** to a launchable v1 (CORE-only could ship after Phases 0–1,
3, and the security items in 4).

---

## Decisions needed from you
1. **Trunk branch** for convergence (recommended: hybrid as base) — or keep them separate apps?
2. **Launch scope**: ship **CORE-only** first (Phases 0–1 + i18n + security), with custom
   assessments as a fast-follow? Or hold launch until custom assessments are student-takeable?
3. **Admin Users/Analytics**: build now, or unship those nav items until Phase 2 to avoid empty
   pages in front of stakeholders?
4. **Secret rotation**: confirm you'll rotate the exposed Supabase/Google credentials (I can't
   do this for you).
