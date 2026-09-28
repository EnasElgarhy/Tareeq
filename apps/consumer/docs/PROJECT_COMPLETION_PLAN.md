# Tareeq — Gap Analysis & Completion Plan

_Baseline gap analysis: 2026-06-26. Milestone status updated: 2026-07-21._

## Contract milestone status

### Milestone 3 — Live platform and handover

**Overall status: IN PROGRESS — not ready for final sign-off or the final EUR 1,950 payment.**

Current evidence snapshot: **4 verified, 4 partial, and 9 pending or blocked items out of 17.**
This status distinguishes working staging/code evidence from the signed checklist's requirement
for a live production platform and completed handover.

|   # | Signed-checklist outcome                         | Status                        | Current evidence / remaining work                                                                                                                                                                          |
| --: | ------------------------------------------------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Live on a real secure domain                     | BLOCKED                       | `tareek.me` and `www.tareek.me` did not resolve on 2026-07-21. Consumer and admin staging both returned HTTPS 200. Configure production DNS and verify TLS.                                                |
|   2 | Register, assess, and receive results live       | BLOCKED                       | The end-to-end flow works on staging, but the required public production domain is not live. Deploy and run production UAT.                                                                                |
|   3 | Works on phone Chrome and Safari                 | PARTIAL                       | Automated 390 x 844 mobile Chromium/WebKit coverage rendered 216 EN/AR question routes plus start, results, and share checks without cutoff/overlap. Complete a real-device Chrome/Safari production pass. |
|   4 | Five profiles produce the correct live results   | PARTIAL                       | Five canonical fixtures pass exactly in both consumer and admin scoring engines (10/10). Run the same five fixtures on production and retain evidence.                                                     |
|   5 | CSV is delivered and opens in Excel              | PARTIAL                       | CSV export exists in admin. Produce a sample from the release environment, open it in Excel, and deliver the file as evidence.                                                                             |
|   6 | Research CSV excludes names and emails           | VERIFIED                      | Export uses a salted pseudonymous user hash and contains no name or email columns.                                                                                                                         |
|   7 | CSV includes assessment date and scoring version | BLOCKED                       | `completed_at` is exported, but `version_id` / scoring-version fields are absent from the anonymized CSV columns. Add and test them.                                                                       |
|   8 | Full Arabic RTL platform                         | PARTIAL                       | Arabic content, RTL UI, Arabic share cards, and locale-specific narration exist on staging. Complete production Arabic UAT.                                                                                |
|   9 | Native Arabic speaker reviewed the questions     | PENDING CLIENT / HUMAN REVIEW | Obtain a dated review record and close any wording corrections.                                                                                                                                            |
|  10 | Voice speaks Arabic correctly                    | PENDING CLIENT / HUMAN REVIEW | Arabic voice infrastructure exists; native-speaker listening approval is still required.                                                                                                                   |
|  11 | Client has owner-level repository access         | VERIFIED                      | Git remote is owned by `EnasElgarhy/Tareeq`. Confirm the client's account retains owner/admin access at handover.                                                                                          |
|  12 | All credentials are handed over                  | PENDING HANDOVER              | Prepare and acknowledge a secure access inventory without placing secrets in Git or this document.                                                                                                         |
|  13 | Final scoring document is delivered              | VERIFIED                      | Scoring documentation and corrected executable five-profile fixtures are present. Include them in the final handover package.                                                                              |
|  14 | Written technical documentation is delivered     | VERIFIED                      | Architecture, deployment, coding-style, methodology, and feature documentation exist in the repository.                                                                                                    |
|  15 | Video handover / admin walkthrough is completed  | PENDING HANDOVER              | Record or conduct the walkthrough and retain acknowledgment.                                                                                                                                               |
|  16 | Client understands the 12-month support period   | PENDING ACKNOWLEDGMENT        | Record this in the final handover/sign-off.                                                                                                                                                                |
|  17 | Client understands new work is separately scoped | PENDING ACKNOWLEDGMENT        | Record this in the final handover/sign-off.                                                                                                                                                                |

Additional Phase 3 dependency accepted during Milestone 2: **Stripe test-card payment remains
pending until the client supplies the Stripe account.** This does not silently remove the
criterion; it must be implemented and evidenced or explicitly amended before final closure.

#### Milestone 3 closure sequence

1. Configure `tareek.me` production DNS/TLS and deploy the approved release candidate.
2. Run production registration, assessment, results, EN/AR, and real-phone Chrome/Safari UAT.
3. Add assessment/scoring version fields to the anonymized CSV; export, open in Excel, and
   deliver a sample.
4. Run all five canonical scoring profiles on production and save the exact outputs.
5. Complete native Arabic question and voice review.
6. Complete Stripe or obtain an explicit final-scope amendment.
7. Deliver the credential inventory, repository/access confirmation, documentation bundle,
   and admin walkthrough.
8. Record the support/new-work acknowledgments and sign the Milestone 3 block.

This is an engineering delivery tracker, not a legal determination. Final payment and IP
transfer follow the signed checklist only after Milestone 3 acceptance is signed.

## TL;DR

Tareeq is **~75–85% built**. The standard CORE consumer flow is now connected to the CMS,
with each attempt pinned to one published content version from start through scoring, audio,
results, sharing, persistence, and resume. The remaining integration gap is a student runner
for custom/hybrid assessments; everything else is finish-work.

- **Consumer** (`feat/bilingual-assessment`, `/Users/thisiswahba/Tareeq`): assessment flow,
  bilingual EN/AR, Kai narration, **real Supabase email-OTP auth + account profile + DB
  persistence**, Gemini results pipeline with fallback. The CORE flow reads the active published
  CMS version; the bundled seed is retained only as an emergency/local fallback and test fixture.
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

### G2 — Custom assessment delivery remains

The standard CORE runner now loads `content_versions`/`questions` from Supabase and keeps an
in-progress attempt on the exact published version it started with. CMS edits therefore reach
new CORE attempts after publication without changing attempts already underway.
Release dependency: apply `202607210001_published_assessment_versions.sql` before deploying the
consumer/admin code. Until then, the consumer intentionally uses its bundled fallback.

**Still open:** custom/hybrid assessments cannot yet be taken by students. The custom scoring
spec executor exists in admin, but there is no consumer route that selects a catalog assessment,
loads its published scoring spec, and renders its result profiles.

---

## Gap inventory (by area)

### A. Architecture / integration

| #   | Gap                                                                           | Severity                                 | Evidence                                                                                                                    |
| --- | ----------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| A1  | Two branches unmerged; 60+ untracked admin files at risk                      | 🔴 Critical                              | `git status` on hybrid worktree                                                                                             |
| A2  | CORE consumer reads active CMS `content_version` and pins attempts            | 🟡 Implemented; migration/deploy pending | `lib/assessment/content.server.ts`, `app/api/assessment-session/route.ts`, `202607210001_published_assessment_versions.sql` |
| A3  | No student runner for custom assessments; `dispatchScore()` never called live | 🔴 Critical                              | `lib/scoring/dispatch.ts` vs `app/api/results/generate/route.ts`                                                            |
| A4  | Drizzle `db/schema.ts` not updated with new catalog tables (raw SQL only)     | 🟡 Medium                                | `db/schema.ts`                                                                                                              |

### B. Feature completeness

| #   | Gap                                                                                  | Severity     | Evidence                                       |
| --- | ------------------------------------------------------------------------------------ | ------------ | ---------------------------------------------- |
| B1  | Admin **Users** page is an empty stub                                                | 🟠 High      | `app/admin/(shell)/users/page.tsx`             |
| B2  | Admin **Analytics** page is an empty stub                                            | 🟠 High      | `app/admin/(shell)/analytics/page.tsx`         |
| B3  | AI Import flow UI wired but backend incomplete                                       | 🟠 High      | `app/admin/(shell)/content/[versionId]/import` |
| B4  | Admin authoring threads `en` only — Arabic titles not saved in add/CSV paths         | 🟠 High      | `lib/admin/*-actions.ts` (HYBRID doc HIGH-2)   |
| B5  | Consumer profile is local-only for results (no cross-device read from DB)            | 🟡 Medium    | `ProfileScreen.tsx` / `lib/profile/journey.ts` |
| B6  | Locked profile modules (Deep Dive, Skills, Pulse) — intentional Phase-2 placeholders | ⚪ By design | `lib/profile/journey.ts:20-65`                 |

### C. i18n

| #   | Gap                                                                    | Severity | Evidence                                                             |
| --- | ---------------------------------------------------------------------- | -------- | -------------------------------------------------------------------- |
| C1  | ~12 UI-chrome strings hardcoded English (Profile, Start, Registration) | 🟠 High  | `ProfileScreen.tsx`, `AssessmentStart.tsx`, `RegistrationScreen.tsx` |
| C2  | Root layout hardcodes `lang="en" dir="ltr"`                            | 🟠 High  | `app/layout.tsx:72`                                                  |

### D. Production hardening

| #   | Gap                                                                                        | Severity    | Evidence                                               |
| --- | ------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------ |
| D1  | **Rotate exposed secrets** (service-role key, DB password, Gemini key seen in transcripts) | 🔴 Critical | `.env.local` (gitignored, but exposed in chat history) |
| D2  | Email OTP needs `{{ .Token }}` in Supabase email template + SMTP for volume                | 🟠 High     | Supabase dashboard (auth just shipped)                 |
| D3  | No CI/CD (`.github/workflows` absent) — no automated type/lint/test gate                   | 🟠 High     | repo root                                              |
| D4  | No E2E tests; Playwright not installed                                                     | 🟠 High     | `package.json`                                         |
| D5  | No startup env validation (fails on first call, not eagerly)                               | 🟡 Medium   | `lib/supabase/admin.ts`                                |
| D6  | No Docker / `vercel.json` (Vercel project exists; config minimal)                          | 🟡 Medium   | `.vercel/project.json`, `next.config.ts`               |
| D7  | Unused `GEMINI_API_KEY` in consumer `.env.example` (results use Claude)                    | ⚪ Low      | `.env.example`                                         |

**What's already solid:** scoring engine (extensively unit-tested), RLS (all tables protected,
admin-only where needed), results fallback (never blocks the user), Supabase auth wiring,
applied migrations, Vercel project.

---

## The plan (phased, dependency-ordered)

### Phase 0 — Converge the branches ⏱ ~1–1.5 days · BLOCKS everything

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

### Phase 1 — Connect the consumer to the CMS (the keystone) ⏱ ~2–3 days

1. **DB question loader**: replace the seed import with a query for the active
   `content_version` → `questions`+`options`; keep seed as a typed fallback. (A2)
2. **Custom-assessment runner**: a route like `/a/[catalogId]` (or `?catalogId=`) that loads a
   specific assessment's questions + `scoring_specs`. (A3)
3. **Wire dispatch**: in the results path, call `dispatchScore({engine, answers, questions,
spec})` — core → `computeScore`, custom → spec executor. Persist via the existing
   `/api/assessments/persist`. (A3)
4. Verify the full loop: admin publishes → student takes → result scored → appears in admin
   **Responses**. (This connects the auth/persistence already shipped to the admin viewer.)

### Phase 2 — Finish the admin surfaces ⏱ ~2–3 days

- Users page: student search + per-user assessment history (reuse Responses read layer). (B1)
- Analytics: completion funnel, drop-off, cluster distribution from `assessments`. (B2)
- Complete AI Import (parse → extract → review → apply). (B3)
- Thread Arabic through authoring (add/CSV/edit). (B4)

### Phase 3 — i18n completion ⏱ ~0.5 day

- Move the ~12 chrome strings into `lib/i18n/strings.ts`; wire `useLocale()` in Profile/Start. (C1)
- Make root layout `lang`/`dir` dynamic. (C2)

### Phase 4 — Production hardening ⏱ ~2 days

- **Rotate the exposed secrets** in Supabase + Google; update `.env.local`. (D1) ← do early
- Configure the OTP email template (`{{ .Token }}`) + production SMTP. (D2)
- GitHub Actions: type-check, lint, test on PR. (D3)
- Playwright + 5 critical E2E flows (take assessment, results, language switch, auth, admin
  login). (D4)
- Startup env validation; optional `vercel.json`; sync Drizzle schema; drop unused Gemini key.
  (D5, D6, A4, D7)

### Phase 5 — Launch readiness ⏱ ~1 day

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
