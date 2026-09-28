# Kai Chat — Latency Breakdown (Phase 1)

Measured end-to-end (curl `time_total`) + per-call Gemini timing (instrumented).

## Per-stage (real)
Server-side non-Gemini stages are negligible — the Gemini call is ~99% of latency:

| Stage | Time |
|---|---|
| validate + detectIntent + prompt build | < 10 ms |
| **Gemini generateContent call** | **2.9 s – 24 s** (dominant) |
| JSON parse + enforce blocks | < 5 ms (unless a retry fires) |
| memory write / analytics | 0 ms on the response path (deferred, client-side) |

## Per-intent Gemini latency (measured)
| Intent | Gemini call | Outcome |
|---|---|---|
| resource_recommendation | 2.9 s | ✅ |
| explain_result | ~4.2 s | ✅ |
| action_plan | 22.5 s (×2 attempts) | ❌ |
| family_conversation | 23.6 s (×2 attempts) | ❌ |

## End-to-end (client)
| Request | total |
|---|---|
| recommendation | 2.9 s |
| simple (explain) | 7.8 s |
| family | 47.5 s |
| 7-day plan | 60 s → **client timeout** |

## P50 / P95 (this sample)
- **P50 ≈ 4–8 s**, **P95 ≈ 47–60 s.** The distribution is bimodal: fast (~3–8 s) when output stays small, or 20–60 s when the model enters the repetition loop and each attempt runs to `MAX_TOKENS` (~22 s) before failing and retrying.
- **Slowest intent:** `action_plan` / `family_conversation` (and by extension roadmaps/study plans, which route to the same complex-block intents).

## Why it's slow
1. `thinkingBudget: 0` + complex responseSchema → the model spends its full 6,144-token budget looping instead of finishing → each call runs the full ~22 s to `MAX_TOKENS`.
2. Two blind retries in series compound it (22 s → 44 s → …).
3. No streaming → the user sees "Kai is thinking" for the entire duration with no partial output, so even a successful 8 s reply feels slow.
