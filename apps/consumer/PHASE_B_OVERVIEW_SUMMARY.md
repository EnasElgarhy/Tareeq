# Phase B — Overview Command Center

Redesigned the Overview tab's priority and content per the Phase B brief. No new AI calls, no changes to Compass or Journey tabs, nothing deployed or committed.

## What changed

**File:** `components/assessment/ProfileScreen.tsx` (`OverviewDashboard`)

New top-to-bottom order, matching the requested priority exactly:

1. **Kai's daily insight** (`KaiInsightCard`) — now rendered *without* its own CTA button. Previously it duplicated the exact same "Continue with Kai" action as the card below it — two buttons on one screen doing the same thing. Now it's purely the observation; the action lives in one place only.
2. **One primary recommended action** — the existing "today's move" card, now the single owner of the "Continue with Kai" CTA (upgraded to `btn-v2--primary` since it's the one thing on the screen you're meant to do).
3. **Journey progress** (`JourneyPath`) — unchanged.
4. **Next unlock** — moved up, and un-gated. Previously this only rendered behind `snapshot.hasAnyResult`, which meant a brand-new user with zero completed modules never saw it at all — even though their "next milestone" is simply the CORE Compass itself, a genuinely useful thing to show them. It now renders for everyone `deriveNextMilestone()` returns something for.
5. **Recent activity** — unchanged, just reordered.
6. **Achievements / progress** — new. See below.

## New: Achievements

`lib/profile/activity.ts` gains `deriveAchievements(snapshot)`, a pure function over data already in `ProfileSnapshot` — no new storage, no invented streak-tracking that doesn't exist. Four entries, derived from real state:

- Joined Tareeq (`registration.verifiedAt`)
- First Compass (`coreReport` exists)
- Deep Dive done / Skills mapped (module status === "completed")

Unearned achievements stay visible, shown locked (grey, lock icon) rather than hidden — so a brand-new user sees a trophy case with one earned badge and three visible next steps, not an empty section. Rendered as a compact pill row in a new card at the bottom of Overview.

## What I deliberately did NOT touch

**The shared profile header** (Kai avatar, name, email, completion %) — the brief asked to "reduce big profile header dominance," but this header renders once, above the tab bar, shared by all five tabs (`ProfileScreen.tsx:138-166`). Shrinking or removing parts of it would change Compass, Journey, Kai, and Settings too, which the brief explicitly fenced off this phase ("do not redesign Compass yet," "do not redesign Journey yet"). It's already been compressed to a single row in earlier work. Flagging it as a candidate for a dedicated cross-tab chrome pass rather than touching shared UI under an Overview-scoped task.

**Duplicated Compass summary / repeated static info** — audited and confirmed this doesn't currently exist: Overview never rendered `CareerProfileSnapshot` (that content is Compass-tab-only). Nothing to remove here; a prior pass already got this right.

## Verification

- `tsc --noEmit` — clean
- `eslint` on every touched file — clean (one pre-existing, unrelated warning in `ModuleRow`'s unused `description` param, not introduced by this change)
- `vitest run` — 188/188 passing, including a new `lib/profile/activity.test.ts` (previously this file had **zero** test coverage despite `deriveRecentActivity`/`deriveNextMilestone` already existing) covering all three derive functions, 10 new tests
- Dev server restarted clean, `/profile?tab=overview` returns 200

## Files touched

- `components/assessment/ProfileScreen.tsx` — `OverviewDashboard` restructure, new achievements row, import additions
- `lib/profile/activity.ts` — new `Achievement` type + `deriveAchievements()`
- `lib/profile/activity.test.ts` — new, 10 tests
- `lib/i18n/strings.ts` — 5 new keys (`profile.overview.achievements_title`, `profile.achievement.joined`, `profile.achievement.core_complete`, `profile.achievement.deep_dive`, `profile.achievement.skills_audit`), both locales
