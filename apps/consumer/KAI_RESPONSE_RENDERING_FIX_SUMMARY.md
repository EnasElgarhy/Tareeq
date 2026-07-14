# Kai Response Rendering Fix — Summary

Follow-up to `KAI_RESPONSE_ENGINE_SUMMARY.md`. That pass built the block vocabulary and a coaching-framework prompt, but left block usage as *guidance* — Gemini could still answer a substantive question in plain prose. This pass makes it a contract: required blocks per intent, checked and enforced server-side, with markdown stripped and denser visual hierarchy on the cards themselves.

## The contract (`lib/kai/required-blocks.ts`)

`INTENT_REQUIRED_BLOCKS` maps a subset of intents to the block types that must appear:

| Intent | Required |
|---|---|
| `explain_result` | `insight_block` |
| `family_conversation` | `talking_points`, `family_script`, `checklist` |
| `resource_recommendation` | `learning_resources` |
| `action_plan` / `study_plan` | `action_plan` |

Everything else (`career_comparison`, `university_guidance`, `challenge_result`, `confidence_building`, `next_step`, `general_question`) has no hard requirement — the brief's own "unless it is genuinely simple" carve-out.

**Block-name reconciliation.** The brief names several roles per intent (`KaiIntroBlock`, `ProfileGroundingBlock`, `EmpathyBlock`, `FamilyConcernsBlock`, `ExampleCareersBlock`, `NextStepBlock`, `SavePlanCTA`, `ResourceGroup`/`ResourceCards`/`WhyTheseFitBlock`/`AddToPlanCTA`, `DayTaskCards`) that map onto blocks already built in the prior pass, not new ones:
- `KaiIntroBlock` → the existing `text` field.
- `ProfileGroundingBlock` / `EmpathyBlock` / `FamilyConcernsBlock` / `PersonalInsightBlock` → all `insight_block` (one card carries "ground the answer in their profile," "show empathy," and "name what they're worried about" — these aren't functionally distinct enough to be three separate required blocks).
- `ExampleCareersBlock` → the existing `career_card` (already always-allowed).
- `NextStepBlock` → `quickReplies` (already required every turn) or a light `bullet_list`.
- `SavePlanCTA` / `AddToPlanCTA` → buttons already built into `ActionPlanCard`/`LearningResourceCard`, not separate blocks.
- `ResourceGroup`/`ResourceCards`/`WhyTheseFitBlock` → the existing `learning_resources` block (per-resource `reason` field already covers "why this fits").
- `DayTaskCards` → each task inside `action_plan.tasks`, now visually distinct cards (see below), not a separate top-level block type.

**Why the required lists are lean, not the full 5-6 per intent the brief lists:** every additional required block raises the odds of the Gemini repetition-loop failure documented in `KAI_RESPONSE_ENGINE_SUMMARY.md` — enforcement that forces the full block set every turn would directly fight the reliability work already done there. The lists above are the minimum that eliminates "answered a plan/resource/family question in pure prose," not the maximum richness Gemini can still choose to include (the wider `INTENT_BLOCK_TYPES` allow-list in `chat-prompt.ts` is unchanged).

## Enforcement pipeline (`lib/kai/chat-enforcement.ts`, wired in `route.ts`)

For any turn whose intent has a requirement:

1. **Repair** (`repairRequiredBlocks`, zero extra Gemini calls) — strips markdown, then looks for safely-extractable structure already in the prose:
   - `extractDayPlanFromText` — "Day 1: ...", "Day 2: ..." lines → an `action_plan` block with real tasks.
   - `extractBulletsFromText` — a contiguous run of `-`/`*`/numbered lines → a `checklist` or `bullet_list` block.
   - Deliberately does **not** attempt to synthesize `learning_resources` (title/author/difficulty/time aren't recoverable from prose without inventing plausible-but-fake metadata) or `talking_points`/`family_script` (no reliable textual marker separates them from general empathetic prose).
2. **Retry** — only for whatever repair couldn't extract. One more Gemini call, same schema, with an added instruction naming exactly the missing block type(s) ("your previous reply was missing a required X block... do not explain the plan in text"). Repair runs again on the retry's output.
3. **Fallback** (`buildFallbackBlocks`) — deterministic, non-LLM content for whatever's still missing after the retry. Built from real context where it exists (`explain_result`'s `insight_block` uses the actual cluster/confidence from `context.assessment` — never invented) and generic-but-honest elsewhere (a 3-task starter plan, generic talking points/checklist, search guidance instead of fake resource cards).

`action_plan`/`study_plan`/`resource_recommendation`/`family_conversation` now cannot reach the client without their required block present — worst case it's the deterministic fallback, never bare prose.

## Markdown

`lib/kai/repair.ts`'s `stripMarkdown()` removes `**bold**`, `__bold__`, `*italic*`, `` `code` ``, and `#` headers while keeping the words. Applied twice: server-side inside the repair pass (every text field Gemini returns), and client-side in `KaiTextMessage.tsx` as a second defensive pass for anything that slips through.

## UI

- `ActionPlanCard`: each task is now its own inset card (background, padding, rounded corners) instead of a plain numbered list row — the "day/task should be a separate card" ask, without a new block type.
- Save/Start plan buttons, resource card fields (type/title/provider/reason/difficulty/time), talking-points numbering, family-script quote styling, and checklist checkboxes were already built in the prior pass — confirmed still correct, not rebuilt.

## Tests

- `lib/kai/repair.test.ts` (14 tests) — markdown stripping, bullet extraction, day-plan extraction, including negative cases (single bullet, non-contiguous bullets, no day markers).
- `lib/kai/required-blocks.test.ts` (6 tests) — contract satisfied/unsatisfied per intent, multi-block requirements, intents with no requirement.
- `lib/kai/chat-enforcement.test.ts` (16 tests) — repair alone satisfying the contract (day-plan and bullet cases), repair correctly declining to touch resource/family-script content, fallback block shape and content (including the Arabic-locale path), and the full `enforceRequiredBlocks` orchestration: skips the retry when unneeded, calls it with the right missing-types list, uses its blocks on success, and falls back for whatever even the retry didn't supply.
- Arabic/RTL: no new automated visual test (this app verifies RTL via Playwright screenshots, not Vitest, per the established pattern) — `buildFallbackBlocks`/`repairRequiredBlocks`'s locale branches are unit-tested for correct Arabic strings; full visual RTL re-verification should be done live.

## What this does not attempt

- No structural JSON-schema change for the "stricter retry" — the brief's phrase "call Gemini once more with a stricter schema" is implemented as the *same* per-intent schema (already narrowed to that intent's block types from the prior pass) with a more insistent instruction, not a differently-shaped schema. Gemini's flat block schema can't express "these fields become required only when type=X," so a structurally stricter schema isn't achievable without re-introducing the discriminated-union complexity the prior pass deliberately avoided.
- No attempt to repair or retry `resource_recommendation` content into fabricated specifics — repair skips it, and the fallback is explicitly generic search guidance, not resource cards with invented metadata.
