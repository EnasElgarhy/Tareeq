# Kai Phase 2 — Conversation Experience (Implementation Summary)

Status: **Implemented, verified, not committed, not deployed.**

This delivers the real Kai conversation: warm, proactive, visual, and grounded in the
deterministic result — not a support-chat clone of ChatGPT.

## What shipped

### 1. Entry points (Kai Landing → real conversation)

Every "Continue with Kai" button and all six suggested-action chips (on the Kai tab and
the redesigned Overview dashboard) now navigate to `/kai-chat` instead of showing an
inert "coming soon" message:

- `KaiInsightCard`'s `onContinue` prop → `/kai-chat`
- `KaiPanel`'s six action chips → `/kai-chat?goal=<action>` (pre-selects the goal)
- `AssessmentChrome` gives `/kai-chat` the same light "day" surface as `/profile`, and
  its back button returns to `/profile?tab=kai` specifically, not the app root.

### 2. The conversation screen — `app/(assessment)/kai-chat/page.tsx`

`components/kai/chat/KaiChatScreen.tsx` orchestrates the whole experience:

- **Never opens empty.** If a goal is pre-selected (from an action chip) or the user
  picks one from `GoalPicker`, the very first thing that happens is a server-generated
  opening message — Kai speaks first, always, exactly like the brief's worked example.
- **No assessment yet** → Kai says so directly ("I'll know much more after your Career
  Compass") with a Start Assessment CTA, no goal picker, no dead-end conversation.
- **A persistent "Why this?" card** (`KaiGroundingCard`, reused from Phase 1) sits above
  every conversation, fed directly from the real deterministic result — not something
  Gemini can generate or influence.
- Messages, quick replies, and rich blocks render in order; a `LoadingMessage` ("Kai is
  thinking...") appears while waiting on the server; the input bar is pinned to the
  bottom of the scrollable well.

### 3. Reusable message components — `components/kai/chat/`

| Component | Role |
|---|---|
| `KaiTextMessage` | A user or Kai text bubble |
| `CareerCard` / `UniversityCard` | One specific recommendation, clickable (tracks `kai_recommendation_clicked`) |
| `ActionPlanCard` | A short numbered plan |
| `ComparisonCard` | Two options side by side |
| `JourneyCard` | Wraps the real `JourneyPath` — Gemini can only caption it, never invent progress |
| `QuickReplies` / `SuggestionChip` | The chips every Kai turn ends with |
| `LoadingMessage` / `TypingIndicator` | The "Kai is thinking..." state — Kai-specific wording, never generic AI copy |
| `DateDivider` / `SystemDivider` | Conversation structure markers |
| `GoalPicker` | The one-time "what do you want to talk about?" prompt that opens every new thread |
| `KaiChatInput` | Minimal, rounded, multiline, Enter-to-send, no attachments/voice |

`KaiInsightCard` (grounding) and `KaiGroundingCard` already existed from Phase 1 and are
reused as-is — no `KaiRecommendationCard` was built separately since `CareerCard`/
`UniversityCard` already are that concept; a third generic wrapper would have been
redundant scaffolding.

### 4. The trust boundary: what Gemini can and can't say

This is the load-bearing design decision of the whole phase. Gemini's structured
response (`lib/kai/chat-prompt.ts` → `KAI_CHAT_RESPONSE_SCHEMA`) can only ever produce:
`text`, `quickReplies`, a `summary`, and `blocks` of type `career_card`,
`university_card`, `action_plan`, `comparison`, or `journey` (caption only).

**Grounding is deliberately not in that schema.** The "Why this?" card is *always* the
real `assessment` object from `lib/kai/context.ts` — Gemini never generates it, never
sees a path to fabricate it, and can't drift from the deterministic result even if
prompted to. Same logic for `journey` blocks: Gemini can write a one-line caption, but
the actual progress rendered is always `JourneyPath` fed by real `snapshot.modules`.
This is how "the deterministic assessment remains truth, Kai only personalizes" is
enforced by construction, not just by asking nicely in the system prompt.

### 5. System prompt & context — `lib/kai/chat-prompt.ts`, `lib/kai/chat-context.ts`

The system prompt is the exact voice designed and reviewed in `KAI_EXPERIENCE.md` §3.2
(trait sheet, banned-phrase table, "guidance not destiny" framing) — carried over
verbatim, not rewritten. `buildKaiChatContext()` extends Phase 1's `buildKaiContext()`
with the conversation's goal, a rolling summary, and the last 8 messages (text only —
no ids, blocks, or quick replies survive into the context), then runs it through the
same `assertNoExcludedFields()` PII guard from Phase 1. Nothing new needed inventing
here — Phase 1's guardrail just had one more caller.

### 6. Server — `POST /api/kai/chat`

`app/api/kai/chat/route.ts` validates the request, builds the prompt, calls Gemini
(`gemini-2.5-flash`, `responseMimeType: "application/json"` + `responseSchema` for
structured output — no SDK dependency added, same raw-`fetch` pattern the existing
Claude results-generation route already uses), and returns a **normalized** message —
never the raw Gemini payload. On a missing key, network failure, or malformed response,
it falls back to a short, Kai-voiced "having trouble thinking" message with a "Try
again" quick reply instead of erroring — same graceful-degradation philosophy as
`/api/results/generate`.

Pure request/response logic (`validateChatRequest`, `normalizeBlocks`, `fallbackMessage`)
lives in `lib/kai/chat-server.ts`, not the route file itself — a Next.js route module
can only export route handlers and a small set of config values, so anything meant to
be unit-tested has to live elsewhere. (Found this the hard way: an early version
exported these directly from `route.ts` and `tsc` correctly rejected it.)

### 7. Storage — `lib/kai/chat-storage.ts`

One active conversation at a time, stored under `tareeq.kai.conversation.v1`. Shape is
deliberately flat and serializable — `{ id, goal, messages, summary, createdAt,
lastOpened }` — so it can move to a Supabase table later without a rewrite. Only
normalized `KaiMessage` entries are ever stored; the raw Gemini response never touches
localStorage.

### 8. Analytics

Added to the shared taxonomy (mirrored in Tareeq-admin, same convention as Phase 1):
`kai_chat_started`, `kai_message_sent`, `kai_message_received`, `kai_quick_reply_clicked`,
`kai_recommendation_clicked`, `kai_conversation_finished`. `kai_grounding_opened`
(Phase 1) is reused as-is from the new location. `kai_conversation_finished` fires on
unmount if at least one exchange happened.

### 9. Empty state

If `kaiContext.assessment` is null, the chat screen shows a `KaiSignal` (curious mood) +
"I'll know much more after your Career Compass." + a Start Assessment CTA — exactly the
brief's copy — instead of a goal picker or dead-end input box.

## Verification performed

- `tsc --noEmit` — clean, 0 errors.
- `eslint` — 0 errors (one pre-existing unrelated warning, not introduced here).
- `vitest run` — **99/99 tests passing** (up from 65 after Phase 1), across:
  - `lib/kai/chat-storage.test.ts` — conversation CRUD, immutability, `recentMessages` windowing
  - `lib/kai/chat-context.test.ts` — context composition, message mapping, PII guard, null-assessment handling
  - `lib/kai/chat-server.test.ts` — request validation (11 cases) and Gemini-response block normalization (9 cases)
  - `lib/analytics/events.test.ts` — taxonomy membership + realistic Phase 2 event payloads against the schema
- Dev server restarted clean; `/profile` and `/kai-chat` both compile and serve 200 with
  zero runtime errors in the server log.
- **Live Gemini call verified end-to-end through the actual running app**: initial
  testing showed `/api/kai/chat` returning "API key not valid" even though the same key
  worked via direct `curl`. Root cause (found via a safe sha256 fingerprint comparison,
  never by printing the key itself): a placeholder `GEMINI_API_KEY` was already exported
  in the shell environment the dev server was launched from, and Next.js never lets
  `.env.local` override a variable that's already set in `process.env` — so the real key
  in `.env.local` was silently shadowed the entire time. Unsetting the shell variable
  before starting the dev server fixed it immediately; `/api/kai/chat` now returns real,
  on-brand, structured Gemini responses (`"source": "gemini"`) with correct quick
  replies and an updated conversation summary.

## Explicit constraints honored

- Not a ChatGPT clone — Kai always speaks first, mixes text with cards, ends every turn
  with quick replies, and the system prompt explicitly bans generic AI-assistant phrasing.
- Gemini never touches the client directly — everything routes through the server.
- Deterministic assessment stays the single source of truth — enforced structurally
  (grounding and journey progress are never LLM-generatable), not just by prompt request.
- No raw Gemini payloads stored — only normalized messages.
- No email, raw answers, or hidden scores sent to Gemini — same PII guard as Phase 1.
- No deploy, no commit.

## Deferred / not built this phase

- Conversation history browsing (multiple past threads) — one active conversation only,
  matching "Kai should continue the conversation naturally" rather than a thread list.
- Voice input, attachments — explicitly out of scope per the brief.
- Streaming responses — Gemini is called once per turn and the full structured reply
  is returned; no token-by-token streaming UI.
- A dedicated career/university detail screen for `CareerCard`/`UniversityCard` taps —
  they currently track `kai_recommendation_clicked` but don't navigate anywhere, since
  no such screens exist yet (same "don't build for a screen that isn't real yet"
  reasoning as the visual-language pass).
