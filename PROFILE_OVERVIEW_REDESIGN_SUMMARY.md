# Profile Overview Redesign — Implementation Summary

Implements the handoff spec + `tareeq-profile-redesign-en.html` mockup. Scope held to the Overview tab as instructed — Compass, Journey, Kai, and Settings tabs are otherwise untouched (two narrow, deliberate exceptions noted below). Nothing deployed, nothing committed.

## The one product decision the spec asked for

"What counts as a streak day?" — confirmed: **any app visit**. Simplest option, reuses the visit-tracking pattern already established for the inactivity nudge (Phase E), lowest friction for a brand-new feature.

## A real bug the streak feature caught

`dateKey()`'s first draft used `date.toISOString().slice(0, 10)` — but `toISOString()` converts to **UTC**, while `new Date()` and `new Date(y, m, d)` are **local-time** constructs. For any timezone ahead of UTC — which is every timezone this product actually ships in (Egypt and the Gulf are all UTC+2 to UTC+4) — this could roll a visit to the wrong calendar day. Caught by the test suite itself (a date-math test failed by exactly one day), fixed by computing the key from local date components (`getFullYear()`/`getMonth()`/`getDate()`) instead.

## Where the mockup and the spec text disagreed, and what I did

The spec text said to reuse "the exact treatment already built for `/results`" (per-cluster colored ring, centered hero). The mockup shows something visually simpler: a **fixed** dark gradient (not per-cluster colored) with a smaller, corner-cropped ring and no center cluster-code badge. I followed the mockup for the compact hero's *look* (fixed gradient, corner ring, two stat chips instead of three) while still reusing the *real* `ResultCompass` component and `CLUSTER_VISUALS` data for the parts both agree on — extracting both into shared files so nothing here is redrawn from scratch, and `variant="full"` (an exact reproduction of `/results`' current hero) exists and is ready, even though this pass doesn't wire `/results` itself to use it.

## Two narrow exceptions to "Overview only"

1. **`ResultsScreen.tsx`** — two pure extractions (`CLUSTER_VISUALS`, `ResultCompass`) moved into shared files so the Overview hero and `/results` can never visually drift apart on the one thing they now share. Zero behavior change there; `/results`' own rendering is otherwise untouched.
2. **`ModuleRow`** (Journey tab) — its two status badges now render through the new shared `JourneyStatusPill` instead of a second, separately-styled copy of the same three-state switch. Same information, same positions; the badges picked up the pill's exact styling in the process (a small, deliberate consistency change, not a new feature on that tab).

## What shipped

- **`CompassSignalPanel`** (new) — the CORE Compass result as a dark hero, first thing on the tab. Links into the Compass tab via a real tab switch, not a page navigation.
- **`KaiInsightCard`** — redesigned for the assessment-exists case: an aurora-gradient band (Kai's real video avatar + name), overlapping card body below it. This is the one place on the screen that uses the full brand gradient as a fill — everywhere else it stays a small accent, per the existing hard rule. The no-assessment empty state is unchanged.
- **`JourneyModuleCard`** (new) — one full-width illustrated card per module, replacing the compact strip on this tab specifically. All four icons (`CareerCompassIcon`, `DeepDiveIcon`, `SkillIcon`, `ProgressIcon`) already existed — no new icons needed there.
- **`StreakCard`** (new) + **`lib/profile/streak.ts`** (new) — visit-date tracking, current streak count, the current week's Mon–Sun dots, and the badge-progress note.
- **Achievements** — gained a subtitle line and a colored left accent bar per card (the mockup shows both on every achievement, not just the new one), plus a fifth entry, "Consistent," unlocked at a 7-day streak. Rebalanced the four existing colors so none clash with the new one.
- **"Next station"** — restyled with a dashed border and a subtle diagonal texture, matching the mockup. Same data (`deriveNextMilestone`), no logic change.
- **One new icon**: `StreakIcon` (flame) — checked `DomainIcons.tsx` first; nothing existing fit "streak," so this was a genuine gap, built in the same hairline-ink-plus-warm-gradient-accent style as the rest of the file.

## Copy

Beyond the spec's own "new copy" table: added a subtitle line for all five achievements (the mockup shows one on every card, and half-adding it only to the new entry would've looked inconsistent), and renamed `kai.panel.next_milestone`'s English text from "Next milestone" to "Next station" — its Arabic value was already "المحطة القادمة" (literally "next station"), so this fixes a pre-existing EN/AR mismatch rather than introducing a new one. Caught and corrected my own mistake while writing the Arabic achievement copy: used feminine imperative verb forms ("أكملي") in a first draft, which breaks the established house rule (masculine-default imperatives when addressing the user, since gender is unknown — feminine forms are reserved for Kai herself); fixed to "أكمل" before this shipped.

## Known, not fixed

`ProfileScreen.tsx` is now 934 lines, well past the 800-line guideline — it's been growing across every phase this session, not just this one. Flagging it the same way `ResultsScreen.tsx` was flagged in Phase C rather than attempting a risky last-minute split under this pass's own time pressure. Settings' inline JSX (~65 lines, fully self-contained) is the easiest first extraction whenever this gets picked up.

## Verification

- `tsc --noEmit` — clean
- `eslint` — clean (one pre-existing, unrelated warning, same as every prior phase)
- `vitest run` — 240/240 passing (13 new: 11 for `lib/profile/streak.ts`, 2 for the extended `deriveAchievements`)
- Dev server restarted clean; `/profile?tab=overview` and `/results` both return 200 with no runtime errors in the log

## Files touched

- New: `components/assessment/CompassSignalPanel.tsx`, `JourneyModuleCard.tsx`, `StreakCard.tsx`, `components/kai/JourneyStatusPill.tsx`, `lib/profile/streak.ts` (+ test), `lib/results/cluster-visuals.ts`
- Extended: `components/assessment/ProfileScreen.tsx` (Overview rewrite, `ModuleRow` pill unification, achievement visuals), `components/kai/KaiInsightCard.tsx`, `components/brand/DomainIcons.tsx` (+1 icon), `lib/profile/activity.ts` (+ test)
- Pure extraction, no behavior change: `components/assessment/ResultsScreen.tsx`
- `lib/i18n/strings.ts` — ~25 new keys, both locales
