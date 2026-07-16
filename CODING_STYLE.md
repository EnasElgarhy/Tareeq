# Tareeq Engineering and Coding Style

This is the canonical engineering guide for the Tareeq repository. It applies
to humans and coding agents working in `apps/consumer`, `apps/admin`, deployment
configuration, migrations, scripts, and shared documentation.

The goal is not stylistic uniformity for its own sake. The goal is dependable,
readable changes that preserve user trust, assessment integrity, bilingual
behavior, and production safety.

## Precedence

When guidance conflicts, use this order:

1. An approved product or technical specification for the task.
2. This guide.
3. Established patterns in the current owning module.
4. Historical plans, prototypes, and app-level context documents.

The files under `apps/*/AGENTS.md` contain useful history but may describe an
older architecture. Inspect the current code before relying on historical
claims.

## Repository Shape

- `apps/consumer`: assessment, authentication, results, profile, Kai chat, and
  the user-facing application.
- `apps/admin`: internal administration, content, users, teams, and analytics.
- `docs`: architecture, operations, and deployment documentation.
- `.github`: repository automation. A workflow file is not proof that the
  corresponding infrastructure is currently in use.

The two applications are independently deployable Next.js applications. Run
their scripts from the application directory you are changing.

## Non-Negotiable Principles

1. Read before editing. Trace the owning module, its callers, tests, and runtime
   lifecycle before choosing an implementation.
2. Make the smallest complete change. Do not bundle unrelated refactors,
   formatting churn, dependency upgrades, or metadata changes into feature work.
3. Preserve existing user work. A dirty worktree is normal; never reset,
   overwrite, stash, or revert changes you did not create.
4. Keep behavior explicit. Validate external data, model state with types, and
   make loading, success, empty, and error states deliberate.
5. Test the behavior users depend on, including the failure and retry paths.
6. Never expose secrets. Service credentials, provider keys, tokens, and private
   user data stay on the server and out of logs, screenshots, fixtures, and Git.
7. Do not commit, push, deploy, mutate staging data, or modify live provider
   settings unless the user explicitly authorizes that exact action.
8. Report what was verified and what remains uncertain. Do not call work tested
   when only static analysis was run.

## Standard Workflow

### 1. Establish the baseline

- Run `git status --short` before editing.
- Use `rg` and `rg --files` to find ownership, call sites, tests, and docs.
- Read the smallest useful set of files instead of guessing from filenames.
- Confirm the current branch and recent commits before release-related work.
- For bugs, reproduce the failure or collect enough evidence to state why it
  happens.

### 2. Define the behavioral boundary

- State what should change and what must remain unchanged.
- Identify security, localization, persistence, concurrency, and lifecycle risks.
- Prefer the existing module boundary unless it is the cause of the bug.
- Add an abstraction only when it removes real duplication, owns a persistent
  resource, or enforces a meaningful contract.

### 3. Implement narrowly

- Follow the surrounding code's naming and structure.
- Keep pure domain logic outside Next.js route and page modules when it needs
  direct unit tests.
- Do not rewrite a working subsystem to solve a local issue.
- Comment only when the reason or constraint would otherwise be hard to recover.

### 4. Verify in layers

Run the cheapest relevant checks first, then broaden according to risk:

1. Focused regression tests.
2. Tests for the affected module or app.
3. Type checking and linting.
4. Production build when framework or runtime behavior changed.
5. Browser, API, audio, or provider-level verification for user-facing flows.

### 5. Review the actual patch

- Run `git diff --check`.
- Read `git diff` as a reviewer, not as the author.
- Confirm no unrelated file was changed or reformatted.
- Check that test assertions prove behavior rather than merely execute code.
- Summarize changed behavior, verification, residual risk, and release status.

## TypeScript

- Use TypeScript for all new application code and keep `strict` mode clean.
- Prefer `unknown` at untrusted boundaries, then validate and normalize it.
  Avoid `any`, unchecked casts, and non-null assertions.
- Use interfaces for stable object contracts and type aliases for unions,
  primitives, and composed states.
- Use discriminated unions for multi-state workflows instead of several loosely
  related booleans.
- Use named functions for exported domain logic and substantial helpers. Arrow
  functions are appropriate for callbacks and small local closures.
- Prefer early returns over deeply nested conditionals.
- Use `async`/`await` for asynchronous flows and handle expected failures at the
  owning boundary.
- Keep optional properties genuinely optional. Do not use optional fields to hide
  an unclear data contract.
- Use `@/` imports within an app. Use type-only imports when an import has no
  runtime value.
- Prefer named exports. Use default exports where Next.js requires or strongly
  expects them, such as pages and layouts.
- Name booleans with `is`, `has`, `can`, or `should`. Name handlers with `handle`
  and callbacks with `on` where that distinction helps.
- Use `UPPER_SNAKE_CASE` for module constants and `camelCase` for values and
  functions.
- Keep component filenames in `PascalCase.tsx`; use lowercase kebab-case for
  general modules and directories unless a framework convention applies.

## Formatting

Prettier is authoritative for mechanical formatting:

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all"
}
```

- Do not hand-format around Prettier or disable formatting rules for preference.
- Format only files touched by the task. Never run a repository-wide write
  command in a dirty worktree.
- Avoid formatting-only diffs in feature or bug-fix patches.
- Let ESLint enforce Next.js, React, accessibility, and TypeScript rules.

## React and Next.js

- Use App Router conventions and functional React components.
- Default to Server Components. Add `"use client"` at the smallest boundary that
  genuinely needs browser APIs, state, effects, or event handlers.
- Do not copy server data into client state unless the client must edit or stage
  it.
- Derive values during render when possible. Do not use an effect for pure data
  derivation.
- Effects must clean up timers, subscriptions, requests, media resources, and
  event listeners. They must remain correct when development Strict Mode invokes
  setup and cleanup more than once.
- Keep persistent resources at the nearest layout or provider that persists for
  the required lifetime. Keep screen-specific state inside the screen.
- Guard asynchronous UI work with cancellation, request IDs, or playback tokens
  so stale responses cannot overwrite current state.
- Every remote interaction needs a deliberate pending, success, empty, and error
  experience.
- Preserve browser back/forward behavior and route-level ownership. Do not hide a
  routing problem inside global state.
- Use Suspense and error boundaries where Next.js rendering or asynchronous
  dependencies require them.

## UI and Design

- Follow the established Tareeq and Daybreak visual language already present in
  the owning surface. Do not introduce a second design system inside a feature.
- Design mobile and desktop intentionally. Verify narrow mobile, standard mobile,
  laptop, and wide desktop layouts for meaningful interface changes.
- Keep operational screens quiet and scannable. Avoid decorative page cards,
  cards nested inside cards, excessive rounding, or oversized display type in
  compact interfaces.
- Use the icon library already used by the owning app. Do not add a dependency or
  draw a replacement SVG for an icon that already exists.
- Use semantic HTML first. Interactive elements must be keyboard reachable, have
  visible focus, and expose an accessible name.
- Keep layout dimensions stable so loading states, translated text, icons, and
  dynamic content do not shift or overlap adjacent UI.
- Reuse design tokens and existing utilities. Avoid one-off hardcoded colors when
  an established token expresses the intent.
- User-facing copy must have clear hierarchy and plain language. Do not add UI
  text that explains the interface itself when layout and labels can do the job.

## Localization

- English and Arabic are first-class product paths, not an afterthought.
- Keep the response, UI copy, narration, and fallback in the user's selected
  locale.
- Test both left-to-right and right-to-left rendering after layout changes.
- Do not build sentences by concatenating translated fragments.
- Use locale-aware number, date, and currency formatting.
- Never silently fall back to the wrong narration voice. English content uses the
  approved English voice; Arabic content uses the approved Arabic voice.

## APIs, Supabase, and Security

- Authenticate and authorize on the server for every protected operation. A
  hidden client control is not authorization.
- Validate request bodies and provider responses before using them.
- Keep `SUPABASE_SERVICE_ROLE_KEY` and all provider secrets in server-only code.
- Prefer user-scoped Supabase clients and RLS. Use the service role only for a
  clearly documented server-side responsibility.
- Return appropriate HTTP status codes and safe, understandable error messages.
  Do not return provider internals or stack traces to users.
- Do not log tokens, passwords, SMTP credentials, full assessment answers, or
  unnecessary personal data.
- Apply timeouts and cancellation to external calls. Make retried writes
  idempotent with stable request identifiers where possible.
- Treat migrations as append-only after they have been applied. Add a new
  migration instead of editing production history.
- Include RLS and rollback considerations in every schema or authorization
  change.

## Kai and Gemini

- The server owns intent classification, permissions, response contracts, and
  deterministic fallback behavior. Model output is untrusted input.
- Validate and normalize every structured model response before rendering or
  storing it.
- Factual answers must be answer-first and grounded. Render sources only from
  provider grounding metadata; never accept or invent model-written URLs as
  verified sources.
- Do not add unsolicited plans, cards, or coaching to a direct factual question.
  Rich artifacts should serve the intent, not decorate the response.
- Preserve the user's locale and relevant assessment context without exposing
  private data that the answer does not need.
- Bound retries and record why recovery occurred. A deterministic usable fallback
  is better than an infinite or opaque retry loop.
- Thread and message writes must be idempotent so refreshes, tab changes, or
  duplicate submissions cannot create duplicate turns.
- Prompt, schema, model, intent, or grounding changes require regression tests and
  the bilingual quality harness:

```bash
cd apps/consumer
pnpm kai:quality
```

- Quality reports must separate contract quality, model-assisted judgment,
  factual source coverage, fallback rate, recovery rate, and latency. A grounded
  answer is not automatically a factually correct answer.

## Assessment and Audio

- Assessment scoring rules, answer mappings, question order, and narration
  content are product contracts. Do not change them without explicit approval.
- Keep scoring pure and deterministic, with pinned persona and regression tests.
- If approved question wording changes, regenerate the matching narration and
  verify both locales.
- Route-persistent audio resources belong in the assessment layout provider:
  `HTMLAudioElement`, `AudioContext`, analyser graph, autoplay-unlock state, and
  playback ownership.
- Use playback tokens and cleanup so stale narration cannot race the current
  question.
- Preload only the next likely narration item unless a measured requirement
  justifies a broader strategy. Do not preload the full assessment.
- Measure perceived audio behavior from question visibility to first audible
  sample and Kai mouth movement, not only network completion.

## Tests

- Add a regression test for every fixed bug when the behavior can be automated.
- Test public behavior and contracts. Avoid tests coupled to incidental internal
  implementation.
- Keep pure logic tests close to the module as `*.test.ts` or `*.test.tsx`.
- Mock at provider boundaries, not across the entire application. Use route or
  browser tests when integration behavior is the risk.
- Cover success, invalid input, authorization failure, provider failure, timeout,
  retry, cancellation, and stale-response behavior as applicable.
- For UI work, inspect actual screenshots at mobile and desktop sizes and check
  keyboard interaction, overflow, loading, empty, and error states.
- For concurrency or lifecycle bugs, reproduce the exact sequence: route change,
  tab backgrounding, duplicate click, refresh, or overlapping request.

Use the scripts defined by the app being changed:

```bash
cd apps/consumer # or apps/admin
pnpm test -- path/to/focused.test.ts
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Run `pnpm test:e2e` in `apps/consumer` when the changed user flow has Playwright
coverage or warrants browser-level regression coverage.

## Dependencies and Architecture

- Prefer the platform, framework, and existing local helpers before adding a
  dependency.
- A new dependency needs a concrete benefit, active maintenance, compatible
  licensing, and no simpler existing solution.
- Keep domain logic separate from transport, persistence, and rendering.
- Prefer explicit data flow over hidden global state.
- Store a resource at the narrowest lifetime that satisfies the behavior. A
  provider is justified for cross-route persistence, not general convenience.
- Do not build speculative abstractions for future features.
- Update architecture or runbook documentation when the operational truth changes.
  Mark stale plans as historical instead of allowing them to appear canonical.

## Git and Release Safety

- Review `git status` before and after the change.
- Stage only files owned by the task. Never use broad staging in a dirty worktree.
- Use conventional commit subjects such as `fix(consumer): ...`,
  `feat(admin): ...`, or `docs: ...`.
- Do not amend, rebase, force-push, merge, or delete branches unless explicitly
  requested.
- A GitHub push and an AWS deployment are separate actions. Never describe a push
  as deployed without verifying the running service.
- Tareeq deployment is user-controlled and currently performed manually on AWS
  infrastructure. Do not deploy, restart containers, replace a server checkout,
  or change environment variables without explicit approval.
- Verify the exact commit, app, environment, runtime, and rollback path before a
  deployment. Production always requires separate explicit approval.
- After an authorized deployment, verify `/api/health` and the changed user flow,
  then report the deployed commit and environment.

## Definition of Done

A change is complete when:

- The requested behavior works without changing unrelated behavior.
- The implementation follows the owning module's architecture and this guide.
- Relevant regression tests exist and pass.
- Type checking, linting, and production build were run as required by risk.
- English and Arabic behavior were checked where the feature is localized.
- Security, privacy, loading, error, and stale-request paths were considered.
- The final diff contains no accidental formatting or unrelated changes.
- Documentation is updated when a contract or operational process changed.
- The handoff states what changed, what was tested, what was not tested, remaining
  risks, and whether anything was committed, pushed, or deployed.
