# Kai Chat — Failure Analysis (Phase 1)

No historical server logs exist (dev), so failures were reproduced by driving
the live endpoint per intent with instrumentation.

## Failure rate by intent (measured sample)
| Intent | Result | Failure mode |
|---|---|---|
| explain_result | ✅ pass | — |
| resource_recommendation | ✅ pass | — |
| action_plan (7-day plan) | ❌ fail | `MAX_TOKENS` → repetition loop → unparseable JSON |
| family_conversation | ❌ fail | `MAX_TOKENS` → repetition loop → unparseable JSON |
| study_plan / next_step / career_comparison | ❌ expected fail | route to the same complex-block schemas |

Simple, low-block intents pass reliably; complex-block intents fail reliably.

## Failure taxonomy (observed)
- **`unparseable_response` (primary):** Gemini returns 200 but the body is truncated at `MAX_TOKENS` mid-string (raw tail = a long run of `\n`), so `JSON.parse` throws `Unterminated string`. This is the dominant failure.
- **Repetition-loop degeneration:** `finishReason: MAX_TOKENS` with output = 6,129–6,134 tokens (≈ the 6,144 cap), raw length 18–35 KB of mostly newlines — the model loops instead of completing the JSON.
- **retry exhaustion → fallback:** two blind attempts each hit the above → `source:"fallback"` → apology bubble + "Try again" chip.
- **client timeout:** two ~22 s attempts + enforcement exceed the client's ~60 s patience → the request is abandoned before the (already-failing) server responds.
- Not observed in this run: token-limit on *input*, Gemini content refusal, network errors, rate-limiting (the key tested healthy at 200).

## Root cause (single, clear)
`gemini-2.5-flash` **cannot reliably emit the complex nested structured-output JSON** (action_plan `tasks[]`, `family_script`, `objection_response_list`, comparison/decision-matrix) under `responseMimeType: application/json` + `responseSchema` with `thinkingBudget: 0`. It enters a repetition loop, saturates `maxOutputTokens`, and returns invalid JSON. The blind retries and lack of streaming turn a model-reliability problem into multi-minute waits and "Try again."

## Why raising maxOutputTokens won't fix it
The output isn't legitimately long — it's a degenerate loop. A higher cap would just produce a larger broken blob after a longer wait. The fix is to reduce structured-output complexity for the normal chat path and/or move heavy generation to a model + endpoint suited to it (see the Phase 2 proposal).
