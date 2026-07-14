# Kai Response Engine v2 — Summary

What shipped, and how it maps onto the original brief. Full architecture plan (with the codebase exploration behind it) lives in the session's plan file; this doc is the durable reference for what actually exists in the repo.

## Starting point

Kai chat was not a green-field build. Before this pass: a real `KaiMessageBlock` discriminated union with 11 types and a working dispatcher (`KaiMessageBlocks.tsx`), a Gemini call already constrained by `responseSchema` (JSON-schema-enforced structured output), and a manual normalize/validate layer (`chat-server.ts`). This pass extends that system rather than replacing it.

## Block schema (`lib/kai/chat-types.ts`)

Kept as-is: `career_card`, `university_card`, `comparison`, `journey`, `memory_card`, `recommendation_history`, `resume_conversation`, `goal_card`, `milestone_card`.

Upgraded:
- `learning_resources` — `KaiLearningResource` gained an optional `searchQuery`, so Gemini can propose a better search phrase than the client's title/author default (`lib/kai/resource-search.ts`).
- `action_plan` — went from `{ title, steps: string[] }` to `{ title, durationLabel?, tasks: KaiActionTask[] }`, where each task has its own `id` (always client-generated, never trusted from the model) and optional `estimatedTime`. This is what makes a plan saveable and trackable (see Plans below).

Removed: `grounding` — it was in the type union but absent from the Gemini schema enum, `normalizeBlocks`, and the dispatcher switch. The real "why this?" grounding UI is the persistent `KaiGroundingCard` header shown above every conversation; a per-message duplicate was never wired up and never needed.

New (9 types, all validated in `chat-server.ts`'s `normalizeBlocks`, all rendered in `KaiMessageBlocks.tsx`):

| Type | Shape | Purpose |
|---|---|---|
| `insight_block` | `{ title, body }` | The "Ground" step — ties the answer to the learner's real profile. |
| `bullet_list` | `{ title?, items }` | Plain structured list, no check-off state. |
| `checklist` | `{ title, items }` | In-chat, session-only check-off list (local state, not persisted). |
| `talking_points` | `{ title, points }` | Key points to make in a real conversation. |
| `family_script` | `{ title, script }` | Literal lines the learner can say. |
| `objection_response_list` | `{ title, items: { objection, response }[] }` | Anticipated pushback paired with a calm response. |
| `reflection_question` | `{ question }` | One question that prompts thinking, not answered inline. |
| `comparison_table` | `{ title, columns, rows: { label, values }[] }` | N-way comparison grid (vs. `comparison`'s fixed 2 options). |
| `decision_matrix` | `{ title, options, rows: { criterion, scores }[], recommendation? }` | Criteria scored per option with a final recommendation. |

## Intent detection (`lib/kai/intent.ts`)

`KaiMessageIntent` — 11 values: `explain_result`, `family_conversation`, `resource_recommendation`, `action_plan`, `career_comparison`, `university_guidance`, `study_plan`, `challenge_result`, `confidence_building`, `next_step`, `general_question`. Distinct from the pre-existing `KaiConversationGoal` (6 values, fixed for the whole conversation) — intent is per-message and can change every turn.

Two-part detection, zero added latency:
1. `detectIntent(message)` — a local keyword/regex heuristic (English + Arabic patterns per intent) run before the Gemini call. Its guess is injected into the prompt as a hint, not a constraint.
2. Gemini self-reports its own `intent` in the same structured response (`KAI_CHAT_RESPONSE_SCHEMA.properties.intent`, now `required`). `normalizeIntent()` validates it and falls back to the heuristic's guess if missing/invalid.

The recorded `intent` (on `KaiMessage.intent`) is always Gemini's self-report, not the heuristic — the heuristic only steers.

## Coaching-framework prompt (`lib/kai/chat-prompt.ts`)

`buildSystemPrompt` now opens with an explicit reframe ("you are not a chatbot... your job is to guide toward a useful next step") and lays out the 6-step structure every substantive answer should follow: **Understand → Ground → Teach → Apply → Resource/Plan → Continue**, mapped onto concrete fields (`text` for Understand, `insight_block` for Ground, `bullet_list`/`action_plan`/`learning_resources` for Apply/Resource-Plan, `quickReplies` for Continue). An explicit intent → preferred-blocks table is embedded as guidance. A dedicated paragraph covers the family-conversation case end to end: empathize, name the likely real worry, frame the conversation, give a literal script, pre-empt 2-3 objections with responses, close with a checklist.

The existing brevity rule for `text` (1-3 sentences) is unchanged — richness lives in blocks, not a longer `text` field. What changed is permission: a substantive question now explicitly calls for 2-4 blocks together, not just one.

## Plans persistence (`lib/kai/plans/`)

`plan-types.ts` + `plan-storage.ts`, mirroring the existing `resource-storage.ts` pattern exactly (localStorage, `tareeq.kai.plans.v1`, runtime type guards, no Supabase yet). `createPlan(block)` snapshots an `action_plan` block into a `KaiPlan` with every task defaulting to `not_started`. `updateTaskStatus`/`deletePlan` round out the CRUD surface.

UI: `ActionPlanCard` gained **Save plan** / **Start plan** buttons (Start also navigates). `/kai/plans` (list, with a progress bar per plan) and `/kai/plans/[id]` (detail, tap a task to cycle `not_started → in_progress → completed`) are new routes. The previously "coming soon — locked" Action Plans tile on the Kai landing screen is now a real link to `/kai/plans`.

## Analytics (`lib/analytics/events.ts`)

New `KAI_COACHING_EVENT_NAMES`: `kai_intent_detected`, `kai_block_rendered` (fired once per block from the dispatcher, not duplicated per card), `kai_plan_saved`, `kai_task_completed`, `kai_family_script_generated`.

## Deviations from the original brief (and why)

1. **Intent detection is single-call, not a two-call pipeline.** A local heuristic biases the prompt; Gemini self-reports the final intent in the same structured response used today. A separate classification call would double latency and cost for no real accuracy gain over letting the model itself judge from full context.
2. **Resource cards extend the existing `learning_resources` block instead of adding 6 new block types** (`resource_group`/`resource_card`/`video_card`/`course_card`/`book_card`/`article_card`). `KaiLearningResource` already had a `type` enum (book/course/youtube_video/article/...), per-type icons, and difficulty badges — that already *is* a resource group of typed resource cards. Building 6 parallel types would have meant two resource systems side by side.
3. **`save_to_plan_cta` is not a block — it's buttons on `ActionPlanCard` itself**, matching how `LearningResourceCard` already owns its own save button rather than needing a sibling block.

Two smaller consolidations, not asked about (low-stakes, reversible): `text_block` and `quick_replies` map onto the existing `message.text`/`message.quickReplies` fields rather than new block types; `action_task` isn't standalone — tasks live inside `action_plan`.

## What's intentionally out of scope

Per-block "repair vs. fallback" only goes as far as: partial repair within a block (e.g. a checklist keeps its valid string items even if some entries are malformed) and the existing top-level `fallbackMessage()` for total failures. There's no separate intent-aware synthetic-block generator for the narrower case of "some blocks survived normalization but not the ones the intent called for" — that would mean duplicating coaching logic in code for a rare edge case.

## Known reliability gap: substantive multi-block turns

Live testing surfaced a real Gemini 2.5 Flash failure mode under this JSON-schema-constrained-output setup: on a genuinely substantive turn (reliably reproduced on both "build me a 7-day plan" and "how do I convince my family"), the model sometimes falls into a repetition loop — repeating a token or phrase (seen as emoji, `\n`, and full coherent sentences) until it hits `MAX_TOKENS`, never closing valid JSON. This is degenerate sampling, not a legitimately long answer.

Mitigations shipped, each independently justified and kept regardless of the underlying model issue:
- **Narrowed per-request schema** (`buildResponseSchema(intentHint)`) — only the block types relevant to the detected intent are sent, instead of all 20 types' fields flattened into one object every time. Reduces schema complexity and prompt size on every request.
- **One automatic retry** on `network_error`/`gemini_error`/`unparseable_response` before falling back — the standard mitigation for occasional degenerate sampling; a fresh attempt reliably avoids the same bad trajectory.
- **Tightened length guidance** — "2-3 blocks" instead of "2-4", explicit item-count caps (3-4 action_plan tasks, 2 objection/response pairs, 3-5 checklist/bullet items, 3-4 talking points), and an explicit "every block stays tight" instruction. This measurably fixed `family_conversation` (was failing outright, now succeeds reliably in testing).
- **Timeout raised from 12s → 25s per attempt** to give real multi-block generation (which can genuinely take 20-30s) room to finish, since the original 12s was tuned for the old single-block system.

What this did **not** fully resolve: `action_plan`/`study_plan`-style requests ("build me a 7-day plan") still show a meaningfully elevated failure rate versus simpler intents like `resource_recommendation` (which is reliable), even after the retry. When both attempts fail, the user sees the existing graceful "having trouble thinking clearly, try again" fallback — never a crash or corrupted state — but a real user asking for a 7-day plan may need to retry more than once.

Also tried and reverted after testing showed no measurable improvement over the defaults: `thinkingConfig.thinkingBudget` at 1024 instead of 0, `temperature` at 0.3 instead of 0.6, and `maxOutputTokens` above 6144. None eliminated the repetition loop on their own.

Two paths for a follow-up session, not attempted here since both are bigger architectural changes than "single call, no added latency" (the approved design for this pass):
1. **Split action_plan into its own smaller, isolated call** — same single-call-per-turn latency budget for every other intent, but route `action_plan`/`study_plan` through a second, much simpler schema (just the plan itself, no `text`/`quickReplies`/`intent` wrapper) less prone to this failure mode.
2. **Swap models for this one path** — e.g. `gemini-2.5-pro` for `action_plan` specifically, trading latency/cost for the more stable structured-output behavior larger models tend to have.
