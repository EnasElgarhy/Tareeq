# Kai Phase 1 — Kai Landing (Implementation Summary)

Status: **Implemented, verified, not committed, not deployed.**

This delivers the corrected Phase 1 scope agreed after reviewing
`CONSUMER_2_ARCHITECTURE.md` and `KAI_EXPERIENCE.md`: a **Kai Landing**
surface inside the existing Profile page. No live chat, no Gemini calls,
no bottom navigation, no Deep Dive Interview build.

## What shipped

### 1. Kai section inside Profile (no bottom nav)

`components/assessment/ProfileTabs.tsx` — a lightweight, horizontally
scrollable tab strip rendered *inside* the Profile page (`Overview /
Career Compass / Journey / Kai / Settings`). Profile remains the single
route; this only partitions its content. `?tab=kai` deep-links directly
into the Kai tab via a plain `window.location.search` read (not
`useSearchParams()`, so the route doesn't need a Suspense boundary).

`components/assessment/ProfileScreen.tsx` was restructured around this:
the header stays always-visible, the tab strip sits below it, and each
tab renders its own section — the pre-existing Overview snapshot,
Compass quick-links, and Journey module list all moved into tabs
unchanged; a new Settings tab consolidates account info + sign-out
(previously bare at the bottom of the page); Kai is entirely new.

### 2. Kai Landing UI

New `components/kai/` directory:

| Component | Role |
|---|---|
| `KaiPanel.tsx` | Orchestrator — greeting, insight, actions, grounding, locked tools. Fires all Kai analytics events. |
| `KaiGreeting.tsx` | Time-of-day greeting + display name (falls back to a translated "there"). |
| `KaiInsightCard.tsx` | Kai's avatar (`KaiChromaVideo`) + a deterministic, template-based "opening insight" built from the assessment context — or the empty state if there's no result yet. |
| `KaiActionCard.tsx` | Pill/button for a suggested action; toggles active state. |
| `KaiGroundingCard.tsx` | Expandable "Why this?" — lists the exact fields the insight is grounded in. |
| `KaiLockedToolCard.tsx` | Generic "coming soon" card for a locked future tool. |

Suggested actions (non-functional placeholders — clicking shows a
"coming soon" reassurance line, tracked but not wired to anything):
Explain my result, Find majors that fit me, Compare two careers, Build
a 7-day plan, Help me explain this to my parents, Challenge my result.

Locked tools shown below, always visible regardless of assessment
state: **Action Plans**, **Career Explore**, **Deep Dive Interview** —
placeholders only, per the explicit instruction not to build these yet.

Empty state (no completed CORE Compass): "Finish your Career Compass
first, then I can guide you with more personal advice." + a CTA into
`/start`. All copy routes through the i18n catalog with EN/AR strings
(see below) — no hardcoded fallback English baked into the components.

### 3. Context builder foundation — `lib/kai/`

`lib/kai/types.ts` defines the `KaiContext` shape exactly as specified:

```ts
{
  user: { displayName, locale },
  assessment: { primaryCluster, confidence, archetype, rewardDriver, ecosystemFit, topClusters } | null,
  report: { headline, summary, recommendedMajors, recommendedCareers } | null,
  journey: { completedAssessments, lockedModules },
}
```

`lib/kai/context.ts` — `buildKaiContext({ displayName, locale, snapshot })`
is a **pure function**, no localStorage/Supabase/network access itself;
the caller (`ProfileScreen`) supplies the already-loaded
`ProfileSnapshot`. It reuses the existing `PersonalizedCompassReport`
fields directly (`clusterName`, `archetype`, `primaryDriver`,
`ecosystemFit`, `headline`, `summary`, `universityMajors`,
`careerExamples`) rather than duplicating any lookup, and maps
`score.clusterRanked` (top 3) through the existing `CLUSTER_PROFILES`
table for display names.

**No Gemini call happens anywhere in this phase.** The "opening
insight" is a deterministic string template (EN/AR, branching on
whether the user has more than one strong cluster) — a stand-in for
what a future Gemini call would generate, not a call itself.

**PII guard**: `assertNoExcludedFields()` recursively scans the built
context for a banned-key list (`email`, `respondentEmail`, `ipCountry`,
`userAgent`, `phone`, `address`, `answers`, …) and throws in
non-production (strips + logs in production) if anything ever leaks
in. Every field in `KaiContext` is already user-facing elsewhere in the
existing UI (Compass snapshot tiles, Results screen stat pills) — no
hidden scores, no raw per-cluster point totals, no answer digest.

### 4. Analytics events

Added to the shared `EVENT_NAMES` taxonomy (mirrored byte-identical in
both `Tareeq` and `Tareeq-admin`):

```
kai_opened            — fired once per KaiPanel mount, { hasResult: boolean }
kai_action_clicked    — { action: <action id> }
kai_grounding_opened  — fired when the "Why this?" card expands
kai_locked_tool_clicked — { tool: "action_plans" | "explore" | "deep_dive_interview" }
```

All payloads are non-PII by construction (booleans/enums only — no
names, emails, or scores in metadata).

### 5. Localization

`lib/i18n/strings.ts` gained ~50 new keys under `profile.tab.*` and
`kai.panel.*` / `kai.action.*`, each with real EN and AR text (not
placeholders) and RTL-safe. Pre-existing hardcoded-English strings
elsewhere in `ProfileScreen` (Overview/Journey/Compass headings, a
known pre-existing gap tracked separately) were intentionally left
untouched — out of scope for this phase.

### 6. Tests

`lib/kai/context.test.ts` — 14 tests: assessment/report field mapping,
`topClusters` capped at 3, journey completed/locked split, display
name & locale passthrough, null assessment/report with no CORE report,
fallback name when blank, **no email leakage** (a fake registration
with a real-looking email is asserted to never appear anywhere in
`JSON.stringify(context)`), no raw cluster-score leakage, no raw answer
leakage, and direct unit tests of `assertNoExcludedFields` itself.

`lib/analytics/events.test.ts` — extended to assert the four Kai event
names are present in the shared taxonomy (mirrored in both repos).

## Verification performed

- `tsc --noEmit` — clean, 0 errors.
- `vitest run` — **65/65 tests passing** across 8 files (Tareeq); the
  mirrored `events.test.ts` also passes independently in Tareeq-admin
  (20/20).
- `eslint` on every new/modified file — 0 errors, 2 pre-existing
  unrelated warnings (underscore-prefixed intentionally-unused params,
  not introduced by this work).
- Dev server (`localhost:3010`) restarted clean and compiled `/profile`
  with no build or runtime errors (`✓ Compiled /profile in 1575ms`, no
  console errors in the server log).
- `git status` confirms nothing was committed in either repo.

**Not performed in this pass:** interactive, signed-in browser
click-through of the five Profile tabs. `/profile` is gated behind
real Supabase email-OTP auth, and there's no dev bypass in this app.
Fabricating a signed-in session (or minting a real OTP via the service
role key) to drive that walkthrough was avoided rather than worked
around, since it means handling live auth credentials/sessions outside
of the app's real sign-in flow. In its place: `tsc` type-checks
`ProfileScreen.tsx`'s full usage of `KaiPanel`/`buildKaiContext`/tab
state against real types (a prop or shape mismatch would fail here),
the route compiles and serves the (signed-out) branch with zero
runtime errors, and the 14 context-builder tests cover the exact data
states the signed-in Kai tab depends on (with/without a completed
assessment, missing report fields, PII exclusion). If you want a real
click-through before this ships, the fastest path is signing in
manually in a browser and clicking through the tabs — happy to do a
guided pass together.

## Explicit constraints honored

- No bottom navigation added — `ProfileTabs` is scoped inside Profile.
- Kai is labeled "Kai," not "Chat."
- Zero Gemini (or any AI) calls added in this phase.
- Deep Dive Interview is a locked placeholder card only.
- No commits, no deploy.

## Deferred to a later phase (not started)

- Live chat / Gemini wiring for Kai's conversation.
- Making the six action cards actually do something.
- Deep Dive Interview itself.
- Full Arabic localization of pre-existing Profile copy outside Kai.
