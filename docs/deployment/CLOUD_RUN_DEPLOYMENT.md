# Tareeq — Temporary Google Cloud Run staging deployment

This is a **temporary** staging setup for both Tareeq apps, to be used only
until the client provisions an AWS account (see
[AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) for the target long-term plan).
Everything here is designed to be thrown away without regret: one project,
one environment ("staging"), minimal resources, and Docker images that stay
byte-for-byte portable to AWS App Runner (same Dockerfiles, same
`output: "standalone"`, same `/api/health`, same `$PORT` contract — nothing
GCP-specific is baked into the images themselves).

Nothing in this plan has been executed. No GCP project, Artifact Registry
repo, Cloud Run service, or Secret Manager secret has been created; no
GitHub Environments or Workload Identity Federation pool exists yet; nothing
has been committed or pushed. Everything below is either a file already
sitting in this repo, or a command for a human with `gcloud`/GitHub access
to run, in the order given.

## Why this differs from the AWS plan's repo layout

[AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) is written for a **future** monorepo
layout (`apps/consumer/`, `apps/admin/` on one branch) that hasn't been
executed yet — today, the two apps are two branches of the same GitHub repo
(`EnasElgarhy/Tareeq`):

| App | Branch | Local checkout |
|---|---|---|
| consumer | `feat/bilingual-assessment` | `/Users/thisiswahba/Tareeq` |
| admin | `feat/hybrid-assessment` | `/Users/thisiswahba/Tareeq-admin` |

Since this Cloud Run setup is explicitly temporary and needs to work *now*,
it targets **today's actual layout** — each app's Dockerfile/workflow lives
at its own branch root, not under `apps/<name>/`. If the monorepo restructure
happens later, update the `working-directory` / path-filter values called
out below; nothing else changes.

## 1. Cloud Run compatibility audit

Both apps were already prepared for App Runner, and everything that setup
required is **also** exactly what Cloud Run requires — no app code changed
for this doc:

| Requirement | Consumer | Admin | Notes |
|---|---|---|---|
| `next.config.ts`: `output: "standalone"` | ✅ already set | ✅ already set | Self-contained server bundle, no full `node_modules` in the image |
| Multi-stage `Dockerfile` | ✅ already exists | ✅ already exists | `deps → builder → runner`, non-root user, `node server.js` |
| `.dockerignore` | ✅ already exists | ✅ already exists | Excludes `node_modules`, `.next`, `.git`, `.env*`, etc. |
| `/api/health` | ✅ already exists | ✅ already exists | No auth, no external calls — exactly what Cloud Run's health check needs |
| Listens on `$PORT` | ✅ | ✅ | See below |

**On `$PORT`:** both Dockerfiles hardcode `ENV PORT=3000` as a default (for
platforms like App Runner where you configure the exposed port separately).
Cloud Run **overrides** any `ENV PORT` set in the image at container start —
it injects its own `PORT` (default `8080`) into the running container's
environment, and Next.js's standalone `server.js` reads `process.env.PORT`
at runtime, not build time. So the existing Dockerfiles work on Cloud Run
**unmodified**: Cloud Run's injected value wins, Next.js binds to it, done.
(Verified by reasoning through the Docker `ENV` vs. platform-injected env var
precedence — confirm with a real `gcloud run deploy` before relying on it.)

**Conclusion: no Dockerfile, `.dockerignore`, `next.config.ts`, or
`/api/health` changes were needed.** This doc only adds new
deployment-plumbing files (GitHub Actions workflows, this runbook) — it
doesn't touch app code.

## 2. GCP resources this plan creates (all in one project, one region)

Pick one project and region up front — recommended: an existing sandbox/dev
GCP project if one exists, region `us-central1` (cheapest, most quota
headroom) unless data residency requires otherwise (e.g. `europe-west1` to
sit closer to the `eu-north-1` Supabase/AWS region already in use).

| Resource | Name | Purpose |
|---|---|---|
| Artifact Registry repo (Docker) | `tareeq` | Holds both images — `consumer` and `admin` as separate image names within one repo, not two repos. Simpler footprint for a temporary setup; split into two repos later if preferred. |
| Cloud Run service | `tareeq-consumer-staging` | Consumer app |
| Cloud Run service | `tareeq-admin-staging` | Admin app |
| Secret Manager secrets | `tareeq-consumer-*`, `tareeq-admin-*` | One secret per server-only credential, see §4 |
| Workload Identity Federation pool | `github-actions-pool` | Lets GitHub Actions authenticate as a GCP service account with no JSON key |
| Service account | `tareeq-deployer@<project>.iam.gserviceaccount.com` | What both deploy workflows act as |

## 3. One-time GCP setup

Run these as whoever has `gcloud` access with project-owner/editor rights —
not run as part of this prep.

```bash
export PROJECT_ID="<your-gcp-project-id>"
export REGION="us-central1"

gcloud config set project "$PROJECT_ID"

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com \
  cloudbuild.googleapis.com
```

### 3a. Artifact Registry repository (one, holds both images)

```bash
gcloud artifacts repositories create tareeq \
  --repository-format=docker \
  --location="$REGION" \
  --description="Tareeq consumer + admin — temporary GCP staging"
```

Resulting image paths:
```
$REGION-docker.pkg.dev/$PROJECT_ID/tareeq/consumer:staging-<sha>
$REGION-docker.pkg.dev/$PROJECT_ID/tareeq/admin:staging-<sha>
```

### 3b. Service account for deploys

```bash
gcloud iam service-accounts create tareeq-deployer \
  --display-name="Tareeq GitHub Actions deployer (temporary GCP staging)"

export SA_EMAIL="tareeq-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

# Push images to Artifact Registry
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

# Deploy to Cloud Run + act as the runtime service account
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.developer"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

# Read secrets at deploy time (Cloud Run mounts them; the deployer needs
# accessor rights to reference them in `gcloud run deploy --set-secrets`)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"
```

### 3c. Workload Identity Federation — no long-lived JSON keys

```bash
# 1. Create the pool
gcloud iam workload-identity-pools create github-actions-pool \
  --location="global" \
  --display-name="GitHub Actions (Tareeq)"

# 2. Create the OIDC provider inside it, scoped to this exact repo
gcloud iam workload-identity-pools providers create-oidc github-actions-provider \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository == 'EnasElgarhy/Tareeq'"

# 3. Allow that provider to impersonate the deployer service account —
#    scoped to the two specific branches this temporary setup deploys from
export PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")

gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/EnasElgarhy/Tareeq"
```

The `attribute-condition` above already restricts tokens to this one repo;
the binding is left repo-wide (not branch-scoped) because consumer and admin
deploy from two *different* branches (`feat/bilingual-assessment` /
`feat/hybrid-assessment`) and Workload Identity Federation's attribute
conditions don't cleanly express "either of these two refs." If tighter
scoping matters before this goes live, narrow it with a `google.subject`
condition per branch, or split into two service accounts.

Get the provider's full resource name for the GitHub workflow secrets:
```bash
gcloud iam workload-identity-pools providers describe github-actions-provider \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --format="value(name)"
# → projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider
```

## 4. Secret Manager — server-only secrets (never exposed to the browser)

**Rule: anything without a `NEXT_PUBLIC_` prefix is a server-only secret and
must go in Secret Manager, referenced by Cloud Run at runtime — never a
plain env var, never baked into the image.** `NEXT_PUBLIC_*` vars are the
opposite: Next.js inlines them into the client JS bundle at *build* time, so
they're passed as Docker `--build-arg`s (same as the existing App Runner
setup) and are not secret by definition — treat them as public config, not
credentials.

### Create the secrets (values come from each app's real `.env.local` — never commit these)

```bash
# Shared by both apps
echo -n "<value>" | gcloud secrets create tareeq-supabase-service-role-key --data-file=-
echo -n "<value>" | gcloud secrets create tareeq-gemini-api-key --data-file=-
echo -n "<value>" | gcloud secrets create tareeq-anthropic-api-key --data-file=-
echo -n "<value>" | gcloud secrets create tareeq-elevenlabs-api-key --data-file=-

# Admin only
echo -n "<value>" | gcloud secrets create tareeq-admin-database-url --data-file=-

# Grant the deployer read access to each (repeat per secret)
for SECRET in tareeq-supabase-service-role-key tareeq-gemini-api-key \
              tareeq-anthropic-api-key tareeq-elevenlabs-api-key \
              tareeq-admin-database-url; do
  gcloud secrets add-iam-policy-binding "$SECRET" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor"
done
```

To update a secret value later (rotation), add a new version rather than
recreating it — Cloud Run references `secret:latest` by default:
```bash
echo -n "<new-value>" | gcloud secrets versions add tareeq-supabase-service-role-key --data-file=-
```

### 4a. Public build-time vars (`NEXT_PUBLIC_*`) — passed as build args, not secrets

| Var | Consumer | Admin |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ |

Store these as **GitHub Environment secrets** (not GCP Secret Manager — they
never touch GCP at all, they're consumed entirely within the GitHub Actions
build step as Docker `--build-arg`s). "Secret" here just means "don't put it
in a public workflow file"; the anon key is safe to ship in a client bundle
by Supabase design (RLS enforces access control, not key secrecy).

### 4b. Server-only secrets (Secret Manager, mounted at Cloud Run runtime)

**consumer:**
```
SUPABASE_SERVICE_ROLE_KEY   → tareeq-supabase-service-role-key
GEMINI_API_KEY               → tareeq-gemini-api-key
ANTHROPIC_API_KEY            → tareeq-anthropic-api-key
ELEVENLABS_API_KEY           → tareeq-elevenlabs-api-key
```

**admin:**
```
SUPABASE_SERVICE_ROLE_KEY   → tareeq-supabase-service-role-key   (shared secret)
GEMINI_API_KEY               → tareeq-gemini-api-key              (shared secret)
ANTHROPIC_API_KEY            → tareeq-anthropic-api-key           (shared secret)
ELEVENLABS_API_KEY           → tareeq-elevenlabs-api-key          (shared secret)
DATABASE_URL                 → tareeq-admin-database-url
```

Admin's `DATABASE_URL` must be the Supabase **pooler** connection string
(`...pooler.supabase.com:6543/postgres`), not the direct connection — Cloud
Run containers are ephemeral/scale-to-zero, not a long-lived box holding its
own connection pool.

### 4c. Plain (non-secret) runtime env vars — set directly on the Cloud Run service, not Secret Manager

These have no confidentiality requirement, so setting them as plain
`--set-env-vars` is fine and keeps Secret Manager reserved for actual
credentials:

```
ANTHROPIC_MODEL=claude-sonnet-4-20250514
ELEVENLABS_VOICE_ID=ZF6FPAbjXT4488VcRRnw
ELEVENLABS_VOICE_ID_AR=KxMRrXEjbJ6kZ93yT3fq   # consumer only
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
GOOGLE_CLOUD_PROJECT=<your-gcp-project-id>
GOOGLE_CLOUD_REGION=global
TAREEQ_AUDIO_LOCALE=en
RESULTS_PROVIDER=gemini                       # admin only
GEMINI_MODEL=gemini-2.5-flash                 # admin only
```

Leave `GOOGLE_OAUTH_ACCESS_TOKEN` and `NOUR_SPEAKER_WAV` unset for staging
unless a specific test needs them (both are optional/feature-gated in the
app code).

## 5. Cloud Run services

### Resource configuration (both services — request-based billing)

| Setting | Value | Why |
|---|---|---|
| CPU | 1 vCPU | Enough for SSR + API routes; Next.js isn't CPU-bound at this traffic level |
| Memory | 512 MiB | Standalone Next.js server typically runs 150–300 MiB idle; 512 MiB leaves headroom for AI/audio response buffering without over-provisioning |
| Min instances | 0 | **Request-based billing** — you pay only while a request is being served, nothing at idle. This is the whole point of a temporary/stopgap setup. |
| Max instances | 2 | Caps cost exposure during a traffic spike or a runaway loop; raise later if load testing shows it's too low |
| Concurrency | 40 | Cloud Run defaults to 80; Next.js SSR + API routes calling external AI/TTS APIs hold the request open longer than a typical static response, so a lower concurrency per instance avoids one instance queuing too many slow upstream calls at once. 40 is a reasonable starting point — tune via Cloud Run's request latency metrics, not guesswork. |
| Request timeout | 60s (consumer), 120s (admin) | Admin's `/api/results/generate` calls an LLM and can legitimately take longer than the consumer app's typical request |
| Health check | `GET /api/health`, HTTP, no auth | Already correct in both apps |
| Port | `8080` (Cloud Run default — do **not** override; see §1) | |

### Deploy commands (what the GitHub Actions workflow runs — see §6)

```bash
# consumer
gcloud run deploy tareeq-consumer-staging \
  --image="$REGION-docker.pkg.dev/$PROJECT_ID/tareeq/consumer:staging-latest" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=2 \
  --concurrency=40 \
  --timeout=60 \
  --set-env-vars="ANTHROPIC_MODEL=claude-sonnet-4-20250514,ELEVENLABS_VOICE_ID=ZF6FPAbjXT4488VcRRnw,ELEVENLABS_VOICE_ID_AR=KxMRrXEjbJ6kZ93yT3fq,ELEVENLABS_MODEL_ID=eleven_multilingual_v2,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_REGION=global,TAREEQ_AUDIO_LOCALE=en" \
  --set-secrets="SUPABASE_SERVICE_ROLE_KEY=tareeq-supabase-service-role-key:latest,GEMINI_API_KEY=tareeq-gemini-api-key:latest,ANTHROPIC_API_KEY=tareeq-anthropic-api-key:latest,ELEVENLABS_API_KEY=tareeq-elevenlabs-api-key:latest"

# admin
gcloud run deploy tareeq-admin-staging \
  --image="$REGION-docker.pkg.dev/$PROJECT_ID/tareeq/admin:staging-latest" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=2 \
  --concurrency=40 \
  --timeout=120 \
  --set-env-vars="ANTHROPIC_MODEL=claude-sonnet-4-20250514,ELEVENLABS_VOICE_ID=ZF6FPAbjXT4488VcRRnw,ELEVENLABS_MODEL_ID=eleven_multilingual_v2,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_REGION=global,TAREEQ_AUDIO_LOCALE=en,RESULTS_PROVIDER=gemini,GEMINI_MODEL=gemini-2.5-flash" \
  --set-secrets="SUPABASE_SERVICE_ROLE_KEY=tareeq-supabase-service-role-key:latest,GEMINI_API_KEY=tareeq-gemini-api-key:latest,ANTHROPIC_API_KEY=tareeq-anthropic-api-key:latest,ELEVENLABS_API_KEY=tareeq-elevenlabs-api-key:latest,DATABASE_URL=tareeq-admin-database-url:latest"
```

`--allow-unauthenticated` is required for a public-facing app (Cloud Run
defaults to requiring IAM auth on every request otherwise) — this is a
staging environment for a public consumer app and its admin console, not an
internal-only service, so this is intentional, not a shortcut. Restrict
admin further with Cloud Run's built-in IAP or an IP allowlist if the client
wants the admin console gated during staging (not configured here — flag if
needed).

### Custom domains (optional — Cloud Run gives you a working `*.run.app` URL immediately without this)

```bash
gcloud run domain-mappings create \
  --service=tareeq-consumer-staging \
  --domain=staging.tareeq.io \
  --region="$REGION"

gcloud run domain-mappings create \
  --service=tareeq-admin-staging \
  --domain=admin-staging.tareeq.io \
  --region="$REGION"
```

This prints a set of DNS records (usually a `CNAME` to `ghs.googlehosted.com`
or four `A`/`AAAA` records) to add at whatever DNS provider hosts
`tareeq.io`. Per earlier conversation, the domain isn't connected anywhere
yet — skip this section entirely until that changes; both services work
fine on their default `https://tareeq-consumer-staging-<hash>-<region>.a.run.app`
URLs in the meantime.

## 6. GitHub Actions — Workload Identity Federation, no JSON keys

Two new workflow files (this repo's existing `.github/workflows/*.yml` are
the AWS App Runner pipeline — untouched, left in place, will resume mattering
once the client's AWS account exists):

- `Tareeq/.github/workflows/deploy-cloudrun-consumer.yml` (this checkout,
  branch `feat/bilingual-assessment`)
- `Tareeq-admin/.github/workflows/deploy-cloudrun-admin.yml` (the admin
  checkout, branch `feat/hybrid-assessment` — this branch has no
  `.github/workflows/` at all today; the file is new, not a modification)

Both use [`google-github-actions/auth`](https://github.com/google-github-actions/auth)
with `workload_identity_provider` — this exchanges the job's short-lived
OIDC token for temporary GCP credentials; no service-account JSON key ever
touches a GitHub secret.

### Required GitHub Environment (one, `staging`, in each workflow's repo)

Repo → Settings → Environments → create `staging`. Add:

| Kind | Name | Value |
|---|---|---|
| Secret | `NEXT_PUBLIC_SUPABASE_URL` | project's Supabase URL |
| Secret | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | project's Supabase anon key |
| Variable | `GCP_PROJECT_ID` | your GCP project id |
| Variable | `GCP_REGION` | `us-central1` (or whatever you picked in §2) |
| Variable | `WORKLOAD_IDENTITY_PROVIDER` | full resource name from §3c |
| Variable | `DEPLOYER_SA_EMAIL` | `tareeq-deployer@<project>.iam.gserviceaccount.com` |

See §7 for the actual workflow YAML.

## 7. Smoke tests

`scripts/smoke-test-cloudrun.sh` (in this repo) hits both apps' deployed
URLs and checks:

1. `GET /api/health` → `200` with no auth
2. Consumer homepage (`/`) → `200`, HTML contains `<html`
3. Admin login page (`/admin/login`) → `200`
4. Supabase connectivity — indirectly, via `/api/health` succeeding (it
   deliberately makes *no* external calls, so this alone doesn't prove
   Supabase is reachable) **and** directly, via a lightweight authenticated
   check described in the script comments (hits an endpoint that touches
   Supabase and expects a structured JSON response, not a 500)
5. Kai chat (`POST /api/kai/chat`, consumer only) → non-5xx (a 4xx for a
   deliberately incomplete body still proves the route executed)
6. Analytics ingestion (`POST /api/analytics/ingest`, both apps) → non-5xx

Run after each deploy:
```bash
./scripts/smoke-test-cloudrun.sh --app consumer --url https://tareeq-consumer-staging-<hash>-<region>.a.run.app
./scripts/smoke-test-cloudrun.sh --app admin --url https://tareeq-admin-staging-<hash>-<region>.a.run.app
```

The GitHub Actions workflows (§6) call this script automatically after
`gcloud run deploy` and fail the job if any check fails.

## 8. Known limitations of this temporary setup

- **Cold starts**: with `min-instances=0`, the first request after an idle
  period pays full container start time — for a Next.js standalone server
  this is typically 1–3s, plus Cloud Run's own routing overhead. Acceptable
  for a staging/demo environment; not acceptable for the eventual production
  SLA. Raise `min-instances` to `1` per service if cold starts become
  disruptive during a client demo — that moves billing from purely
  request-based to "always one warm instance," a real cost tradeoff worth
  flagging before doing it.
- **Free tier**: Cloud Run's free tier (2M requests, 360k GiB-seconds, 180k
  vCPU-seconds/month) comfortably covers a low-traffic staging environment
  with `min-instances=0`, but Secret Manager (free up to 6 active secret
  versions + 10k access operations/month), Artifact Registry (0.5 GiB free
  storage), and network egress are billed separately once past their own
  free thresholds — unlikely to matter for a temporary staging setup, worth
  a glance at the billing dashboard after the first week regardless.
- **Artifact Registry storage grows unbounded** unless cleaned up — every
  push creates a new `staging-<sha>` tag and nothing deletes old ones
  automatically. See §9.
- **Both apps currently share one Supabase project** with **no environment
  separation** between whatever's already using it (local dev, this
  session's manual testing) and this new staging deployment — same
  database, same auth users, same storage buckets. Fine for a temporary
  internal staging pass; flag to the client before using this for anything
  they'll actually look at, since local dev work and staging traffic will be
  mixed in the same tables.
- **No CDN/caching layer** — Cloud Run serves Next.js directly; static
  assets aren't fronted by a CDN the way a `next start` + Vercel or a
  proper CloudFront/Cloud CDN setup would. Fine for staging, not for
  production traffic.
- **Custom domain not configured** (§5) — no domain is connected yet per
  earlier conversation; both apps are reachable only via their default
  `*.run.app` URLs until that changes.
- **Admin console is `--allow-unauthenticated`** (§5) — anyone with the URL
  can reach the login page (though still can't get past Supabase auth
  without real credentials). Flag to the client if IP-allowlisting or IAP
  is wanted for staging.

## 9. Artifact Registry cleanup

Nothing prunes old image tags automatically. Add a cleanup policy so
storage (and its associated cost) doesn't grow forever:

```bash
gcloud artifacts repositories set-cleanup-policies tareeq \
  --location="$REGION" \
  --policy=- <<'EOF'
[
  {
    "name": "keep-last-10-per-image",
    "action": {"type": "Keep"},
    "mostRecentVersions": {
      "keepCount": 10
    }
  },
  {
    "name": "delete-older-than-30-days",
    "action": {"type": "Delete"},
    "condition": {
      "olderThan": "30d",
      "tagState": "ANY"
    }
  }
]
EOF
```

This keeps the 10 most recent versions of each image regardless of age, and
deletes anything else older than 30 days — adjust both numbers based on how
often you actually redeploy during the AWS-account wait.

Manual one-off cleanup:
```bash
gcloud artifacts docker images list "$REGION-docker.pkg.dev/$PROJECT_ID/tareeq" \
  --include-tags --format="table(IMAGE,TAGS,CREATE_TIME)"

gcloud artifacts docker images delete \
  "$REGION-docker.pkg.dev/$PROJECT_ID/tareeq/consumer:staging-<old-sha>" \
  --quiet
```

## 10. Rollback

Cloud Run keeps every prior revision by default (unless deleted). Fastest
rollback — redirect 100% of traffic to a known-good revision without
rebuilding anything:

```bash
# List revisions, find the last-known-good one
gcloud run revisions list --service=tareeq-consumer-staging --region="$REGION"

# Roll back instantly
gcloud run services update-traffic tareeq-consumer-staging \
  --region="$REGION" \
  --to-revisions="<previous-revision-name>=100"
```

Or re-run the GitHub Actions workflow from the previous commit to rebuild
and redeploy that exact image — slower, but produces a fresh revision from
source rather than reusing a possibly-stale prior one.

## 11. Later: migrating to AWS App Runner

This is the reason the Dockerfiles were never touched (§1) — the same
images this plan builds are already App Runner-compatible. When the client's
AWS account is ready:

1. Follow [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) from the top — it's a
   fully independent plan, not a migration *from* this one.
2. Re-run the exact same `docker build` step from the Cloud Run workflows
   (§6) against ECR instead of Artifact Registry — the `Dockerfile` and
   `--build-arg`s don't change, only the registry push target and the
   deploy target (`aws apprunner start-deployment` instead of
   `gcloud run deploy`).
3. Move each server-only secret from GCP Secret Manager into AWS Secrets
   Manager (same names, same values) and each plain env var into App
   Runner's service configuration — §4's categorization (secret vs.
   build-time-public vs. plain-runtime) carries over unchanged, only the
   storage backend changes.
4. Decommission the Cloud Run services, Artifact Registry repo, GCP secrets,
   and the Workload Identity Federation pool/service account once App
   Runner is confirmed working — don't leave both running in parallel
   longer than a verification window, to avoid paying for (and maintaining)
   two live staging environments.
5. Delete the two `deploy-cloudrun-*.yml` workflow files (or disable via
   removing their trigger) once App Runner's workflows are confirmed
   green — keep this doc around as a historical record of what the
   temporary setup was, or delete it too; your call once it's no longer
   needed.
