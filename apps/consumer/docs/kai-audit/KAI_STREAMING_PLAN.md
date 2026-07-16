# Kai Streaming Plan (Phase 2D — design)

## Goal
The conversational reply should feel instant — stream text token-by-token
instead of blocking until the whole JSON object is parsed. Heavy artifacts do
NOT stream (they're structured JSON rendered as a card); they load via the
separate `/api/kai/artifact` call with a scoped skeleton.

## Approach
- Use Gemini `:streamGenerateContent` (SSE) for the Conversation Engine's `text` field only.
- Two-part conversational response:
  1. **Stream** the plain `text` (and, once complete, `quickReplies`) as SSE chunks → client appends live.
  2. Structured side-data (intent, memoryUpdates, personSummary, artifactRequest) sent as a final `event: meta` frame after the text completes.
- Keep JSON-mode for the meta frame; stream only the human-visible prose. This sidesteps the "stream partial JSON" parsing problem entirely.

## Why not stream the whole JSON
Streaming a single JSON object means parsing partial/invalid JSON on every
chunk. The repetition loop lives in JSON generation, so streaming raw JSON would
surface garbage mid-stream. Streaming only `text` gives the UX win without the
parse hazard; structure arrives atomically at the end.

## Async side-effects (confirm, don't rebuild)
Phase 1 confirmed memory writes and analytics are already client-side /
fire-and-forget and do **not** block the response. Phase D's only job here is to
verify that remains true once streaming lands (no `await` on memory/analytics in
the response path) and add a test asserting the response resolves before those
settle.

## Fallback / no-JS
If streaming fails or is unsupported, fall back to the current non-streamed
`POST /api/kai/chat` (single JSON response). The client already handles that
shape, so streaming is a progressive enhancement, not a hard dependency.

## Status
Design only. Lowest priority of B–E: it's a UX enhancement, not a
correctness/stability fix. Phases A–C remove the hangs; D makes the reliable
path feel faster.
