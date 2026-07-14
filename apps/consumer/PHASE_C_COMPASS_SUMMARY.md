# Phase C — Compass Deep Report

Expanded the Compass tab from a one-card teaser into an explorable report. No new AI calls, no changes to Overview/Journey, nothing deployed or committed.

## The theme mismatch that changed the plan

The Phase-C proposal in the profile-experience audit said this would mostly be *reuse*: pull `ResultsScreen.tsx`'s already-built sections (`CoreSignalCard`, `CareerFamilyCard`, `SubjectReasonCard`, `PathPanel`, `ReportSection`) into the Compass tab.

Reading `ResultsScreen.tsx` in full before touching anything surfaced a real problem with that plan: those components are hardcoded to the **dark "night" theme** — `bg-sand/[0.055]`, `text-sand`, cream-stroke icons from `ResultIcons.tsx`. The Compass tab is the light "carbon on white" profile theme. Dropping the dark components in verbatim would have looked broken, not premium.

So instead of copying components, I reused the **data and the one genuinely reusable pure helper**, and built new light-themed presentation matching the Compass tab's actual existing design system:

- `lib/results/report-helpers.ts` — new shared module. Extracted `getSubjectReason()` and `youtubeSearchUrl()` out of `ResultsScreen.tsx` (they were private, unexported functions) so both screens use one source of truth instead of two copies drifting apart. `ResultsScreen.tsx` itself is otherwise untouched — same behavior, same visuals, just importing instead of defining these two functions locally.
- `components/assessment/CompassReport.tsx` — new component, light-themed, built from scratch using the existing `DomainIcons.tsx` vocabulary (not `ResultIcons.tsx`) and the same white-card/`border-carbon/8` style already used everywhere else in the profile.

## What's now in the Compass tab

Wired into `ProfileScreen.tsx` right after the existing `CareerProfileSnapshot` hero, only when `snapshot.coreReport` exists:

1. **Why this direction** — `report.summary`, expanded by default.
2. **Confidence** — the existing confidence %/label, now with a plain-language explainer of what it means.
3. **Strength breakdown** — all 8 cluster scores, ranked, as bars. This is a deliberate simplification of the roadmap's "strength radar": a real radar/spider chart is a genuinely new visual primitive with real risk of visual bugs; a ranked bar list uses the exact same `report.score.clusterRanked` data and conveys the same "relative strengths" idea without introducing a new chart component in one pass. Flagging this as a place to revisit if a literal radar is wanted.
4. **Career matches** — `report.careerExamples`, each with a "day in the life" YouTube search link (same pattern already proven in `ResultsScreen.tsx` and in the Kai resource cards — a client-built search link, never a Gemini-invented URL).
5. **University majors to explore** — `report.universityMajors` as tags.
6. **High school subjects** — `report.highSchoolSubjects`, each expandable to `getSubjectReason()`'s explanation.
7. **Less obvious paths** — `report.nonObviousPaths` as tags.
8. **Why these career families fit / How the study path connects / Reality check / How your work style changes the path / Next steps** — the five long-form report fields, each its own expandable section.
9. **Ask Kai about this** — links to `/kai-chat?goal=explain_results`, reusing the existing goal enum. This is the "Kai exists across the whole product" principle from the audit, applied here as a single link — not a new AI call, not a redesign of Kai itself.

## What I deliberately did NOT build

**Famous people with similar traits** — skipped. Building this honestly would mean either fabricating claims about real named public figures matching a personality assessment (a factual-accuracy risk I'm not willing to take unilaterally) or sourcing real published data that doesn't exist for this product. Flagging this as a content-research task, not a coding task, and not attempting it silently.

**"Things to avoid"** — skipped. Nothing in `PersonalizedCompassReport` supports this today; building it would mean authoring new per-cluster content from scratch, which is a real content-design decision, not a "surface existing data" one. Left out rather than inventing plausible-sounding text.

## Known pre-existing issue, not fixed

`ResultsScreen.tsx` was already 901 lines before this change — over the 800-line file-size guideline. Extracting the two helper functions brought it down to 862, still over. Getting it under 800 would mean further restructuring a component that works today and isn't part of "the Compass tab," so I left it — noting it here rather than silently leaving it unmentioned.

## Verification

- `tsc --noEmit` — clean
- `eslint` on every touched file — clean (same one pre-existing, unrelated warning as Phase B)
- `vitest run` — 197/197 passing, including a new `lib/results/report-helpers.test.ts` (9 tests) covering the extracted helpers, which had zero coverage before (they were private functions)
- Dev server restarted clean, `/profile?tab=compass` returns 200

## Files touched

- `lib/results/report-helpers.ts` — new, extracted from `ResultsScreen.tsx`
- `lib/results/report-helpers.test.ts` — new, 9 tests
- `components/assessment/CompassReport.tsx` — new, 220 lines
- `components/assessment/ResultsScreen.tsx` — two private functions removed, now imports from `report-helpers.ts`; otherwise unchanged
- `components/assessment/ProfileScreen.tsx` — `CompassReport` wired into the Compass tab
- `lib/i18n/strings.ts` — 16 new keys under `profile.compass.*`, both locales
