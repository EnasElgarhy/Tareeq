# Phase D — Journey Narrative Layer

Layered narrative and honest unlock messaging onto the Journey tab. No new AI calls, no changes to Overview/Compass, nothing deployed or committed.

## A pre-existing bug that changed the plan

Before writing any copy, I checked whether locked modules actually unlock after CORE Compass completes — because the brief's ask ("explain what unlocks locked modules") only makes sense if that's true.

It isn't. `lib/profile/journey.ts:129` has:

```ts
status: (prereqMet ? "locked" : "locked") as ModuleStatus,
```

Both branches return `"locked"` — the `prereqMet` boolean is computed and then never used. Deep Dive, Skills Audit, and Career Pulse stay locked forever, regardless of CORE completion. This is a real, existing condition in the codebase, not something introduced by this phase.

**I did not fix this.** Flipping the ternary to `prereqMet ? "available" : "locked"` would make these rows look unlocked, but they'd still do nothing when tapped — their `route` stays `undefined` since no `/deep-dive`, `/skills-audit`, or `/pulse-check` pages exist. That's a worse UX than a clearly-locked row (looks interactive, isn't), and building those three real assessment flows is a completely different, much larger scope than "Journey narrative layer." Left as-is, flagged here explicitly.

**This directly changed the copy I could honestly ship.** My first draft had locked rows say "Unlocks after completing your CORE Compass" — which would become a broken, visibly false promise for any user who *has* completed CORE and still sees the row locked. Shipped instead: "Coming soon as Tareeq grows" (matching the tone of the existing Settings footer copy) — true regardless of CORE completion state, since it makes no specific claim about when or how it unlocks.

## What changed

**`lib/kai/celebration.ts`** — generalized from a single CORE-only boolean flag to `hasSeenModuleCelebration(moduleId)` / `markModuleCelebrationSeen(moduleId)`, keyed per module. Only CORE Compass can actually complete today (per the bug above), so this is only exercisable for CORE right now — but the mechanism is correct and ready for when the other three modules ship for real, without needing another rewrite then. Added `lib/kai/celebration.test.ts` (3 tests) — this file had zero coverage before.

**`ProfileScreen.tsx` — Journey tab:**
- Every `ModuleRow` gets a new one-line caption under the tagline: for available/completed modules, a short Kai-voiced take on what the module actually is ("The foundation — everything else builds on this."); for locked modules, the honest "coming soon" line above instead of a specific unlock claim.
- Journey header now shows an estimated time remaining ("~52 min left") alongside the existing unlocked-count badge, computed from the not-yet-completed modules' duration labels.
- **Translated the entire Journey tab**, which had zero i18n before this — every string was hardcoded English ("Your journey", "Done", "Soon", "Completed {date}", etc.). Adding new bilingual captions next to an otherwise-untranslated tab would have repeated the exact half-translated problem Settings had before Phase A, so I fixed the whole tab's strings while in here, not just the new ones.

**`lib/profile/activity.ts`** — new `deriveMinutesRemaining(snapshot)`, pure, sums the leading number out of each not-completed module's `durationLabel`. 3 new tests.

## What I deliberately did NOT build

**Per-module unlock-condition copy naming the actual prerequisite** (e.g. "Unlocks after CORE Compass") — considered, then dropped once I found the ternary bug above. Shipping a specific, breakable claim isn't better than a generic one when the underlying mechanism can't back it up.

**True per-module celebration variety** (different title/subtitle per module, not just per-module *tracking*) — the existing `kai.celebration.core_title`/`core_subtitle` strings stay CORE-specific. Since no other module can complete today, building distinct celebration copy for modules that can't be reached yet would be speculative work with nothing to verify it against. The tracking mechanism (which module, seen or not) is generalized; the copy isn't, yet.

## Verification

- `tsc --noEmit` — clean
- `eslint` on every touched file — clean (same pre-existing, unrelated `ModuleRow` warning as Phases B/C)
- `vitest run` — 203/203 passing (6 new: 3 for `celebration.ts`, 3 for `deriveMinutesRemaining`)
- Dev server restarted clean, `/profile?tab=journey` returns 200

## Files touched

- `lib/kai/celebration.ts` — generalized to per-module tracking
- `lib/kai/celebration.test.ts` — new, 3 tests
- `lib/profile/activity.ts` — new `deriveMinutesRemaining()`
- `lib/profile/activity.test.ts` — 3 new tests
- `components/assessment/ProfileScreen.tsx` — Journey tab restructure, `ModuleRow` caption line, full tab i18n
- `lib/i18n/strings.ts` — 12 new keys under `profile.journey.*`, both locales
