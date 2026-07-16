# Kai Phase 2 — Target Architecture

## Root cause (Phase 1, measured)
One Gemini call + one shared 20-block schema serves **every** turn. Simple chat
and heavy structured artifacts (action_plan, family_script, comparison/matrix)
go down the same fragile path. The heavy, nested-array intents reliably trip a
repetition loop → `MAX_TOKENS` → truncated JSON → (old code) identical retry →
44–60s → client timeout. See `KAI_SCHEMA_ANALYSIS.md`, `KAI_FAILURE_ANALYSIS.md`.

## Target: two engines, one façade

```
POST /api/kai/chat                         (Conversation Engine — fast, reliable)
  → text + quickReplies (+ light inline blocks: insight, bullet_list, reflection)
  → decides if the turn NEEDS a heavy artifact; if so returns an
    artifactRequest descriptor (kind, params) instead of trying to emit it inline

POST /api/kai/artifact                      (Artifact Engine — heavy, isolated)
  → one dedicated schema PER artifact kind (not a 20-way union)
  → own generationConfig, own repetition guard, own simplified-schema retry
  → returns exactly one typed artifact block
```

The client renders the conversational reply immediately, then requests the
artifact separately (spinner scoped to the artifact card, not the whole reply).
A slow/failed artifact never blocks or hangs the conversation.

## Why this fixes it
- The everyday path carries no nested-array schema → it stays a single fast, reliable call.
- Each heavy artifact gets a **small, dedicated** schema → far less structural complexity per call → the loop trigger largely disappears (to be confirmed in Phase E benchmark).
- Failure is isolated and legible: "couldn't build the plan right now" on one card, conversation intact.

## Phase plan (incremental; tsc + lint + tests after each)
- **A — DONE & VERIFIED.** finishReason/repetition detection + stop the futile identical retry. 60s→25s fast-fail. `KAI_RETRY_STRATEGY.md`.
- **B — Conversation state machine.** Extract the conversation reply (text/quickReplies/light blocks/intent/memory) into an explicit `ConversationEngine` module + state type. Add `needsArtifact(intent, message)` → `ArtifactRequest | null`. Keep current `/api/kai/chat` response shape backward-compatible (artifact still inline for now) so nothing breaks mid-refactor.
- **C — Artifact engine.** New `/api/kai/artifact` + `lib/kai/artifact/` with one schema per kind (`ARTIFACT_SCHEMAS`). Move action_plan/family_script/comparison/decision_matrix generation here. Simplified-schema retry (7d→3d, script→bullets, table→short) on repetition. Wire client to request artifacts separately. `KAI_ARTIFACT_ENGINE.md`.
- **D — Streaming + async side-effects.** SSE stream the conversational text token-by-token; memory writes + analytics already fire-and-forget (confirm non-blocking). `KAI_STREAMING_PLAN.md`.
- **E — Model routing benchmark.** Flash vs Pro on the heavy artifact kinds (success rate, p50/p95 latency, token cost) → decide per-kind model. Data-driven, no default provider switch (constraint: stay on Gemini).

## Constraints honored
No deploy, no commit, no provider switch, no production-data writes. Any DB
migration is built-up-to and gated (Kai memory/plans are still localStorage-only;
no schema change is required for A–E).
