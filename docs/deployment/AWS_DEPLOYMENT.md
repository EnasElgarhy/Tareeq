# Tareeq — AWS App Runner deployment (single repo, two apps)

This is the canonical deployment runbook — one GitHub repo
(`EnasElgarhy/Tareeq`), two independently-deployable apps (`consumer`,
`admin`), each with its own AWS resources. It supersedes the earlier
two-separate-repos draft; if you're reading a copy of this file inside
the `Tareeq-admin` checkout, that copy is a pointer back here — this file
is the one to keep current.

Nothing in this plan has been executed. No AWS resources, IAM roles, ECR
repos, or App Runner services have been created; no Terraform/CloudFormation
was written; no branches were created; nothing has been committed or
pushed. Everything below is either a file already sitting in this repo,
or a command for a human with AWS console/CLI/GitHub access to run, in
the order given.

## Prerequisite: monorepo restructure (not yet done)

Today, `consumer` and `admin` are two full, independent Next.js projects
living on two different **branches** of this one repo
(`feat/bilingual-assessment` and `feat/hybrid-assessment`) — not two
directories on the same branch. The workflows and Dockerfiles prepared
here assume the target layout:

```
/apps/consumer/     (today: root of the feat/bilingual-assessment checkout)
  Dockerfile
  next.config.ts
  app/api/health/route.ts
  package.json, pnpm-lock.yaml, ...
/apps/admin/         (today: root of the feat/hybrid-assessment checkout)
  Dockerfile
  next.config.ts
  app/api/health/route.ts
  package.json, pnpm-lock.yaml, ...
.github/workflows/   (one set, at the repo root — GitHub only ever reads
                       workflows from here, regardless of monorepo layout)
```

Getting from today's state to that layout means merging both branches'
trees into one, with each app's files moved under `apps/<name>/`. That
merge is a real, deliberate step — not attempted here, and it's the thing
"Do not commit" was guarding against this pass. Do it deliberately, once,
probably as its own PR, before cutting `develop`/`staging`.

The app-level prep that already happened in each branch (Dockerfile,
`next.config.ts`'s `output: "standalone"`, `/api/health`) is unaffected
by the move — those files are already correct, they just need to land at
`apps/consumer/...` / `apps/admin/...` instead of the repo root.

## What's already in this repo

| File | Purpose |
|---|---|
| `apps/consumer/Dockerfile`, `apps/admin/Dockerfile` *(currently at each branch's root — see above)* | Multi-stage build → Next.js `standalone` output, non-root user, listens on `$PORT` |
| `apps/*/.dockerignore` | Keeps the build context lean |
| `apps/*/next.config.ts` | `output: "standalone"` |
| `apps/*/app/api/health/route.ts` | App Runner health-check target — no auth, no external calls |
| `.github/workflows/_deploy-apprunner.yml` | Reusable pipeline: lint/typecheck/test → build → push to ECR → trigger App Runner deployment → wait for `RUNNING`. Takes `app`, `environment`, `working-directory` as inputs. |
| `.github/workflows/deploy-consumer-development.yml` | Push to `develop` touching `apps/consumer/**` → deploys tareeq-consumer-development |
| `.github/workflows/deploy-consumer-staging.yml` | Push to `staging` touching `apps/consumer/**` → deploys tareeq-consumer-staging |
| `.github/workflows/deploy-admin-development.yml` | Push to `develop` touching `apps/admin/**` → deploys tareeq-admin-development |
| `.github/workflows/deploy-admin-staging.yml` | Push to `staging` touching `apps/admin/**` → deploys tareeq-admin-staging |
| `docs/deployment/iam-trust-policy-github-oidc-{develop,staging}.json` | Who may assume a deploy role — **shared** by both apps within an environment, since it's one repo/branch. Real repo name, no placeholders. |
| `docs/deployment/iam-permissions-policy-{consumer,admin}-{development,staging}.json` | What each app's role can do — **not** shared; each is scoped to exactly one ECR repo and one App Runner service |

Path filters on the four trigger workflows mean a push that only touches
`apps/admin/**` never rebuilds/redeploys `consumer`, and vice versa —
despite sharing one `develop`/`staging` branch.

## AWS resources (account `403141583896`, region `eu-north-1`) — kept fully separate per app

| App | ECR repo | App Runner service (development) | App Runner service (staging) |
|---|---|---|---|
| consumer | `tareeq-consumer` | `tareeq-consumer-development` | `tareeq-consumer-staging` |
| admin | `tareeq-admin` | `tareeq-admin-development` | `tareeq-admin-staging` |

## Sequencing (per your instructions — dev first, staging only after dev is verified)

1. **Monorepo restructure** (above) — merge both branches' app code under
   `apps/consumer/` and `apps/admin/` on `main`.
2. **Create `develop` and `staging` from `main`**, once the restructure has
   landed on `main`:
   ```bash
   git checkout -b develop main && git push -u origin develop
   git checkout -b staging main && git push -u origin staging
   ```
3. **One-time AWS setup** (section below) — for **development only** first:
   OIDC provider, both ECR repos, the two `*-development` IAM roles, both
   `*-development` App Runner services.
4. **One-time GitHub setup** (section below) — for the two `*-development`
   Environments only.
5. **Push to `develop`** → verify both `deploy-consumer-development` and
   `deploy-admin-development` succeed and both services report `RUNNING`.
6. **Only once development is verified**, repeat steps 3–5 for `staging`
   (staging IAM roles, staging App Runner services, staging GitHub
   Environments, push to `staging`).
7. `main` → production is explicitly future work; no roles, services, or
   workflows target it yet.

## One-time AWS setup

Run as whoever has AWS console/CLI access — not run as part of this prep.
Commands below cover one app/environment; repeat for the other three
combinations (swap `consumer`→`admin`, `development`→`staging`).

### a. GitHub OIDC provider (shared by all four roles — create once)

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### b. ECR repositories (one per app, not per environment)

```bash
aws ecr create-repository --repository-name tareeq-consumer --region eu-north-1 --image-scanning-configuration scanOnPush=true
aws ecr create-repository --repository-name tareeq-admin    --region eu-north-1 --image-scanning-configuration scanOnPush=true
```

### c. IAM roles — one per app **and** environment (four total)

```bash
aws iam create-role \
  --role-name tareeq-consumer-development-deploy \
  --assume-role-policy-document file://docs/deployment/iam-trust-policy-github-oidc-develop.json

aws iam put-role-policy \
  --role-name tareeq-consumer-development-deploy \
  --policy-name deploy-permissions \
  --policy-document file://docs/deployment/iam-permissions-policy-consumer-development.json
```

Repeat with `tareeq-admin-development-deploy` +
`iam-permissions-policy-admin-development.json` (same trust policy —
`iam-trust-policy-github-oidc-develop.json` — since it's the same repo and
branch). Then both `*-staging-deploy` roles against
`iam-trust-policy-github-oidc-staging.json` once you reach step 6 above.

### d. App Runner services — one per app and environment (four total)

Create via console (Services → Create service → Container registry →
Amazon ECR → point at `tareeq-consumer:development` /
`tareeq-admin:development` / etc.) so you can set:

- **Health check**: path `/api/health`, protocol HTTP
- **Port**: `3000`
- **Environment variables / secrets** — everything in that app's
  `.env.example` *except* `NEXT_PUBLIC_SUPABASE_URL`/
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (those are baked into the image at
  build time — see the Dockerfile comment). Use a Secrets Manager
  reference for `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`,
  `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`, and admin's `DATABASE_URL` —
  never plain env vars for these.
- **Auto deployments**: can be left off — the GitHub Actions workflow
  calls `apprunner start-deployment` explicitly after every push.

After creation, copy each service's ARN into that environment's
`APP_RUNNER_SERVICE_ARN` GitHub variable (below), and narrow that app's
`iam-permissions-policy-*.json` App Runner `Resource` from the `/*`
wildcard to the exact ARN.

## One-time GitHub setup

Repo → Settings → Environments → create four: `consumer-development`,
`consumer-staging`, `admin-development`, `admin-staging`. (Four, not two
— GitHub Environment secrets/variables aren't namespaced per app, so
sharing "development"/"staging" between both apps would mean both apps'
role ARNs and ECR repo names living side-by-side under ambiguous names in
the same environment. The app prefix avoids that collision; it doesn't
change the AWS-side environment names, which stay `development`/`staging`
as specified.)

For each, add:

| Kind | Name | Value |
|---|---|---|
| Secret | `AWS_ROLE_ARN` | that app+environment's role ARN from step (c) |
| Secret | `NEXT_PUBLIC_SUPABASE_URL` | that app+environment's Supabase project URL |
| Secret | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | that app+environment's Supabase anon key |
| Variable | `AWS_REGION` | `eu-north-1` |
| Variable | `ECR_REPOSITORY` | `tareeq-consumer` or `tareeq-admin` |
| Variable | `APP_RUNNER_SERVICE_ARN` | that app+environment's service ARN from step (d) |

## Runtime environment variables (App Runner service config, not GitHub)

**consumer** (`apps/consumer/.env.example`):
```
SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY, ANTHROPIC_MODEL,
ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, ELEVENLABS_VOICE_ID_AR, ELEVENLABS_MODEL_ID,
GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_REGION, GOOGLE_OAUTH_ACCESS_TOKEN,
TAREEQ_AUDIO_LOCALE, NOUR_SPEAKER_WAV
```

**admin** (`apps/admin/.env.example`):
```
SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, RESULTS_PROVIDER, GEMINI_API_KEY,
GEMINI_MODEL, ANTHROPIC_API_KEY, ANTHROPIC_MODEL, ELEVENLABS_API_KEY,
ELEVENLABS_MODEL_ID, GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_REGION,
GOOGLE_OAUTH_ACCESS_TOKEN, TAREEQ_AUDIO_LOCALE, NOUR_SPEAKER_WAV
```

Admin's `DATABASE_URL` should be the Supabase **pooler** connection
string — this runs in a serverless-style container, not a long-lived box
holding its own connection pool.

## Verifying each Dockerfile locally (before relying on it in CI)

Docker Desktop wasn't running when this was prepared, so these builds
were written but not executed — run them yourself before the first real
deploy:

```bash
cd apps/consumer
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
  -t tareeq-consumer:local .
docker run -p 3000:3000 --env-file .env.local tareeq-consumer:local
curl http://localhost:3000/api/health
```

(repeat under `apps/admin` for that app.)

## Rollback

App Runner keeps prior image tags in ECR. To roll back, either:

- Re-run the relevant GitHub Actions workflow from the previous commit, or
- `aws apprunner start-deployment` after re-pointing the service at a
  previous `development-<sha>` / `staging-<sha>` image tag in the console.
