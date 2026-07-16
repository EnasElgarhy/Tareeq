# Kai Chat — Architecture Audit (Phase 1)

Evidence-based. Measured against the running app on 2026‑07‑15 with temporary
instrumentation (since reverted). No code was changed.

## Request lifecycle (sequence)

```
User types → handleSend (KaiChatScreen.tsx:242)
  → optimistic user bubble → setIsTyping(true) → "Kai is thinking" (LoadingMessage)
  → readMemory() [localStorage] → buildKaiChatContext (chat-context.ts:31)
  → POST /api/kai/chat  [SINGLE fetch, awaits full JSON — NO streaming]
      route.ts:133  validateChatRequest
        → detectIntent(message) → intentHint            (regex, local, instant)
        → buildContextPrompt + system prompt → prompt
        → callGeminiOnce #1   [Gemini generateContent, 25s abort]
        → if !ok → callGeminiOnce #2   [blind retry]
        → if !ok → return fallbackMessage (source:"fallback", "Try again")
        → normalizeIntent → enforceRequiredBlocks
             → if required block missing → callGeminiOnce #3 (stricter)
             → else deterministic fallback blocks
        → assemble KaiMessage + summary + memoryUpdates
  ← JSON
  → render (setConversation)             ← user sees nothing until here
  → trackEvent(...)  [fire-and-forget]
  → applyMemoryUpdates → localStorage    [after render, non-blocking]
```

## Model configuration (route.ts / chat-prompt.ts)
| Setting | Value |
|---|---|
| Model | `gemini-2.5-flash` (env `GEMINI_MODEL` overridable) |
| Temperature | 0.6 |
| thinkingConfig.thinkingBudget | **0** (thinking disabled) |
| maxOutputTokens | **6144** |
| responseMimeType | `application/json` |
| responseSchema | intent-narrowed (see schema doc) |
| Timeout | `AbortSignal.timeout(25_000)` per call |
| Retries | up to **2 blind** + **1 enforcement** = max **3 serial Gemini calls** |
| Streaming | **None** (`:generateContent`, full-body await) |

## Blocking vs non-blocking
- **Blocking the response:** validation, prompt build, and **every Gemini call** are serial. The client `fetch` blocks render until the entire JSON arrives — no partial/streamed UI.
- **Non-blocking:** analytics (`trackEvent` fire-and-forget) and memory writes (client-side localStorage, applied after render). **Memory is NOT a latency or failure factor.**

## One call vs many
- Happy path = **1** Gemini call.
- Failure path = up to **3** serial calls, each with its own 25 s timeout → worst case ~75 s of model latency before fallback. In practice the client aborts at ~60 s → "Try again."

## Action plans & recommendations
Generated **in the same single Gemini call** as `action_plan` / `learning_resources` blocks inside the one response schema. **No dedicated endpoint.** (`ActionPlanCard` "save" is a client-side localStorage write, not a generation.)

## Key structural finding
It is a **single, synchronous, non-streamed, structured-JSON call** whose reliability and latency scale inversely with output complexity. Because plans/roadmaps/family-scripts are emitted through the same call+schema as small talk, the heaviest outputs run through the most fragile path — and that is exactly where failures cluster (see KAI_FAILURE_ANALYSIS.md).
