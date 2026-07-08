# Kai Phase 3 — Memory & Personalization (Implementation Summary)

Status: **Implemented, verified, not committed, not deployed.**

Kai now remembers the *person*, not just the conversation — structured, transparent,
user-controlled, and never a substitute for replaying the full transcript to Gemini.

## Architecture

### `lib/kai/memory/` — the memory layer

| File | Role |
|---|---|
| `memory-types.ts` | `KaiMemoryItem`, `KaiMemoryProfile`, `KaiMemoryUpdateCandidate`, the `KaiMemoryProvider` adapter interface |
| `memory-storage.ts` | `LocalMemoryProvider` — the only concrete adapter today |
| `memory.ts` | The façade — `readMemory`, `applyMemoryUpdates`, `forgetMemoryItem`, `clearAllMemory`, `setMemoryProvider` |
| `memory-updater.ts` | Merge/dedup logic — the actual "don't duplicate, merge intelligently" rule |
| `memory-summary.ts` | Caps the person-level summary at 2-3 paragraphs |
| `memory-builder.ts` | Validates Gemini's proposed memory updates before they ever reach the updater |
| `memory-view.ts` | Shared category labels + grouping, used by both the in-chat and profile memory UI |

**The adapter pattern is real, not decorative** — `memory.test.ts` proves it by
substituting a fake in-memory `KaiMemoryProvider` for `LocalMemoryProvider` and
confirming every façade call routes through it instead of touching `localStorage` at
all. `KaiMemoryProvider ↓ LocalMemoryProvider ↓ (future) SupabaseMemoryProvider` — every
method on the interface is already `Promise`-based, so a Supabase-backed provider slots
in later as a one-line change to `memory.ts`'s `provider` variable. No UI component ever
imports `LocalMemoryProvider` or touches `localStorage` directly.

### What's stored — structured only

```ts
interface KaiMemoryItem {
  id: string;
  category: "career_interest" | "learning_style" | "goal" | "question_topic"
          | "conversation_preference" | "assessment_history" | "recommendation";
  value: string;       // a short label, e.g. "Study abroad" — never a sentence
  createdAt: string;
  updatedAt: string;
}
```

Plus one `personSummary` string (capped at 3 paragraphs) — a rolling narrative about the
person, distinct from `KaiConversation.summary` (Phase 2), which only ever covers a
single thread.

### What's never stored

No raw conversation history, no raw Gemini payloads, no assessment answers, no hidden
scoring, no internal prompts, no email. Beyond the type-level guarantee (the schema has
nowhere to put these), `memory-builder.ts` adds a **content-level** check: even though a
memory item's shape is clean (`category` + `value`), nothing stops a model from writing
an email or phone number into `value` itself — so any candidate matching an email
pattern or a long digit run is rejected outright, and values are capped at 80
characters. This is the same "don't just trust the shape, trust nothing" discipline as
Phase 2's `normalizeBlocks`.

## The memory builder loop

After every Gemini turn, the server returns (validated, normalized) `memoryUpdates` and
an optional `personSummary` alongside the normal message. The **client** (not the
server — memory lives in `localStorage`, which the server can't touch) calls
`applyMemoryUpdates()`, which:

1. Reads the current profile.
2. Runs `mergeMemoryCandidates()` — case-insensitive dedup *within the same category*
   (an existing "Artificial Intelligence" absorbs a later "artificial intelligence"
   instead of creating a second row; a match just refreshes `updatedAt`).
3. Caps and writes the updated `personSummary` if one was proposed.
4. Reports back which items were genuinely `created` vs. `updated`, so the client can
   fire accurate `kai_memory_created` / `kai_memory_updated` analytics — not a blind
   "something happened" event.

Gemini is *told* not to propose something already in the memory list it was given (see
the system prompt below), and the merge logic backstops that instruction structurally
rather than trusting it alone.

## Memory context — what Gemini actually receives

`buildKaiChatContext()` (Phase 2, extended) now also carries `memories: { items,
personSummary }` — category + value only, ids and timestamps stripped before the
request ever leaves the client. Every Gemini request gets exactly the brief's list:
current assessment, current report, journey, this conversation's summary, structured
memories, the last few messages, locale, and display name. **Never** the full chat
history — `chat-storage.ts`'s `recentMessages()` already capped that at 8 messages in
Phase 2, and Phase 3 doesn't touch that cap.

## System prompt & the trust boundary (extended, not loosened)

The system prompt (`lib/kai/chat-prompt.ts`) gained one new section: how to use memory
("weave it in naturally... never recite it like a database readout") and how to propose
new memory ("only genuinely useful, durable facts... don't propose something already in
the memory list"). Everything from Phase 2's trust boundary carries forward unchanged
and extends the same way:

- **Grounding** — still never LLM-authored, still always the real deterministic result.
- **Journey / milestone data** — Gemini can caption a `journey` or `milestone_card`
  block, but the progress *shown* is always `JourneyPath` / `deriveNextMilestone` fed by
  real client data.
- **Memory itself follows the same rule in reverse**: Gemini may *propose* new memories
  via `memoryUpdates`, but never writes to storage directly. Every proposal passes
  through `memory-builder.ts`'s validation and `memory-updater.ts`'s merge before
  touching `localStorage`. A `memory_card` or `recommendation_history` block in the chat
  is the same story as grounding: Gemini signals the moment, the actual items rendered
  are always the real stored memory (`MemoryCard`, `RecommendationHistoryCard`), never
  LLM-authored content.
- **Assessment results and scoring are untouched by any of this** — nothing in Phase 3
  gives Gemini a new way to influence a cluster, archetype, driver, or confidence
  score. Memory is additive context, not a second source of truth.

## Smart resume — real continuity, not a canned line

`buildOpeningInstruction(hasMemory)` branches the "open a new conversation" prompt: with
no memory, Kai's opener behaves exactly as in Phase 2. With memory, Kai is told to
reference something *specific and real* from it and is nudged toward a
`resume_conversation` block — rendered as `ResumeConversationCard`, with a "Continue
where we left off" action that sends a follow-up turn and fires `kai_resume_clicked`.
The referenced topic is never invented — it comes from what's actually in
`context.memories`.

## New message types (UI)

| Component | Data source |
|---|---|
| `MemoryCard` | Real stored memory, grouped by category (top 3 groups) |
| `RecommendationHistoryCard` | Real `recommendation`-category memory items |
| `ResumeConversationCard` | Gemini-authored line, referencing real memory |
| `GoalCard` | Gemini-authored (freshly extracted from what the user just said) |
| `MilestoneCard` | Real `deriveNextMilestone()` data — Gemini only captions it |

## "What Kai knows about you" — `MemoryTransparencyCard`

Added as a new section inside the Kai tab (`KaiPanel`), below the grounding card. Reads
memory on mount, groups it by category, and gives the user real control:

- **Forget this** — an inline "×" on every single memory chip. Fires `kai_memory_deleted`
  with `scope: "single"`.
- **Clear all Kai memories** — a two-step confirm (not a single misclick-away action,
  since this is irreversible) that empties the profile entirely. Fires
  `kai_memory_deleted` with `scope: "all"`.
- **Empty state** — if nothing's been learned yet, says so plainly rather than showing
  a blank card.

"Edit preference" from the brief is implemented as forget-and-let-it-be-relearned rather
than a separate inline-edit form — the same control (removing something Kai
shouldn't have kept) without a second UI surface for a case that's really the same
action. If you want literal in-place editing later, `forgetMemoryItem` +
`applyMemoryUpdates` already compose to support it.

## Analytics

Added to the shared taxonomy (mirrored in Tareeq-admin): `kai_memory_created`,
`kai_memory_updated`, `kai_memory_deleted`, `kai_resume_clicked`, `kai_goal_saved`. All
payloads are counts/scopes/booleans — no memory *content* is ever sent to analytics.

## Verification performed

- `tsc --noEmit` — clean, 0 errors.
- `eslint` — 0 errors (same one pre-existing unrelated warning from earlier phases).
- `vitest run` — **150/150 tests passing** (up from 99 after Phase 2), including:
  - `memory-updater.test.ts` — merge, case-insensitive dedup, cross-category
    distinction, blank-value skipping, `created`/`updated` reporting, summary capping
  - `memory-storage.test.ts` — adapter round-trip + **migration safety** (corrupted
    JSON, missing fields, malformed items, an unrelated future schema shape, a JSON
    array instead of an object — all resolve to an empty profile, never a crash)
  - `memory-builder.test.ts` — category/value validation, email/phone rejection, length
    cap, per-turn candidate cap, mixed valid/invalid arrays
  - `memory.test.ts` — façade behavior against the real `LocalMemoryProvider`, **plus**
    a dedicated test proving the adapter seam works by swapping in a fake provider
  - `memory-summary.test.ts` — paragraph capping
  - `chat-context.test.ts` (extended) — memory correctly attached, ids/timestamps
    stripped, PII guard still passes
  - `chat-server.test.ts` (extended) — context validation now requires `memories`,
    normalization tests for all 5 new block types
  - `events.test.ts` (extended) — new event names in the taxonomy, realistic payload
    shapes, explicit no-PII assertion
- Dev server restarted clean; `/profile` and `/kai-chat` both compile and serve 200 with
  zero runtime errors.
- **Live end-to-end memory round trip confirmed working**, after fixing the credential
  issue described in the corrected `KAI_PHASE_2_SUMMARY.md` (a placeholder
  `GEMINI_API_KEY` already exported in the shell was shadowing the real key in
  `.env.local` — not a rotating-token issue as first suspected). With the real key
  actually reaching Gemini, telling Kai "I really want to study abroad, maybe in
  Switzerland, and I am super interested in AI as a career" produced:
  ```json
  "memoryUpdates": [
    { "category": "goal", "value": "Study abroad (Switzerland)" },
    { "category": "career_interest", "value": "AI" }
  ],
  "personSummary": "Ahmed has a strong Technology cluster (78% confidence) and is an
    Explorer archetype, driven by Mastery. ... He is now expressing a strong interest in
    studying abroad, possibly in Switzerland, and pursuing a career in AI."
  ```
  Gemini doesn't propose memory on every single turn (reasonable — not every reply
  contains a new durable fact), but when the user states a real interest or goal, it's
  captured correctly, in the right category, in the short-label style the prompt asks
  for. The client-side merge/apply pipeline is fully unit-tested independently of this.

## Explicit constraints honored

- No RAG, no vector database, no embedding pipeline — memory extraction rides the same
  single per-turn Gemini call Phase 2 already makes (via `memoryUpdates` in the existing
  structured response), not a second call or a separate retrieval system.
- Conversation UI untouched beyond wiring new block types into the existing
  `KaiMessageBlocks` dispatcher — no redesign.
- No voice added.
- Deterministic assessment remains the single source of truth — Gemini can read memory,
  never write to scoring, and the code enforces this the same structural way Phase 2 did
  for grounding.
- No commit, no deploy.

## Deferred / not built this phase

- `SupabaseMemoryProvider` itself — the adapter interface and seam are built and tested,
  but no Supabase schema or implementation was created (not asked for; "future" in the
  brief's own diagram).
- A literal in-place "edit preference" form — see the transparency card note above.
- Multi-conversation history browsing — memory now carries continuity across sessions,
  but the underlying single-active-conversation storage model from Phase 2 is
  unchanged.
