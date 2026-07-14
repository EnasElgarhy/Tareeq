# Phase E — Kai Proactive Layer

Built a deterministic, local-first proactive layer so Kai leads with something specific instead of a generic landing every time. No Gemini call, no new backend service, nothing deployed or committed.

## Architecture

**`lib/kai/proactive/`** — new module, four files:

- `proactive-types.ts` — `KaiProactiveMoment` (a discriminated union: `resume_conversation` / `resume_topic` / `next_step` / `compass_highlight`) and `KaiProactiveContext` (greeting key, the one primary moment, inactivity flag, reordered goal list). Moments carry raw interpolation values in `params`, never pre-rendered text — the builder stays locale-agnostic.
- `proactive-context.ts` — `buildProactiveContext()`, pure, same philosophy as the existing `buildKaiContext()`: takes already-loaded data (assessment, snapshot, memory, conversation, days-since-last-seen) and decides what Kai leads with. No I/O, no Gemini, fully unit-testable.
- `proactive-render.ts` — the one place that turns a moment into an actual EN/AR sentence (`renderProactiveMomentText`) and its CTA destination/label — shared by Overview and the Kai tab so the two surfaces can't drift into rendering the same moment differently.
- `last-seen.ts` — nothing in the app previously tracked "when did this person last show up," which the inactivity nudge needs. Added a minimal localStorage timestamp, same pattern as `lib/kai/celebration.ts`.

**Priority logic**, most to least specific:
1. No assessment yet → the only honest next step is CORE Compass itself.
2. An active conversation with real back-and-forth (more than the opening message) → resume it.
3. A remembered topic (most recently updated memory item) → pick up there.
4. Otherwise → highlight one real fact from the Compass result (cluster + archetype).

## A constraint carried over from Phase D

`next_step` deliberately never fires once CORE Compass is done. Every other module is a locked placeholder (the Phase D finding: `lib/profile/journey.ts`'s ternary bug means they never actually unlock) — recommending "your next step is Deep Dive Interview" to a post-CORE user would point at something they can't do. Verified with a dedicated test (`buildProactiveContext — completed assessment state › does not recommend the next journey module`).

## Avoiding a duplicate insight card

`compass_highlight` reads as an observation ("One thing stood out from your Compass: X + Y"), not an action — it maps naturally onto the *existing* "Kai's daily insight" slot (`KaiInsightCard`), which already shows similar framing. Rather than adding a second, competing card with overlapping content, `KaiInsightCard` gained one new optional prop, `overrideText`, that swaps in the proactive-generated line when the moment is `compass_highlight`. The other three moment kinds (genuine actions with a "want to...?" framing) get their own `ProactiveMomentCard` instead. Net result: Overview never shows more than 2 Kai-voiced cards, same as before Phase E — the smarter content replaced the dumber content, it didn't add another card.

On the Kai tab, which never had a competing insight display for assessment-complete users, `ProactiveMomentCard` renders for any moment kind — there's nothing for it to duplicate there.

## What changed

- `KaiInsightCard.tsx` — new optional `overrideText` prop (backward compatible; the no-assessment empty state is unaffected).
- `KaiGreeting.tsx` — now calls `pickGreetingKey()` instead of duplicating the hour-boundary logic inline, so Overview's new greeting and the Kai tab's existing one can never disagree about what counts as "morning."
- `kaiActions.tsx` — removed `pickTodaysAction()` (the old day-of-year rotation, now fully superseded and unused); tightened `KaiAction.id` from `string` to `KaiConversationGoal` for type-safe goal-chip reordering.
- `ProfileScreen.tsx` — loads memory (`readMemory()`) and the active conversation (`readActiveConversation()`) once signed in, reads-then-updates the last-seen timestamp, builds `proactiveContext`, and passes it to both `OverviewDashboard` and `KaiPanel`. Overview's "today's move" card now sources from the proactive moment (falling back to the old featured-chip look when the moment is an insight, not an action).
- `KaiPanel.tsx` — goal chips render in `proactiveContext.goalOrder` instead of a fixed order; shows a `ProactiveMomentCard` for any assessment-complete moment; renders the inactivity nudge line.
- `components/kai/ProactiveMomentCard.tsx` — new, shared presentational component.

## Analytics — one deliberate decision

Added `kai_proactive_shown`, `kai_proactive_clicked`, `kai_goal_chip_clicked` as new events. `kai_goal_chip_clicked` fires **alongside** the pre-existing `kai_action_clicked` (from Phase 1) on the same tap, rather than replacing it — removing an established event name risks breaking anything already querying it downstream. Both fire together; not a regression, just two names for the same moment during the transition.

## Tests — 21 new, all required scenarios covered

`lib/kai/proactive/proactive-context.test.ts` (17 tests) + `last-seen.test.ts` (4 tests):
- Time-aware greeting at the morning/afternoon/evening boundaries
- No-assessment state → `next_step` targeting CORE Compass
- Completed-assessment state → `compass_highlight`, and explicitly does NOT recommend the (locked) next module
- Memory-based resume → picks the most recently updated item, maps category to a sensible goal
- Conversation-resume outranks memory-resume; a single unread opener does NOT count as resumable
- Goal-chip reordering leads with the right goal without dropping any of the 6 actions
- Inactivity nudge: below threshold, at threshold, and the no-prior-visit case
- Arabic/RTL copy safety: every moment kind renders in Arabic with all `{placeholder}` tokens fully substituted (no literal braces reach the UI)

## Verification

- `tsc --noEmit` — clean
- `eslint` — clean (same one pre-existing, unrelated `ModuleRow` warning as prior phases)
- `vitest run` — 226/226 passing (21 new)
- Dev server restarted clean; `/profile?tab=overview` and `/profile?tab=kai` both return 200 with no runtime errors in the log

## Files touched

- `lib/kai/proactive/proactive-types.ts`, `proactive-context.ts`, `proactive-render.ts`, `last-seen.ts` — new
- `lib/kai/proactive/proactive-context.test.ts`, `last-seen.test.ts` — new, 21 tests
- `components/kai/ProactiveMomentCard.tsx` — new
- `components/kai/KaiInsightCard.tsx`, `KaiGreeting.tsx`, `kaiActions.tsx`, `KaiPanel.tsx` — extended
- `components/assessment/ProfileScreen.tsx` — proactive context wired into Overview and Kai tab
- `lib/analytics/events.ts`, `events.test.ts` — 3 new event names (mirrored to Tareeq-admin)
- `lib/i18n/strings.ts` — 5 new keys under `profile.proactive.*`, both locales
