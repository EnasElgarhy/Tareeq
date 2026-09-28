# Tareeq — AWS App Runner deployment plan (historical)

> [!WARNING]
> This document is retained as a future/legacy deployment design. It is not the
> current staging runbook. Staging currently runs as Docker Compose services on
> an AWS EC2 virtual machine behind Caddy, with manually approved releases.
> See the root [`README.md`](../../README.md#deployment) and
> [`SYSTEM_ARCHITECTURE.md`](../architecture/SYSTEM_ARCHITECTURE.md#13-runtime-and-deployment)
> for the implemented topology.

This is the canonical deployment runbook — one GitHub repo
(`EnasElgarhy/Tareeq`), two independently-deployable apps (`consumer`,
`admin`), each with its own AWS resources. It supersedes the earlier
two-separate-repos draft; if you're reading a copy of this file inside
the `Tareeq-admin` checkout, that copy is a pointer back here — this file
is the one to keep current.

Two environments: **staging** (branch `staging`) and **production**
(branch `main`). There is no `development` tier.

Nothing in this plan has been executed. No AWS resources, IAM roles, ECR
repos, or App Runner services have been created; no Terraform/CloudFormation
was written; no `staging` branch has been created yet. Everything below is
either a file already sitting in this repo, or a command for a human with
AWS console/CLI/GitHub access to run, in the order given.

## Monorepo restructure

Done — `consumer` and `admin` now live at `apps/consumer/` and `apps/admin/`
on the `restructure/monorepo` branch (see `MONOREPO_RESTRUCTURE_PLAN.md`),
pending review and merge into `main`.

```
apps/consumer/     Dockerfile, next.config.ts, app/api/health/route.ts, ...
apps/admin/         Dockerfile, next.config.ts, app/api/health/route.ts, ...
.github/workflows/  (repo root — GitHub only ever reads workflows from here)
docs/deployment/    (repo root — this file, IAM policy JSON)
```

## What's already in this repo

| File                                                                                | Purpose                                                                                                                                                                       |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/consumer/Dockerfile`, `apps/admin/Dockerfile`                                 | Multi-stage build → Next.js `standalone` output, non-root user, listens on `$PORT`                                                                                            |
| `apps/*/.dockerignore`                                                              | Keeps the build context lean                                                                                                                                                  |
| `apps/*/next.config.ts`                                                             | `output: "standalone"`                                                                                                                                                        |
| `apps/*/app/api/health/route.ts`                                                    | App Runner health-check target — no auth, no external calls                                                                                                                   |
| `.github/workflows/_deploy-apprunner.yml`                                           | Reusable pipeline: lint/typecheck/test → build → push to ECR → trigger App Runner deployment → wait for `RUNNING`. Takes `app`, `environment`, `working-directory` as inputs. |
| `.github/workflows/deploy-consumer-staging.yml`                                     | Push to `staging` touching `apps/consumer/**` → deploys tareeq-consumer-staging                                                                                               |
| `.github/workflows/deploy-admin-staging.yml`                                        | Push to `staging` touching `apps/admin/**` → deploys tareeq-admin-staging                                                                                                     |
| `.github/workflows/deploy-consumer-production.yml`                                  | Push to `main` touching `apps/consumer/**` → deploys tareeq-consumer-production                                                                                               |
| `.github/workflows/deploy-admin-production.yml`                                     | Push to `main` touching `apps/admin/**` → deploys tareeq-admin-production                                                                                                     |
| `docs/deployment/iam-trust-policy-github-oidc-{staging,main}.json`                  | Who may assume a deploy role — **shared** by both apps within an environment, since it's one repo/branch. Real repo name, no placeholders.                                    |
| `docs/deployment/iam-permissions-policy-{consumer,admin}-{staging,production}.json` | What each app's role can do — **not** shared; each is scoped to exactly one ECR repo and one App Runner service                                                               |

Path filters on the four trigger workflows mean a push that only touches
`apps/admin/**` never rebuilds/redeploys `consumer`, and vice versa —
despite sharing one `staging`/`main` branch.

## AWS resources (account `403141583896`, region `eu-north-1`) — kept fully separate per app

| App      | ECR repo          | App Runner service (staging) | App Runner service (production) |
| -------- | ----------------- | ---------------------------- | ------------------------------- |
| consumer | `tareeq-consumer` | `tareeq-consumer-staging`    | `tareeq-consumer-production`    |
| admin    | `tareeq-admin`    | `tareeq-admin-staging`       | `tareeq-admin-production`       |

## Sequencing (staging first, production only after staging is verified)

1. **Merge `restructure/monorepo` into `main`** (as its own reviewed PR — see
   `MONOREPO_RESTRUCTURE_PLAN.md`).
2. **Create `staging` from `main`**, once the restructure has landed:
   ```bash
   git checkout -b staging main && git push -u origin staging
   ```
3. **One-time AWS setup** (section below) — for **staging only** first:
   OIDC provider, both ECR repos, the two `*-staging` IAM roles, both
   `*-staging` App Runner services.
4. **One-time GitHub setup** (section below) — for the two `*-staging`
   Environments only.
5. **Push to `staging`** → verify both `deploy-consumer-staging` and
   `deploy-admin-staging` succeed and both services report `RUNNING`.
6. **Only once staging is verified**, repeat steps 3–5 for **production**
   (production IAM roles, production App Runner services, production GitHub
   Environments, push to `main`).

## One-time AWS setup

Run as whoever has AWS console/CLI access — not run as part of this prep.
Commands below cover one app/environment; repeat for the other three
combinations (swap `consumer`→`admin`, `staging`→`production`).

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
  --role-name tareeq-consumer-staging-deploy \
  --assume-role-policy-document file://docs/deployment/iam-trust-policy-github-oidc-staging.json

aws iam put-role-policy \
  --role-name tareeq-consumer-staging-deploy \
  --policy-name deploy-permissions \
  --policy-document file://docs/deployment/iam-permissions-policy-consumer-staging.json
```

Repeat with `tareeq-admin-staging-deploy` +
`iam-permissions-policy-admin-staging.json` (same trust policy —
`iam-trust-policy-github-oidc-staging.json` — since it's the same repo and
branch). Then both `*-production-deploy` roles against
`iam-trust-policy-github-oidc-main.json` once you reach production.

### d. App Runner services — one per app and environment (four total)

Create via console (Services → Create service → Container registry →
Amazon ECR → point at `tareeq-consumer:staging` /
`tareeq-admin:staging` / etc.) so you can set:

- **Health check**: path `/api/health`, protocol HTTP
- **Port**: `3000`
- **Environment variables / secrets** — everything in that app's
  `.env.example` _except_ `NEXT_PUBLIC_SUPABASE_URL`/
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

Repo → Settings → Environments → create four: `consumer-staging`,
`consumer-production`, `admin-staging`, `admin-production`. (Four, not two
— GitHub Environment secrets/variables aren't namespaced per app, so
sharing "staging"/"production" between both apps would mean both apps'
role ARNs and ECR repo names living side-by-side under ambiguous names in
the same environment. The app prefix avoids that collision; it doesn't
change the AWS-side environment names, which stay `staging`/`production`
as specified.)

For each, add:

| Kind     | Name                            | Value                                            |
| -------- | ------------------------------- | ------------------------------------------------ |
| Secret   | `AWS_ROLE_ARN`                  | that app+environment's role ARN from step (c)    |
| Secret   | `NEXT_PUBLIC_SUPABASE_URL`      | that app+environment's Supabase project URL      |
| Secret   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | that app+environment's Supabase anon key         |
| Variable | `AWS_REGION`                    | `eu-north-1`                                     |
| Variable | `ECR_REPOSITORY`                | `tareeq-consumer` or `tareeq-admin`              |
| Variable | `APP_RUNNER_SERVICE_ARN`        | that app+environment's service ARN from step (d) |

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
  previous `staging-<sha>` / `production-<sha>` image tag in the console.
