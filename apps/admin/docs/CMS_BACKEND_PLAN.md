# Tareeq Backend Admin / CMS — Master Plan

> Status: **Plan only — not yet implemented.** Goal: an admin dashboard / CMS to manage
> assessment questions, build entirely new assessments, manage users, and track activity /
> insights / dashboards.

## 1. Context — why this is needed

Tareeq works end-to-end, but the platform is **not yet manageable**:

- Assessment questions are **hardcoded** in `lib/content/seed.ts` (54 items). Changing a
  question means a code deploy.
- The rich DB schema that already exists (`db/schema.ts`) is **largely unused at runtime** —
  the app reads the seed, results live only in `localStorage`, and the analytics tables are empty.
- There is **no admin surface, no auth/RBAC wiring, and no analytics**.

The good news: this is an **extension, not a greenfield build**. The hardest data modeling is
already done (versioned content + per-option scoring metadata + an analytics goldmine + an RBAC
role column). The work is mostly: an admin app, the data plumbing to make the live app DB-driven,
and dashboards.

**Intended outcome:** a secure admin/CMS where non-engineers manage content and see insights,
and a runtime that is DB-driven and observable — without changing how the public app *looks* or how
scoring works.

---

## 2. Current state (reuse this — don't rebuild it)

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v3 · **Drizzle ORM** ·
**Supabase** (Postgres + Auth via `@supabase/ssr`) · **Zod** · lucide-react.

**DB schema already present** (`db/schema.ts`, migrations in `db/migrations` + `supabase/migrations`):

| Table | Purpose | CMS relevance |
|---|---|---|
| `clusters` | 8 career clusters (code, name, order) | CMS-editable |
| `content_versions` | **Versioning** (label, `isActive`, notes) | publish/rollback backbone |
| `questions` | versioned (`versionId`, externalId, pillar, position, kind, localized `title`, axis) | CMS core |
| `question_options` | localized text + **scoring metadata** (`clusterCode` / `driverCode` / `axisValue`) | CMS core |
| `profiles` | `auth.users`-linked, **`role` ∈ {user, admin}** (CHECK) | RBAC ready |
| `user_accounts` | email, hash, verified, soft-delete | user mgmt |
| `assessments` | runtime record (answers, result, shareToken) | persistence target |
| `assessment_data` | anonymized analytics (all scores, archetype, drivers, ecosystem, confidence, consent, device, time) | **analytics goldmine** |
| `user_outcomes` | longitudinal follow-up | retention insight |
| `audio_clips` | per-question TTS | content asset |

**Scoring/results pipeline (must stay intact):** deterministic engine (`lib/scoring`) keyed on
`question_options` metadata → deterministic base report (`lib/results/framework.ts`) → **Gemini
prose-only fine-tuner** (`/api/results/generate`). Lists/cluster/score are deterministic; AI only
rewrites prose.

**The 6 gaps the CMS must close:**
1. Live app reads the **hardcoded seed**, not the active `content_version` from the DB.
2. No admin UI / CMS.
3. No auth flow wired (no middleware, no `profiles.role` gate).
4. Results **not persisted** server-side (localStorage only).
5. No **granular event tracking** (only completion-level data exists).
6. Only 2 API routes (`/api/results/generate`, `/api/kai-tts`).

---

## 3. Recommended tech stack (confirm + small additions)

**Keep** (already in the repo): Next 15, Drizzle, Supabase (Postgres/Auth/Storage/RLS), Zod, Tailwind.

**Add (admin-only deps):**
- **TanStack Query** — admin data fetching/caching/mutations.
- **TanStack Table** — user/content data grids (sorting, pagination, filtering).
- **react-hook-form + Zod resolver** — the question/assessment editors.
- **Recharts** (or **Tremor** for batteries-included dashboards) — charts.
- **Sentry** (or Supabase logs) — error tracking on the admin + APIs.

**Decision:** self-host analytics in our own `events` table (we own the data, it's privacy-sensitive
youth data) rather than a third-party like PostHog. (Open decision in §11.)

---

## 4. Architecture

```
┌─────────────────── Same Next.js app (shared db + types) ───────────────────┐
│  app/(assessment) (public)      app/(app) (home)      app/(admin)  ← NEW    │
│        │                              │                    │               │
│        ▼ reads ACTIVE content_version ▼ persists           ▼ RBAC-gated     │
│  ┌──────────────────────── lib/db (Drizzle repos) ──────────────────────┐  │
│  └───────────────────────────────┬──────────────────────────────────────┘  │
└────────────────────────────────── │ ───────────────────────────────────────┘
                                     ▼
                Supabase Postgres (RLS) · Auth · Storage
```

- **Admin lives in the same app** as a route group `app/(admin)` — shares Drizzle, Zod types, and
  the design system. (Simplest; a separate app duplicates infra. See §11.)
- **Auth:** Supabase Auth (magic-link or email/password) for admins; **Next middleware** checks the
  session and `profiles.role === 'admin'`; every admin route/action re-checks server-side.
- **Data layer:** typed **Drizzle repository** modules (`lib/db/repos/*`); Zod schemas are the API
  contract for both input and output.
- **API split:**
  - **Admin API** — server actions (or `app/api/admin/*` handlers), RBAC-guarded, Zod-validated,
    and **audited**.
  - **Public API** — serve the active content version; persist assessments + answers + result +
    `assessment_data`; ingest events.
- **Content-from-DB:** the public app reads the **active `content_version`** (questions + options)
  from the DB, **cached** (Next `unstable_cache`/tag-revalidate on publish). The seed becomes the
  initial DB seed + dev fallback.
- **Analytics flow:** client emits events → `/api/events` → `events` table; completion writes
  `assessment_data`; dashboards read SQL views / nightly rollups.

---

## 5. Data-model deltas (most things reuse existing tables)

**New tables (3):**
1. **`scoring_config`** (per `content_version`) — the pillar map, axis/driver/cluster definitions,
   **tiebreaker rules**, and the operational/ecosystem **bonus map**, as JSON. This **decouples the
   engine from hardcoded `externalId`s** (e.g. the `Q18`/`Q21` tiebreakers) so a *brand-new*
   assessment with a different structure is still scorable. CORE ships as the default config.
2. **`events`** — granular activity: `(id, anonSessionId|userId, type, payload jsonb, occurredAt)`.
   Drives funnels + per-question drop-off + return visits.
3. **`admin_audit_log`** — `(actor, action, entity, entityId, before, after, ts)` for every admin
   mutation.

**Reuse (no change):** `content_versions` (publish/rollback), `profiles.role` (RBAC), `assessments`
+ `assessment_data` (completion analytics), `user_outcomes` (longitudinal), `assessments.result`
(store the generated report).

**Migration workflow:** Drizzle `db:generate` → review SQL → apply to Supabase → extend
`scripts/seed_db.ts` to seed CORE as the active version.

---

## 6. The CMS — content management + assessment builder

**Content management (manage the *existing* assessment):**
- **Clusters editor** — name, description, display order.
- **Content versions** — list, **clone** an existing version, draft vs active, **publish** (atomic
  `isActive` flip + cache revalidation), **rollback**, notes/changelog.
- **Question editor** — localized `title`, options (letter + localized text), `pillar`/`axis`/`kind`,
  and per-option scoring metadata (`clusterCode`/`driverCode`/`axisValue`); drag-reorder (`position`).

**Assessment builder (create a *whole new* assessment):**
- Create a new `content_version` **+ `scoring_config`**; add questions; assign scoring metadata.
- **Live validation** (the safety net): every pillar covered, every curiosity option maps to a
  cluster, drivers/axes balanced, tiebreaker questions defined, no orphan options.
- **Preview** — render the *real* assessment flow against the draft version.
- **Publish** — flip active; the live app picks it up via cache revalidation.

**Scoring genericization:** introduce `scoring_config` so `lib/scoring` reads pillar definitions +
tiebreakers + bonus map from the version (CORE = default). This is what makes "create a new
assessment" actually work, not just edit CORE.

---

## 7. User management + privacy/GDPR

- **Users list** (`user_accounts` + `profiles`) — search/filter, detail view (their assessments +
  consent), **role assignment** (promote/demote admin).
- **Consent** — surfaced from `assessment_data` flags (general research / longitudinal / university
  sharing) + withdrawal state.
- **Right to erasure** — export a user's data; **hard-delete** cascading `assessments` /
  `assessment_data` / `user_outcomes`; respect the `userIdHash` anonymization boundary.
- **Minimal PII** — keep email in `user_accounts`; analytics keyed by hash. Age-gate / minors
  handling per the consent docs.

---

## 8. Analytics, insights & dashboards

- **Event model** (`events`) → funnel, **per-question drop-off**, time-per-question, results-viewed,
  home-tab visits, return visits.
- **Dashboards:**
  - *Overview* — starts / completions / completion-rate, DAU·WAU.
  - *Assessment funnel* — step-by-step drop-off + a **per-question drop-off heatmap**.
  - *Outcomes* — cluster / archetype / driver / ecosystem distributions; confidence distribution.
  - *Reach* — geography, device/browser.
  - *AI health* — **gemini-vs-fallback ratio**, latency.
  - *Longitudinal* — prediction alignment from `user_outcomes`.
- **Aggregation:** SQL **views** + a **nightly rollup table** for heavy queries; on-the-fly for light
  ones. Charts via Recharts/Tremor.
- **MVP insights:** completion funnel, cluster distribution, per-question drop-off.

---

## 9. API strategy (how we keep APIs manageable)

- **Conventions:** one **Zod schema per endpoint** (input *and* output) = the contract; typed Drizzle
  repos; a consistent envelope `{ success, data, error, meta }`; cursor/limit **pagination**; a shared
  **RBAC guard** helper; admin mutations always write `admin_audit_log`; **rate limiting** on public
  endpoints (reuse the in-memory limiter, upgrade to Upstash for prod).
- **Versioning:** public under `/api/v1/*`; admin under `/api/admin/*` (or server actions).
- **Public endpoints:** `GET active content`; `POST assessment` (start) → `PATCH answers` →
  `POST complete` (persist result + `assessment_data`); `POST events`.
- **Admin endpoints:** CRUD for content/questions/options/clusters/versions; users; analytics queries.

---

## 10. Infra, security & ops

- **RLS** — lock every table for the anon key: the public app may only read the **active content**
  and write/read **its own** session rows; **analytics tables are not anon-readable**. Admin reads via
  service role (server-only) or role-based RLS.
- **Migrations** — Drizzle `drizzle-kit generate` → review → apply to Supabase; seed via
  `scripts/seed_db.ts`.
- **Storage** — Supabase Storage for `audio_clips` + future assets.
- **Deploy** — Vercel, same project for app + admin; preview vs prod env; secrets server-only
  (`GEMINI_API_KEY`, Supabase service role).
- **Observability** — Sentry + structured logs; Supabase PITR backups; admin security checklist
  (admin MFA, audit log, least-privilege service role).

---

## 11. Phased roadmap (each phase shippable)

| Phase | Goal | Key items | Size |
|---|---|---|---|
| **0 — Foundation** *(unblocks all)* | Admin can log in; app reads content from DB | Drizzle repos + Supabase server/client; admin auth + RBAC + middleware; `app/(admin)` shell + nav; baseline RLS; **make the app read the active `content_version`** (seed fallback) + seed CORE as active | M |
| **1 — Content CMS** | Manage the existing assessment | Clusters + content-versions + question editor (CRUD); publish/rollback; preview | M–L |
| **2 — Assessment Builder** | Create a brand-new assessment | `scoring_config` + generic scoring; builder + live validation | L |
| **3 — Persistence + Events** | Make the app observable | Persist `assessments` + `assessment_data` + result; `events` table + client emit; MVP dashboards (funnel, cluster dist, drop-off) | M–L |
| **4 — Analytics + Users + Privacy** | Full insight + governance | Rich dashboards; user mgmt; consent/export/delete; `admin_audit_log` | L |
| **5 — Hardening** | Production-grade | Rate limiting, monitoring, RLS audit, backups, docs | S–M |

---

## 12. Open decisions (confirm before building)

1. **Admin placement:** same Next app (recommended) vs a separate admin app?
2. **Analytics:** self-rolled `events` table (recommended — we own youth data) vs PostHog?
3. **Charts:** Recharts vs Tremor?
4. **Scoring genericization timing:** build the config-driven engine in Phase 2, or keep CORE-coupled
   longer and add `scoring_config` later?
5. **Admins:** just you, or a team? (affects auth: magic-link vs SSO + MFA.)

---

## 13. Verification (when built)

- **Content:** edit a question in admin → publish → the live app reflects it → the **existing
  scoring validation-profile tests** still pass against the active version.
- **Auth:** a non-admin is blocked from `/admin` and admin APIs; an admin can manage content.
- **Analytics:** take an assessment → an event funnel + an `assessment_data` row + dashboard counts
  all update.
- **Privacy:** export + delete a user removes all of their data across tables.
- **Tests:** extend the vitest suite — scoring profiles run against a DB-loaded version; Zod API
  contract tests.
