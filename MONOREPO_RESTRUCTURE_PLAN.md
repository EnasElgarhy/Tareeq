# Monorepo Restructure Plan

**Status: PLAN ONLY — nothing below has been executed.** No files moved, no
branches created, no commits made, nothing pushed, nothing deployed. This
document is the task-8 deliverable; everything else is analysis in support
of it. Execution starts only after explicit approval.

## 1. Current state (audit)

`EnasElgarhy/Tareeq` is one GitHub repo. Today the two apps live on two
different **branches**, each checked out to its own local directory, each
believing it owns the repo root:

| | Local checkout | Branch | Tracks toward |
|---|---|---|---|
| consumer | `/Users/thisiswahba/Tareeq` | `feat/bilingual-assessment` | `main` (already merged — `main` == consumer today) |
| admin | `/Users/thisiswahba/Tareeq-admin` | `feat/hybrid-assessment` | not yet merged anywhere |

They share early common-ancestor commits, but have diverged heavily since.
`main` currently contains **only** consumer's code — admin's tree has never
landed on `main`. `develop`/`staging` don't exist yet.

File counts by directory:

| Dir | consumer files | admin files | Identical/near-identical config? |
|---|---|---|---|
| `app/` | 34 | 54 | No — see §2 |
| `lib/` | 104 | 105 | No — see §2 |
| `components/` | 129 | 103 | No — see §2 |
| `supabase/migrations/` | — | +8 vs consumer | consumer's set ⊂ admin's set, **zero content diffs** |
| `scripts/` | — | +13 vs consumer | consumer's set ⊂ admin's set, **zero content diffs** |
| `docs/` | 8 unique | 9 unique, 1 differs | mostly independent doc sets |

Root-level config, byte-identical between both apps (confirmed via `diff`,
no output): `.gitignore`, `README.md`, `tsconfig.json`, `eslint.config.mjs`,
`postcss.config.mjs`, `drizzle.config.ts`, `package.json` `scripts` block,
and the `packageManager: pnpm@11.0.9` pin. `vitest.config.ts` differs by one
code comment only.

Root-level config that legitimately differs per app (not a conflict, just
per-app behavior — see §2 for detail): `next.config.ts` (consumer has an
extra redirect), `middleware.ts` (consumer runs broadly for session
refresh; admin is scoped to `/admin` only), `tailwind.config.ts` (admin has
an additional `adm.*` token namespace appended after everything consumer
has — additive, not contradictory).

`pnpm-workspace.yaml` in both apps is **not** a real workspace config —
it's only an `allowBuilds` postinstall-approval list (`sharp`, `esbuild`,
`@swc/core`, etc.), byte-identical in both. Neither app is currently part of
an actual pnpm workspace.

## 2. Conflicting files

Per your list: `package.json`, `pnpm-lock.yaml`, `next.config.ts`,
`tsconfig`, `app/`, `lib/`, `components/`, `supabase/`, `scripts/`, `docs/`.

**The key finding: there are no real move-time conflicts**, because the
target layout puts each app at a distinct path (`apps/consumer/…` vs
`apps/admin/…`) that never overlaps. A "conflict" in the git-merge sense
only arises when two branches touch the *same path* — once each branch's
tree is grafted under its own `apps/<name>/` prefix (see §5), `app/layout.tsx`
becomes two different paths (`apps/consumer/app/layout.tsx` and
`apps/admin/app/layout.tsx`) and there's nothing to merge.

What the audit actually surfaces, then, isn't "conflicts" to resolve — it's
**which same-named files are identical (safe to hoist/share later) vs.
which have diverged (must stay per-app, at least for now)**:

- `package.json`: dependency versions identical everywhere they overlap.
  consumer adds `@phosphor-icons/react`, `framer-motion` (this session's
  landing-page work); admin adds `mammoth`, `pdf-parse`,
  `@types/pdf-parse` (its content-import feature). `scripts` block is
  byte-identical in both — every CI command (`pnpm lint`, `pnpm test`,
  `pnpm typecheck`, `pnpm build`) already means the same thing in both apps.
- `pnpm-lock.yaml`: not diffed directly (too large to diff meaningfully),
  but given identical `package.json` dependency versions and an identical
  `packageManager` pin, there's no version-skew risk in keeping them
  separate. Recommendation in §4 is to keep them separate.
- `next.config.ts` / `tsconfig`: per-app differences are real but small and
  intentional (see §1) — each stays with its app, no reconciliation needed.
- `app/`, `lib/`, `components/`: this is where the two apps' actual product
  code lives, and it's the most interesting audit result — see the
  file-by-file breakdown in §6. Short version: admin is a **full fork** of
  consumer as of the fork point (same route groups — `(app)`,
  `(assessment)`, `(marketing)`, `api/` — same `lib/`/`components/`
  subdirectory names), plus its own CMS surface (`app/admin/`,
  `components/admin/`, `lib/admin/`) layered on top. Both sides have kept
  independently evolving the shared-named files ever since (13 files differ
  under `app/`, 16 under `lib/`, 23 under `components/`) — none of that is
  a move-time conflict, but it does mean the two apps currently run two
  different, drifted copies of the same assessment/scoring/results engine.
  That's a real piece of technical debt this restructure surfaces; it's not
  something to fix as part of the file move (see §6).
- `supabase/`, `scripts/`: the good-news case. consumer's set is a **strict
  subset** of admin's, with **zero content differences** on the shared
  files — admin's migrations/scripts are a forward extension of consumer's,
  not a fork. Nothing to reconcile here.
- `docs/`: two independently-evolved doc sets (KAI_*/PHASE_* on consumer's
  side, ADMIN_*/CMS_*/HYBRID_* on admin's side), plus `docs/deployment/`
  which is **already** the shared/canonical location established earlier
  this session (lives in consumer's checkout today; admin's copy is a
  pointer doc). No conflict — each app's docs move with it; `docs/deployment/`
  stays at the monorepo root (§3).

## 3. Target structure

```
Tareeq/                                    (repo root)
├── .github/workflows/                     (already correct — see §7)
│   ├── _deploy-apprunner.yml
│   ├── deploy-consumer-development.yml
│   ├── deploy-consumer-staging.yml
│   ├── deploy-admin-development.yml
│   └── deploy-admin-staging.yml
├── docs/
│   └── deployment/                        (shared — already the canonical
│       ├── AWS_DEPLOYMENT.md               location, no change needed)
│       ├── iam-trust-policy-github-oidc-{develop,staging}.json
│       └── iam-permissions-policy-{consumer,admin}-{development,staging}.json
├── apps/
│   ├── consumer/                          (today's Tareeq/ root, minus the
│   │   ├── package.json                   items now at the monorepo root)
│   │   ├── pnpm-lock.yaml
│   │   ├── pnpm-workspace.yaml             (keep — it's the allowBuilds list)
│   │   ├── next.config.ts, tsconfig.json, tailwind.config.ts, ...
│   │   ├── Dockerfile, .dockerignore, .env.example
│   │   ├── app/, lib/, components/, supabase/, scripts/, db/, prototype/, public/
│   │   ├── docs/                          (consumer-only docs: KAI_*, PHASE_*, ...)
│   │   └── AGENTS.md, ARCHITECTURE.md, ANALYTICS_INSTRUMENTATION.md, ...
│   └── admin/                             (today's Tareeq-admin/ root)
│       ├── package.json
│       ├── pnpm-lock.yaml
│       ├── pnpm-workspace.yaml
│       ├── next.config.ts, tsconfig.json, tailwind.config.ts, ...
│       ├── Dockerfile, .dockerignore, .env.example
│       ├── app/, lib/, components/, supabase/, scripts/, db/, prototype/, public/
│       ├── .claude/, sample-imports/       (admin-only today — left as-is;
│       ├── docs/                           promoting .claude/ to repo root is
│       └── AGENTS.md, ARCHITECTURE.md, ...  a future option, not required now)
├── .gitignore                             (already identical — use as-is)
├── README.md                              (already identical — update to
│                                            describe the two-app layout,
│                                            point into apps/*/  for detail)
└── MONOREPO_RESTRUCTURE_PLAN.md           (this file)
```

Everything under each `apps/<name>/` is a verbatim move of that app's
current root — no internal path changes inside either app, since all of
their configs (`tsconfig.json` `baseUrl`, relative imports, `.gitignore`
patterns like `prototype/assets/voice/*.wav`) already resolve relative to
the app's own root, not the repo root. The only things that move *out* of
each app's root are the ones already established as shared this session:
`.github/workflows/` (already only lives in consumer's checkout — admin's
was deleted) and `docs/deployment/` (already canonical in consumer's
checkout, with admin's copy a pointer to it).

## 4. Workspace decision: separate `package.json`/lockfile per app, no root pnpm workspace — for now

**Recommendation: do not adopt a pnpm workspace yet.** Keep
`apps/consumer/package.json` + `apps/consumer/pnpm-lock.yaml` and
`apps/admin/package.json` + `apps/admin/pnpm-lock.yaml` fully independent,
exactly as they are today, just relocated.

Why not a workspace right now:

- There is no shared package to link yet. Task 6 explicitly asks to
  *identify* shared-code candidates, not extract them — a workspace's main
  benefit (`workspace:*` linking between internal packages) has nothing to
  attach to until that extraction actually happens.
- The deployment workflows already built this session
  (`_deploy-apprunner.yml` and its four callers) assume **each app directory
  is self-contained**: `working-directory: apps/consumer` /`apps/admin`,
  `cache-dependency-path: ${{ inputs.working-directory }}/pnpm-lock.yaml`,
  and `pnpm install --frozen-lockfile` run from inside that directory. Each
  app's `Dockerfile` also expects to be built with that app's own directory
  as the Docker build context, copying just that app's `package.json` +
  `pnpm-lock.yaml`. A root workspace lockfile would require reworking both
  the workflow and both Dockerfiles (workspace-aware installs need the full
  workspace tree in the build context, not just one app's subdirectory) —
  real, unforced churn on infrastructure that already works.
- No dependency-version conflicts exist between the two apps today (§1) —
  the usual reason to reach for a workspace (resolving version drift) isn't
  a live problem here.

This is a deferral, not a rejection — if/when a real shared package gets
extracted (see §6), that's the natural trigger to introduce
`pnpm-workspace.yaml` with a `packages:` glob at the repo root and convert
both apps' dependency on it to `workspace:*`. Revisit then.

## 5. Migration steps

The mechanism below produces **zero file-content conflicts**, because it
grafts each app's entire tree under its own prefix before anything is
merged — same-named files in each app never collide, since they end up at
different paths.

```bash
# 1. Start from main (== consumer today). Work on a scratch branch — never
#    touch main directly until this is reviewed as its own PR.
cd /Users/thisiswahba/Tareeq
git checkout -b restructure/monorepo main

# 2. Move consumer's own tree under apps/consumer/. Plain `git mv` per top
#    -level item preserves rename history for each file.
mkdir -p apps/consumer
git mv app lib components supabase scripts db prototype public \
       package.json pnpm-lock.yaml pnpm-workspace.yaml \
       next.config.ts tsconfig.json tailwind.config.ts middleware.ts \
       drizzle.config.ts vitest.config.ts eslint.config.mjs postcss.config.mjs \
       Dockerfile .dockerignore .env.example \
       AGENTS.md ARCHITECTURE.md ARCHITECTURE_REVIEW.md CONSUMER_2_ARCHITECTURE.md \
       KAI_*.md PHASE_*.md PROFILE_OVERVIEW_REDESIGN_SUMMARY.md ANALYTICS_INSTRUMENTATION.md \
       docs/screenshots docs/PROJECT_COMPLETION_PLAN.md \
       apps/consumer/
# (leave .gitignore, README.md, .github/, docs/deployment/ at the repo root)
git commit -m "chore: move consumer app under apps/consumer/"

# 3. Graft admin's entire tree under apps/admin/ in one commit, using git's
#    built-in subtree-merge primitive — no extra tooling required, and no
#    history rewrite of admin's branch needed:
git read-tree --prefix=apps/admin/ -u feat/hybrid-assessment
git commit -m "chore: graft admin app under apps/admin/"

# 4. Clean up the one redundant artifact this graft brings in: admin's
#    docs/deployment/AWS_DEPLOYMENT.md is a pointer doc to the copy that's
#    already canonical at the repo root — remove the now-nested duplicate.
git rm apps/admin/docs/deployment/AWS_DEPLOYMENT.md
git commit -m "chore: drop redundant nested deployment pointer doc"

# 5. Sanity checks before opening the PR
cd apps/consumer && pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm test && cd ../..
cd apps/admin    && pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm test && cd ../..
git status   # confirm nothing unexpected, no branches touched besides restructure/monorepo
```

`git read-tree --prefix=<dir>/ -u <branch>` is the same primitive `git
subtree add` wraps — it's the standard, tool-free way to graft one
branch's whole tree into a subdirectory of another without an
`--allow-unrelated-histories` merge or any history rewriting. Per-file
`git log --follow`/blame on admin's files will still resolve back through
`feat/hybrid-assessment`'s history after this.

If preserving *individual-commit* blame across the whole admin history
(so `git log -- apps/admin/lib/scoring/dispatch.ts` shows every commit that
ever touched `lib/scoring/dispatch.ts`, not just "the one graft commit") is
important later, `git filter-repo --to-subdirectory-filter apps/admin` on a
throwaway copy of the `feat/hybrid-assessment` branch, followed by a normal
merge, achieves that — mentioned as an option, not required for step 3.

After step 5 passes locally, open `restructure/monorepo` as its own PR
against `main` for review — do not merge directly.

## 6. Shared-code candidates (identify only — do not extract)

**Already effectively shared, safe to hoist to repo root later if useful:**
`.gitignore`, `README.md`, `tsconfig.json`, `eslint.config.mjs`,
`postcss.config.mjs`, `drizzle.config.ts` — byte-identical today.

**Same name, same purpose, content has diverged — real candidates for a
future shared package, but need reconciliation first, not a mechanical
move:**

- `lib/supabase/{client,server,config,admin,middleware}.ts` — both apps
  hand-roll near-identical Supabase client setup; a `packages/supabase`
  could hold one implementation both apps configure via env, but the two
  copies aren't identical today and would need a diff-and-merge pass first.
- The assessment/scoring/results domain: `lib/assessment/{questions,interstitials}.ts`,
  `lib/scoring/types.ts`, `lib/results/{types,framework,cluster-visuals}.ts`,
  `lib/audio/{kai-narration,use-kai-narration}.ts`, `lib/analytics/events.ts`,
  `lib/profile/journey.ts`, and their `components/assessment/*` and
  `components/home/*` counterparts (`AssessmentChrome`, `QuestionScreen`,
  `ResultsScreen`, `CompassHero`, `FeedCards`, etc.). **This is the most
  significant finding of the audit**: both apps independently maintain a
  full copy of the core assessment engine and UI, and they've drifted —
  most visibly, admin added a more general scoring-dispatch layer
  (`lib/scoring/{dispatch,spec-executor,spec-types}.ts`) that consumer
  doesn't have, while consumer added its own newer pieces (fuzz tests,
  streak/activity/avatar profile features) admin doesn't have. Unifying
  this into one shared implementation is a real, deliberate follow-up
  project — reconciling two independently-evolved implementations of the
  same domain logic — not something to attempt as part of this file move.
  Flagging it here so it's tracked, not attempted today.
- `components/brand/{Kai,CompassProgress,InterstitialScenes,ResultIcons}.tsx`
  — same story at smaller scale: admin's copies predate this session's
  illustration work on consumer's side (`ShareRevealIllustration.tsx`,
  `AvatarMarks.tsx`, `DomainIcons.tsx` exist only in consumer).

**Genuinely app-specific — correctly not shared, no action implied:**
`app/admin/`, `app/api/admin/`, `lib/admin/`, `components/admin/`,
`components/preview/`, `app/dyk-preview/`,
`app/(assessment)/{analyzing,results}-preview/` (admin's CMS/content-authoring
surface); `app/share/`, `app/fonts/`, `lib/i18n/`, `lib/kai/`,
`lib/landing-assets.ts`, `components/i18n/`, `components/kai/`,
`components/landing/`, `components/auth/` (consumer-only features built
this session — share-link, landing-page port, i18n, Kai chat — not missing
from admin due to any error, just not yet ported to that branch).

**Forward-extension, not a fork — no reconciliation needed:**
`supabase/migrations/` and `scripts/` — admin's sets are strict supersets
of consumer's with zero content drift on the shared files.

## 7. Deployment workflow paths

Already correct — no changes needed. `.github/workflows/_deploy-apprunner.yml`
and its four callers (`deploy-{consumer,admin}-{development,staging}.yml`)
already use `working-directory: apps/consumer` / `apps/admin`, path filters
scoped to `apps/consumer/**` / `apps/admin/**`, and per-app
`cache-dependency-path`. They were written against this target layout in
the previous pass; §3 above is exactly the structure they expect. The one
thing to double check once the move actually happens: `pnpm typecheck` /
`pnpm lint` / `pnpm test` in the reusable workflow match the `scripts` block
confirmed identical in §2, so no command changes are needed either.

## Not done, on purpose

No files moved. No branches created. No commits made. No push. No AWS
resources touched. §5's commands are written for you to run (or approve
running) when ready — nothing in this plan executes itself.
