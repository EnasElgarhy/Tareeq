# Kai Chat — Token Audit (Phase 1)

Measured from Gemini `usageMetadata` on real requests (not estimated).

## Input tokens (prompt) — stable across intents
The prompt (system + injected context + schema + message) is **~2,360–2,420 tokens** regardless of intent:

| Request | promptTokenCount |
|---|---|
| explain_result (simple) | 2,361 |
| action_plan (7-day plan) | 2,366 |
| family_conversation | ~2,366 |
| resource_recommendation | ~2,360 |

**Input is NOT the problem.** ~2.4k tokens is modest. Rough composition (by inspection of chat-prompt.ts):
- System prompt (persona + coaching framework + per-intent block map + rules): ~1,000–1,300 tokens — the largest fixed cost, **sent on every request**.
- Injected context (assessment line, report headline + prior recs, journey, memories, conversation summary, up to 8 recent turns): ~300–700 tokens.
- Response schema (intent-narrowed, flattened block-field union): ~400–700 tokens.
- User message: ~10–30 tokens.

## Output tokens — this is where it breaks
| Intent | candidatesTokenCount | finishReason |
|---|---|---|
| explain_result | 552 | STOP ✅ |
| resource_recommendation | 519 | STOP ✅ |
| action_plan | **6,129** | **MAX_TOKENS** ❌ |
| action_plan (retry) | 4,910 | STOP (35 KB raw, still unusable) |
| family_conversation | **6,134** | **MAX_TOKENS** ❌ |

Working intents finish at ~500 output tokens. Failing intents **saturate the 6,144 cap** — not with real content but with a **repetition loop** (raw output is thousands of `\n` characters), producing truncated/invalid JSON.

## Largest contributors / waste
- **Fixed system prompt (~1–1.3k tok) resent every turn** — the single biggest repeated cost. A compressed persona + a `kai_context_summary` (archetype/motivations/strengths/recommended fields) instead of re-describing rules each call would cut input materially.
- **Schema tokens repeated every turn** (even for small talk that needs only `text`+`quickReplies`).
- **Duplicated context**: assessment + report + journey injected every message even when the turn doesn't need them.
- No historical-context bloat problem yet (recent turns capped at 8) — input is fine; **the fix is on the output/complexity side, not trimming input.**
