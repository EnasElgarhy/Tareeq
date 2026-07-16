# Kai Retry Strategy (Phase 2A — IMPLEMENTED)

## Problem (from Phase 1)
On complex intents the model returns `finishReason: MAX_TOKENS` with a
repetition loop → invalid JSON. The old code then **retried the identical
request**, which re-hit the same trajectory (measured), doubling latency to
44–60s and a client timeout → "Try again".

## Implemented (Phase 2A)
`lib/kai/repetition.ts` — pure, unit-tested `detectDegenerateOutput(raw, finishReason)`:
- `finishReason === "MAX_TOKENS"` → degenerate (`max_tokens`)
- long run of one repeated char (≥40) → `repeated_char_run`
- long output (≥1500 chars): unbalanced braces → `unbalanced_json`; then unique-char ratio < 0.02 → `low_unique_ratio`

`app/api/kai/chat/route.ts`:
- `callGeminiOnce` runs the detector **before** `JSON.parse`; degenerate output returns reason `provider_repetition_loop` (logged, not a silent parse error).
- The main retry now fires **only for transient reasons** (network/gemini/unparseable). A `provider_repetition_loop` is **not** retried identically — it fails fast to the graceful fallback.

### Measured result
Complex "7-day plan" request: **60s timeout → 25s fast-fail** with a graceful fallback and a clear `provider_repetition_loop` log. Simple intents unaffected (~3–5s).

## Implemented (Phase 2C) — text-only universal recovery

On ANY `provider_repetition_loop`, the route now issues ONE recovery attempt
with a **text-only** schema (`buildRecoverySchema` — `text` + `intent`, no
`blocks` array) and an instruction to answer inline in prose. If it succeeds,
its answer is used and required-block enforcement is skipped (so it can't
re-trigger the loop). Applies to every intent, not just heavy artifacts —
the loop is stochastic and hits light intents too (measured).

### Why text-only (empirically derived, not the original per-kind-block plan)
The original design was a simplified single-block schema per artifact kind.
Measured, that failed:
- Narrowing the block *union* wasn't enough — `action_plan`'s nested
  `tasks[]` **array of objects** looped on its own.
- Downgrading to a flat `bullet_list` with `blocks` **required** re-triggered the loop; with `blocks` **optional** the model dropped the block and answered in prose anyway.
- Conclusion: gemini-2.5-flash loops on ANY structured array under constrained decoding for these intents. Removing structured output entirely (text-only) is the only reliable recovery. It completes in ~10-20s and carries the real content (a numbered plan / comparison / talking points as prose).

### Measured (dev, live Gemini)
- Heavy "7-day plan": main call succeeds ~2/3 (returns a real `action_plan` card, ~4-5s); on the ~1/3 that loop, recovery returns a full personalized plan as text at ~25-27s. **No `fallback` responses across trials.**
- Light "explain result": previously fell back on a loop; now recovers to a real text answer (~25s).

### Phase 2E benchmark finding (Pro vs Flash, heavy schema)
- `gemini-2.5-pro`: **not accessible with the current API key** (empty/error in ~0.2s) — a model switch is not an option here (and is out of scope per the "don't change providers" constraint anyway).
- `gemini-2.5-flash`: 2/3 STOP+valid (~4-5s, ~3KB), 1/3 MAX_TOKENS loop (~26s, ~28KB). Confirms the recovery is the right fix given Pro is unavailable.

## Still open
- The secondary "stricter" retry inside `enforceRequiredBlocks` still uses the full schema; it only runs when the main call *succeeded* but a required block is missing (low frequency). Could reuse the text-only recovery — tracked, not yet done.
- Phase 2D (token streaming) not implemented — deferred; the contextual loading states (separate task) address the perceived-latency goal without full SSE.
