# Consumer 2.0 — Technical Architecture

**Scope:** the technical design for turning the Profile into the product's home and Kai into a persistent AI career coach. This document covers systems, data, and code structure. For personality, conversation design, and wireframes, see `KAI_EXPERIENCE.md` — the two are meant to be read together.

**Status:** architecture proposal only. Nothing in this document has been implemented. See the phased plan at the end for the proposed build order, pending approval.

---

## 0. Audit — what exists today (verified against source, 2026-07-02)

This section is deliberately terse; the full line-by-line audit already exists in `ARCHITECTURE_REVIEW.md` (2026-06-14) and `docs/PROJECT_COMPLETION_PLAN.md` (2026-06-26). What follows is what changes about *this* effort's starting conditions, re-verified against the current code rather than trusted from memory.

### 0.1 The five things that shape every decision below

1. **No app-shell navigation exists.** `AssessmentChrome.tsx` renders a back button + a small progress/logo header on every screen; there is no bottom tab bar, no persistent "home." Introducing tabbed Profile navigation is a **new UI primitive**, not an extension of one.
2. **State is local, per-screen, and untyped-as-a-whole.** No global store (no Context/Redux/Zustand). Cross-screen data flows through ad hoc `localStorage` keys (`tareeq.assessment.v4`, `tareeq.result.report.v1`, `tareeq.result.registration.v1`, `tareeq.platform.consent.v1`, `tareeq.locale`, `tareeq:interstitials-seen`, `tareeq:sound`), each with its own typed read/write helper module (`lib/assessment/progress.ts`, `lib/results/storage.ts`). There is no single "app state" object.
3. **Real auth landed recently and is real, but persistence is partial.** Supabase email-OTP auth (`lib/auth/otp.ts`, `components/auth/OtpSignIn.tsx`) plus `POST /api/assessments/persist` (server-authenticated, writes to `assessments`) shipped 2026-06-26. `ProfileScreen.tsx` is now session-gated. But the **profile's own data still reads from `localStorage`** (`readProfileSnapshot()` in `lib/profile/journey.ts` calls `readGeneratedReport()`/`readResultRegistration()`, both local-only) — the DB write path and the profile's read path are not yet the same path. This is the seam Kai's context builder must not fall into (see §4).
4. **The results AI is Claude, not Gemini** (`app/api/results/generate/route.ts`: raw `fetch` to `api.anthropic.com`, `claude-sonnet-4-20250514`). A materially more robust **Gemini** provider abstraction already exists, but on the admin repo (`Tareeq-admin`, `lib/*/ai-extract.ts` and, historically, `lib/results/providers.ts` in an earlier admin-cms branch): schema-enforced JSON via `responseSchema` + `responseMimeType: application/json`, retries on 429/500/503, `thinkingConfig: {thinkingBudget: 0}` to avoid truncation. **Kai should use Gemini**, per this task's explicit brief — this means porting that provider *pattern* (not the results feature) into a new, Kai-specific module. This intentionally creates two AI providers in one app (Claude for the results narrative, Gemini for Kai) — named as a tradeoff in §11, not hidden.
5. **The multi-assessment idea already exists as a stub, twice, in two different shapes.** `lib/profile/journey.ts`'s `ASSESSMENT_MODULES` (CORE Compass live; Deep Dive Interview / Skills Audit / Career Pulse locked) is the consumer app's own placeholder roadmap. Separately, the **admin** repo has a real, tested, generic scoring engine for non-CORE assessments (`assessments_catalog`, `lib/scoring/dispatch.ts`, spec-executor) that the consumer app **never calls** (`PROJECT_COMPLETION_PLAN.md` Gap A3). Kai's multi-assessment design in §8 builds on the admin's system, not a new one — inventing a third shape here would make the eventual convergence harder, not easier.

### 0.2 What's reusable as-is (do not rebuild)

- **`computeScore()` / `CompassResult`** (`lib/scoring/`) — the deterministic engine. Untouched by this work. Kai reads its output; nothing in this design calls it differently or duplicates it.
- **`PersonalizedCompassReport`** (`lib/results/types.ts`) — the existing narrative report shape. This is the "Career Compass" the user already has; Kai references it, doesn't replace it.
- **The analytics library** (`lib/analytics/*`, shipped this quarter) — `trackEvent()`, the queue/flush pipeline, `AnalyticsProvider` interface. Kai's own events are new event *names* on the same pipeline (§9), not a new pipeline.
- **The provider-swap pattern itself.** `AnalyticsProvider` (analytics transport) and the admin's Gemini/Claude provider abstraction both already establish "one interface, swappable implementation" as a house pattern in this codebase. The conversation store (§5) and the AI client (§6) both follow that same pattern deliberately, for consistency, not novelty.
- **The design system** ("Orbit" tokens in `globals.css`: night/violet/sand/gold palette, `--grad-warm` CTA gradient, `glass-tile` blur surfaces, `btn-v2` button variants, italic display-serif for emphasis words). Kai's UI is skinned from this, not a new visual language.
- **Kai the character** — `KaiChromaVideo` (WebGL chroma-key), `useKaiNarration` (ElevenLabs TTS + lip-sync), the mood/scene system already used in `IntroScreen`/`QuestionScreen`. The chat experience reuses this exact character rendering, not a new avatar.

### 0.3 What's explicitly out of scope for this effort

- Migrating the results narrative from Claude to Gemini (separate decision; not blocking Kai).
- Closing Gap A2/A3 (consumer reading the DB-authored content version, custom-assessment runner) — Kai's multi-assessment design is written to slot in *when* that lands, but building it is not part of this work.
- Real-time token streaming (explicitly "future" per the brief — see §10).
- The admin-side Gemini Assessment Optimizer (referenced in `Tareeq-admin/QUESTION_ANALYTICS_ARCHITECTURE.md`'s Future section) — a different system, for a different audience (admins improving questions), not this one (Kai coaching students).

---

## 1. Profile Information Architecture

```
/profile                    Overview (default tab) — the new home
/profile/compass            Career Compass — today's ResultsScreen content, re-homed
/profile/journey            Journey — assessment modules, timeline, unlocks
/profile/kai                Kai — the conversational coach (see KAI_EXPERIENCE.md)
/profile/settings           Settings — account, consent, locale, sign out
```

**Navigation shell: a bottom tab bar, scoped to `/profile/*` only.** Not global — the assessment-taking flow (`/intro` → `/q/[index]` → `/register` → `/analyzing`) keeps its existing full-bleed `AssessmentChrome` untouched. Introducing a persistent app-shell only where the user actually lives (their profile) avoids destabilizing a flow that's tuned, tested, and working, and matches the brief's own framing: the *profile* becomes home, not the whole app.

**Why bottom tabs over a top segmented control:** five destinations, one of which (Kai) needs to be reachable in one tap from anywhere in the profile, at all times — that's a tab bar's job. A top segmented control reads as "modes of one view" (compare: filter tabs on a list); a bottom bar reads as "five places," which is the correct mental model here. This is the single largest new UI surface in this redesign and the one most likely to need a design pass once real content is in it — flagged as a risk in §11, not a settled certainty.

**Landing behavior:**
- `/profile` bare → Overview.
- The results screen's post-completion CTA changes from "View your profile" (→ `/profile`) to **"Talk to Kai"** (→ `/profile/kai`), per the brief: *"Kai should become the primary destination after viewing results."* Overview remains the default for organic return visits (typing the URL, opening a bookmark) — the first-time post-results moment and the "I'm just checking in" moment are different intents and get different destinations.
- Deep links from Kai's own suggestions (e.g. "see your full Compass") route to `/profile/compass`, not a re-render of the report inline — one canonical place for the long-form report, Kai always links out to it rather than duplicating it.

### 1.1 Route → component map

| Route | New/existing | Renders |
|---|---|---|
| `app/(profile)/layout.tsx` | **new** | `ProfileShell` (bottom tab bar + safe-area chrome), auth gate (reuses the existing sign-in-required pattern from `ProfileScreen.tsx`) |
| `app/(profile)/profile/page.tsx` | new (thin) | `ProfileOverviewScreen` |
| `app/(profile)/profile/compass/page.tsx` | new (thin) | `CareerCompassScreen` — **adapts** `ResultsScreen.tsx`'s content, not a rewrite |
| `app/(profile)/profile/journey/page.tsx` | new (thin) | `JourneyScreen` — supersedes the module-list section of today's `ProfileScreen.tsx` |
| `app/(profile)/profile/kai/page.tsx` | new (thin) | `KaiScreen` (see §3) |
| `app/(profile)/profile/settings/page.tsx` | new (thin) | `SettingsScreen` — account info, sign out, consent toggles, locale (currently scattered across `ProfileScreen.tsx` and buried settings) |

`app/(assessment)/profile/page.tsx` (the current route) becomes a **redirect** to `/profile` (new route group) rather than being deleted outright in the same PR — keeps old bookmarks/links alive during the transition (see the phased plan's migration note).

---

## 2. Component Hierarchy

```
app/(profile)/layout.tsx
└── ProfileShell                         [new] auth gate + bottom tab bar + safe-area frame
    ├── ProfileTabBar                    [new] 5 tabs, active-state from usePathname()
    │
    ├── /profile → ProfileOverviewScreen [new]
    │   ├── ProfileHeader                [extract from current ProfileScreen header block]
    │   ├── CompassSnapshotCard          [extract: today's "CareerProfileSnapshot"]
    │   ├── KaiPromptCard                [new] "Kai has 3 things to say" teaser → /profile/kai
    │   └── JourneyPreviewStrip          [new] condensed 2-item preview → /profile/journey
    │
    ├── /profile/compass → CareerCompassScreen [adapted from ResultsScreen.tsx]
    │   └── (unchanged internals: hero, CoreSignalCard×4, cluster score map,
    │        career families, majors, subjects, long-form sections)
    │   + AskKaiInline                   [new] contextual "Ask Kai about this" affordance
    │        per section (see KAI_EXPERIENCE.md §5 for the interaction)
    │
    ├── /profile/journey → JourneyScreen [supersedes ProfileScreen's module list]
    │   ├── ModuleRow ×N                 [reused as-is from current ProfileScreen.tsx]
    │   └── ComparisonTeaser             [new, hidden until 2+ assessments completed]
    │
    ├── /profile/kai → KaiScreen         [new — see §3 for full breakdown]
    │
    └── /profile/settings → SettingsScreen [new, consolidates existing scattered bits]
        ├── AccountSection               (name/email, sign out — from current ProfileScreen)
        ├── ConsentSection                (from lib/results/storage.ts's ResultConsent)
        └── LocaleSection                 (from LocaleProvider)
```

### 2.1 The Kai tab's own tree (detail)

```
KaiScreen
├── KaiConversationHeader           avatar (KaiChromaVideo, resting), name, "online" micro-state
├── KaiMessageList                  virtualized scroll, newest at bottom
│   └── KaiMessageGroup ×N          one per turn (Kai or user)
│       └── KaiMessagePart ×N       renders ONE of:
│           ├── TextPart              prose, markdown-lite (bold/line breaks only)
│           ├── InsightCard           one deterministic-data insight, sourced + linkable
│           ├── CareerCard            a single career recommendation
│           ├── UniversityCard        a single program/university suggestion
│           ├── ComparisonChart       small bar/radar built from CompassResult data
│           ├── ActionPlanCard        the "Next 7 Days" style plan (§7)
│           └── SuggestedReplies      chip row, tapping sends that reply
├── KaiStarterActionsRow            shown only on a fresh/empty thread (§6 in KAI_EXPERIENCE.md)
├── KaiComposer                     text input + send — present, but never the ONLY thing shown
└── KaiTypingIndicator              shown while awaiting a response (character-consistent, not a generic "...")
```

Every part type in `KaiMessagePart` is a **real, separately testable React component** with its own prop contract — not a single "renders whatever the AI sent" blob. This matters for §6: the AI's structured output is validated against these exact shapes before render, so a malformed model response degrades to a plain `TextPart` fallback rather than crashing the screen.

---

## 3. State Management

**Decision: no global client store (Redux/Zustand/Context-as-store) for Kai either — extend the existing pattern instead of introducing a new one.** The app's working pattern is "typed localStorage-backed modules, read where needed, no prop-drilling because there's no shared mutable tree to drill." Kai's conversation state is genuinely different in shape (a growing list, needs pagination eventually) so it gets its own store abstraction (§5), but that store is consumed via a **hook** (`useKaiConversation()`), not lifted into a global provider — consistent with how `useLocale()` and `useKaiNarration()` already work as the app's only two "hook-shaped shared state" precedents.

**Screen-local state stays screen-local**, exactly as today: composer text, "is Kai typing," which starter action is highlighted — plain `useState` inside `KaiScreen`, nothing new architecturally.

**One real addition:** a `ProfileDataContext` (React Context, not a store) that resolves once at the `ProfileShell` layout level — auth user, display name, and a merged "what does this person's journey look like" object (see §4) — so every tab's screen doesn't independently re-derive it. This is scoped narrowly (read-only, resolved once per profile-shell mount) and isn't a general app-wide store; it dies with the layout, same lifetime as the tab bar itself.

---

## 4. Context Builder Architecture

The single most important piece of new infrastructure: **the function that decides what Gemini is allowed to know before every single request.** Runs server-side only (never in the client bundle — the assembled context can include full assessment answers, which shouldn't round-trip to the browser as a payload the network tab can inspect any more than necessary).

```
lib/kai/context-builder.ts

buildKaiContext(userId, threadId, currentTurnText) → KaiContext
```

### 4.1 What goes in (per the brief's list, made concrete against this codebase)

| Brief's category | Concrete source | Notes |
|---|---|---|
| Deterministic assessment | `CompassResult` embedded in `PersonalizedCompassReport.score` | The full object — clusters (raw/bonus/final/ranked), archetype, drivers, ecosystem fit, confidence, axes. This is the ground truth Gemini is told never to contradict. |
| Narrative report | `PersonalizedCompassReport`'s prose fields (headline/summary/academicPath/...) | So Kai can reference "what I already told you" instead of re-deriving it differently. |
| Journey | `ProfileSnapshot` (extended — see §4.3) | Which modules exist, which are done/locked, completion timestamps. |
| Completed assessments | Same `ProfileSnapshot.modules`, filtered to `status:"completed"` | Today this is just CORE; the shape already supports N. |
| Current conversation | Last **K** messages of the active thread (K, not "all of it" — see §4.4) | Full fidelity for recent turns. |
| User preferences | New: a small `KaiPreferences` record (locale, tone opt-outs if ever added) | Minimal today — mostly a placeholder for §12's future roadmap. |
| Locale | `useLocale()`'s current locale, passed explicitly (server has no cookie-free way to know it otherwise) | Drives both the system prompt's language instruction and regional wording (A-Levels/Tawjihi, matching the existing results prompt's own instruction). |
| Conversation summary | New: `ConversationStore.getSummary(threadId)` (§5.3) | A running compressed summary of everything *before* the last K messages — not the raw history. |

### 4.2 What never goes in (per the brief, enforced in code, not just policy)

```ts
// lib/kai/context-builder.ts
const EXCLUDED_FIELDS = ["email", "respondent_email", "ip_country", "user_agent"] as const;
```

- **No email.** `ResultRegistration.email` / the auth user's email is never read by the context builder. This mirrors the existing results route's own comment (`"Do not send email to Claude"`) — same rule, same rationale, now enforced for a second AI surface.
- **No raw PII beyond a first name.** Only a display name (already how the existing Claude prompt works: `learner.name`) — no address, no phone, no full legal name if it differs from display name.
- **No unnecessary data.** The context builder does not send the user's *entire* answer-by-answer digest to Kai by default (unlike the one-shot results-generation call, which legitimately needs it once to write the initial report). Kai gets the **already-computed** `CompassResult` and report — re-sending all 54 raw answers on every chat turn is both a privacy surface and a token-budget waste for a system that should be *referencing* a result, not re-deriving one.
- **Enforced by a runtime assertion, not just a TypeScript type** — `assertNoExcludedFields(payload)` throws in dev and logs-and-strips in production, so a future contributor adding a field to `ProfileSnapshot` can't silently leak it into every Gemini call by accident.

### 4.3 `ProfileSnapshot` needs one extension

Today's `readProfileSnapshot()` (`lib/profile/journey.ts`) is a pure `localStorage` read. The context builder needs the **server-side equivalent** — a user is authenticated when talking to Kai (the whole Kai surface sits behind the same auth gate as the rest of `/profile/*`), so:

```ts
// lib/profile/journey-server.ts (new)
export async function readProfileSnapshotServer(userId: string): Promise<ProfileSnapshot>
```

reads from `assessments` (Supabase, service-role, same table `POST /api/assessments/persist` already writes) instead of `localStorage`. This is the fix for the seam named in §0.1.3 — the context builder is the first consumer that *requires* the DB and local versions to agree, so it forces that reconciliation rather than leaving it as latent debt. (This also, as a side effect, gives the eventual admin/Responses linkage a second real consumer, strengthening the case for closing that gap generally — not this project's job to close it everywhere, but worth noting.)

### 4.4 Sizing discipline

- **K (recent message window): 12 messages** (6 turns) sent at full fidelity. Chosen as a starting point, not derived from a token budget calculation yet — revisit once real conversations exist to sample from.
- **Summary, not transcript, beyond K.** Once a thread exceeds K messages, the (K+1)th-oldest message triggers a background summarization call (small, cheap, same Gemini client) that folds into `ConversationStore`'s per-thread summary field. The context builder always sends: `[summary] + [last K messages] + [current turn]` — never the full history.
- **The deterministic score block is sent in full every time** (it's small — a handful of enums and small number arrays, not prose) rather than summarized, because summarizing "ground truth the model must not contradict" is exactly the kind of lossy step that causes contradictions.

---

## 5. Conversation Storage — Provider-Independent by Design

Mirrors `AnalyticsProvider` (`lib/analytics/types.ts`) on purpose — same shape of problem (today: one dumb transport; tomorrow: a real backend), same solution (interface first, swap the implementation, callers never know which one is live).

```ts
// lib/kai/conversation-store.ts

export interface KaiMessage {
  id: string;                 // crypto.randomUUID()
  threadId: string;
  role: "kai" | "user";
  parts: KaiMessagePart[];    // see §6.2 — same shape the AI's structured output produces
  createdAt: string;          // ISO
}

export interface KaiThread {
  id: string;
  userId: string;
  title: string;              // derived from the first exchange, editable later
  createdAt: string;
  updatedAt: string;
  summary: string | null;     // rolling summary beyond the K-message window (§4.4)
}

export interface ConversationStore {
  listThreads(userId: string): Promise<KaiThread[]>;
  getThread(threadId: string): Promise<KaiThread | null>;
  createThread(userId: string): Promise<KaiThread>;
  getMessages(threadId: string, limit?: number): Promise<KaiMessage[]>;
  appendMessage(threadId: string, message: Omit<KaiMessage, "id">): Promise<KaiMessage>;
  setSummary(threadId: string, summary: string): Promise<void>;
}
```

### 5.1 V1 implementation — `localStorage`

`lib/kai/stores/local-conversation-store.ts` implements `ConversationStore` against a single `localStorage` key (`tareeq.kai.threads.v1`), mirroring the exact persistence discipline `lib/analytics/storage.ts` already uses (JSON blob, defensive `try/catch` on parse, a version suffix on the key so a future shape change doesn't crash on old data). One thread per user is enough for V1 — the interface supports N threads from day one so the UI (a future "conversation history" list) doesn't need to change when V2 adds more.

### 5.2 V2 implementation — Supabase (future, designed now, not built now)

```sql
-- sketch, not a migration — for when this phase is approved
create table kai_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table kai_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references kai_threads(id) on delete cascade,
  role text not null check (role in ('kai','user')),
  parts jsonb not null,
  created_at timestamptz not null default now()
);
```

`lib/kai/stores/supabase-conversation-store.ts` implements the identical `ConversationStore` interface. **The swap is a single line** — wherever the store is constructed (one factory function, `getConversationStore()`), not scattered `if (hasSupabase)` checks through the UI. Every component and the context builder depend on the interface, never on which implementation is active.

### 5.3 Migration path (V1 → V2, sketched for the future roadmap, not this phase)

On first authenticated Kai session after V2 ships: read the local store's threads, `POST` them once into Supabase, then flip the factory to return the Supabase implementation for that user going forward. Not required for V1 to ship; noted so V1's local shape (`KaiMessage`/`KaiThread`) is chosen to serialize cleanly into the V2 tables above (it already does — that's why the interface was designed against the DB shape first, then the localStorage version was made to satisfy the same interface, not the other way around).

---

## 6. Gemini Integration

### 6.1 Client module

```
lib/kai/gemini-client.ts
```

Ported pattern (not ported code — the admin repo's version is admin-specific) from the admin's `ai-extract.ts`/historical `providers.ts`:
- `x-goog-api-key` **header**, never query string (same rule, restated).
- `responseMimeType: "application/json"` + an explicit `responseSchema` (§6.2) — the model is *structurally incapable* of returning something the UI can't render, not just instructed to.
- `thinkingConfig: { thinkingBudget: 0 }` — same fix the admin provider already needed for truncation-prone structured JSON on 2.5 models.
- Retry transient `429/500/503` with backoff (same `[400, 900]ms` shape already proven in the admin code) — Kai is a conversational surface; a silent retry beats a visible error for a transient blip.
- **Provider errors logged server-side only**, never surfaced to the client with detail (matches the existing rule).

### 6.2 Structured output contract — the mechanism that enforces "Gemini never scores"

```ts
// lib/kai/types.ts

export type KaiMessagePart =
  | { type: "text"; text: string }
  | { type: "insight_card"; title: string; body: string; sourceField: keyof CompassResult | keyof PersonalizedCompassReport }
  | { type: "career_card"; title: string; description: string; clusterCode: ClusterCode }
  | { type: "university_card"; program: string; whyItFits: string }
  | { type: "chart"; chartType: "cluster_bar" | "driver_radar"; /* rendered FROM CompassResult client-side — the model requests which chart, not what the numbers are */ }
  | { type: "action_plan"; title: string; days: Array<{ day: number; tasks: string[] }> }
  | { type: "suggested_replies"; options: string[] };

export interface KaiResponse {
  parts: KaiMessagePart[];
}
```

Read that schema closely: **there is no field anywhere in it that can hold a cluster code, archetype, driver, or ecosystem-fit value that didn't already exist in the input `CompassResult`.** `chart.chartType` picks *which* pre-computed chart to render from data the client already has — the model never emits chart data points. `insight_card.sourceField` must reference an existing field name on the real result objects (validated against a literal union, not a free string) — so an "insight" is always traceable back to a real, existing, deterministic value, per the brief's *"Kai must always explain recommendations using deterministic assessment data."* This is the schema-level enforcement of the core principle; the system prompt (`KAI_EXPERIENCE.md` §3) is the second, belt-and-suspenders layer.

### 6.3 Server route

```
POST /api/kai/chat
```

```ts
{
  threadId: string;
  message: string;
}
→ 200 { message: KaiMessage }   // Kai's turn, already appended to the store server-side
```

Mirrors `/api/results/generate`'s shape (stateless-looking route, `runtime: "nodejs"`, no client-visible auth token beyond the existing session cookie) but is **not** stateless internally — it: (1) authenticates via the existing Supabase session-cookie pattern (`createSupabaseServerClient()`, same as `/api/assessments/persist`), (2) calls `buildKaiContext()`, (3) calls the Gemini client, (4) validates the response against `KaiResponse`'s schema (defense against a malformed structured-output edge case — falls back to a single `text` part with a generic "let me think about that differently" line rather than ever rendering `undefined`), (5) appends both the user's and Kai's message to `ConversationStore`, (6) returns Kai's message for immediate render.

A **second route**, `POST /api/kai/open`, generates the proactive opening message (see `KAI_EXPERIENCE.md` §4) the moment a thread has zero messages — same pipeline, different prompt framing ("initiate," not "respond").

### 6.4 Rate limiting (carried over as a requirement, not deferred)

`ARCHITECTURE_REVIEW.md` flagged **no rate limiting on any AI-calling route** as a live risk today. Kai adds a second, higher-frequency AI surface (a chat can generate many calls per session vs. one call per completed assessment) — this makes the existing gap materially worse if not addressed alongside, not after. Concretely: a per-user, per-minute cap (Supabase-backed counter or Vercel KV — implementation detail for the build phase, not this document) on `/api/kai/chat`. Named here so it's scoped into the phased plan (§13), not silently dropped.

---

## 7. Prompt Architecture

Composed in layers, assembled fresh per request — never one giant hand-written string:

```
lib/kai/prompt-builder.ts

buildSystemPrompt(context: KaiContext): string
  1. Personality + tone rules         (static — see KAI_EXPERIENCE.md §3, the full text lives there)
  2. Hard guardrails                  (static — "never invent a score," "never contradict CompassResult")
  3. Locale instruction               (dynamic — "respond in Arabic" / regional wording, mirrors the
                                        existing results prompt's "A-Levels, Tawjihi" instruction)
  4. Deterministic data block         (dynamic — the CompassResult + report, JSON, clearly delimited)
  5. Journey block                    (dynamic — which modules/assessments exist)
  6. Conversation summary             (dynamic — from ConversationStore, may be empty)

buildUserTurn(context, currentMessage): string
  — the last K messages (already in the request as structured `contents`, not restated in the
    system prompt) + the new message
```

Layers 1–2 are **identical on every request, in every locale, for every user** — cached as a constant, not re-templated, so a prompt-injection attempt via layer 4/5/6's data can't rewrite the rules above it (the guardrail text is never string-concatenated with user-influenced content into the same block the model might be tricked into "continuing past").

---

## 8. Multi-Assessment Architecture

**Design principle: Kai's context builder is written against an *assessment-agnostic* shape from day one, even though only CORE exists today.**

```ts
// lib/kai/types.ts
export interface AssessmentSummary {
  moduleId: string;             // "core-compass", future: "leadership", "entrepreneurship", ...
  displayName: string;
  completedAt: string | null;
  status: "completed" | "available" | "locked";
  // The deterministic result, kept as a loosely-typed envelope on purpose —
  // CORE's CompassResult and a future Custom assessment's result shape
  // (Tareeq-admin's spec-executor output) are structurally different.
  // Kai treats this as "a labeled bundle of deterministic facts about one
  // assessment," not as CompassResult specifically.
  resultSummary: Record<string, string | number | boolean> | null;
}
```

`ProfileSnapshot.modules` (§4.3) maps onto `AssessmentSummary[]` today with exactly one populated entry (CORE). When the admin's custom-assessment runner ships (closing Gap A3 from `PROJECT_COMPLETION_PLAN.md` — explicitly **not** part of this phase), each new module type contributes its own `resultSummary` shape without the context builder, the prompt layers, or the `AssessmentSummary` interface changing at all — only the *source* of the array grows from one hardcoded entry to a real query.

**Comparison is a prompt-layer concern, not a schema one.** "Kai should compare assessments" doesn't need a new `KaiMessagePart` type beyond what §6.2 already has (`insight_card` and `chart` both already generalize to "compare two `AssessmentSummary` entries" once there are two to compare) — it needs the journey block (§7, layer 5) to include *all* completed `AssessmentSummary` entries, which it already does by construction.

---

## 9. Analytics Integration

New event names, same pipeline (`lib/analytics/*`, no new infrastructure) — extends the taxonomy in `lib/analytics/events.ts` the identical way Phase 3's `question_*` events extended it previously:

| Event | Fires when |
|---|---|
| `kai_thread_opened` | User lands on `/profile/kai` (existing thread or fresh) |
| `kai_opening_message_shown` | The proactive opener (§4 in KAI_EXPERIENCE.md) renders |
| `kai_starter_action_used` | A starter-action chip is tapped, `metadata.action = "explain_results" \| "recommended_majors" \| ...` |
| `kai_message_sent` | User sends a free-text message |
| `kai_message_received` | Kai's response renders, `metadata.partTypes = ["text","career_card",...]` (so the analytics side can measure how often each part type actually gets used — directly answers "is the mixed-content design working" empirically) |
| `kai_suggested_reply_used` | A suggested-reply chip is tapped |
| `kai_card_expanded` | A card (career/university/action-plan) is tapped for more detail |
| `kai_action_plan_started` | User marks day 1 of an action plan as started/viewed |

`question_id`'s design precedent (Phase 3: use a stable, human-meaningful key, not a DB uuid the client doesn't have) applies again here — `threadId` and a `messageId` are both client-generated UUIDs already, so no new identity problem to solve.

---

## 10. Future: Memory, Streaming, and What They Actually Require

**Memory beyond one thread's summary** (the brief's "long-term memory"): once V2 storage (§5.2) exists, a background job (out of scope for this doc — same "future" bucket as streaming) can periodically fold *closed* threads' summaries into a per-user `kai_memory` record Kai's context builder reads alongside the active thread's summary. The `ConversationStore` interface doesn't need to change for this — it's a new reader on the same tables, not a new write path.

**Streaming**: the route contract in §6.3 returns a complete `KaiMessage` in one response deliberately, so the UI never depends on partial-JSON parsing. Moving to SSE later is additive: the route would stream `KaiMessagePart`s as they complete (Gemini's structured-output streaming supports this) and `KaiMessageList` would append parts to the in-progress message rather than waiting for the whole object — a rendering change, not a schema or context-builder change. Named here so nobody designs V1's schema in a shape that would need to be broken to add this later (it doesn't).

---

## 11. Risks & Tradeoffs

| # | Risk / tradeoff | Why it's accepted anyway |
|---|---|---|
| 1 | New bottom-tab-bar chrome is untested UI territory for this app (§1) | Confined to `/profile/*`; the assessment flow (the part that's proven and conversion-sensitive) is untouched |
| 2 | Two AI providers in one app (Claude for results, Gemini for Kai) | Explicit brief requirement for Kai; unifying is a real future task, named, not hidden (§0.1.4) |
| 3 | Context builder depends on server-side `assessments` reads while the rest of the profile still reads `localStorage` (§4.3) | Forces (rather than defers) reconciling a seam that already existed and was already risk; better to hit it now with one well-scoped function than later with an ad hoc patch |
| 4 | `AssessmentSummary`'s loosely-typed `resultSummary` (§8) trades type safety for forward-compatibility | The alternative — a tagged union of every future assessment's result shape, decided before any of them exist — would need to be redesigned anyway once the first non-CORE assessment lands for real; loose-but-labeled is the honest middle ground |
| 5 | No rate limiting exists today on AI routes generally, and this adds a higher-frequency one (§6.4) | Named as a build-phase requirement, not deferred past this project the way the existing gap has been |
| 6 | Structured-output schema validation (§6.2) adds a fallback path that can degrade a rich response to plain text | A degraded-but-safe response beats a crashed screen; same philosophy the existing results route already uses (`normalizeString`/`normalizeList` field-by-field fallback) |
| 7 | Summarization (§4.4) is lossy by definition | Sending full history forever doesn't scale (token cost, latency); the deterministic score block — the one thing that must never be lossy — is explicitly exempted from summarization |

---

## 12. Phased Implementation Plan (proposed — not started)

Ordered so each phase ships something demoable and nothing later depends on unbuilt earlier pieces.

**Phase 0 — Foundations (no visible UI change)**
- `ProfileSnapshot` server-side read (§4.3), reconciling the local/DB seam.
- `ConversationStore` interface + localStorage implementation (§5.1).
- `KaiMessagePart`/`KaiResponse` types (§6.2) and the Gemini client module (§6.1) with a hardcoded test prompt (no real context yet) — prove the structured-output contract works before wiring real data into it.

**Phase 1 — Profile shell**
- `ProfileShell` layout + bottom tab bar (§1), the four non-Kai tabs wired to existing content (Overview extracted from today's `ProfileScreen`, Compass = adapted `ResultsScreen`, Journey = today's module list, Settings = consolidated scattered bits). No new content yet — this phase is a *reorganization*, verified against the existing screens' current behavior.

**Phase 2 — Kai, minimum viable**
- Context builder (§4) wired to real data.
- `/api/kai/chat` + `/api/kai/open` (§6.3).
- `KaiScreen` with `TextPart` and `SuggestedReplies` only (defer cards/charts/action-plans to Phase 3) — proves the end-to-end loop (auth → context → Gemini → store → render) with the smallest surface that's still a real conversation.

**Phase 3 — Rich conversation**
- The remaining `KaiMessagePart` types (insight/career/university cards, charts, action plans).
- Starter actions row (`KAI_EXPERIENCE.md` §6).
- Analytics events (§9).

**Phase 4 — Polish & hardening**
- Rate limiting on `/api/kai/*` (§6.4).
- The proactive-opener quality pass (tuning `buildSystemPrompt`'s opener framing against real transcripts).
- Accessibility/localization pass (Arabic RTL inside chat bubbles, voice narration hook-up if Kai should also speak in chat — a decision not yet made, flagged for the approval conversation).

**Deferred, not in this plan (§10, §8's dependency, and admin-side Gemini optimizer):** multi-thread history UI, V2 Supabase conversation storage, cross-thread long-term memory, streaming, real multi-assessment data (blocked on the admin/consumer custom-assessment bridge, which is a separate, larger, already-tracked gap).

Each phase ends with the same gate already standard in this codebase: `tsc --noEmit`, `vitest run`, and a manual click-through — no phase is considered done on code existing alone.
