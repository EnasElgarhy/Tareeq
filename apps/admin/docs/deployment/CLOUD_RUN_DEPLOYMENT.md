# tareeq-admin — temporary Cloud Run staging — see the consolidated plan

Same reasoning as this checkout's `AWS_DEPLOYMENT.md` pointer: consumer and
admin share one GitHub repo (`EnasElgarhy/Tareeq`), so the canonical,
up-to-date runbook for the temporary GCP Cloud Run staging deployment
(Artifact Registry, Cloud Run services for both apps, Secret Manager,
Workload Identity Federation, smoke tests, cleanup, rollback, migration back
to App Runner) lives at:

```
docs/deployment/CLOUD_RUN_DEPLOYMENT.md   (in the feat/bilingual-assessment checkout,
                                            i.e. /Users/thisiswahba/Tareeq)
```

This app's own Cloud-Run-relevant files — `Dockerfile`, `.dockerignore`,
`next.config.ts`'s `output: "standalone"`, `app/api/health/route.ts` — are
already correct as prepared; nothing app-side changed for Cloud Run.

The one new file that *does* live in this checkout is
`.github/workflows/deploy-cloudrun-admin.yml` (this branch had no
`.github/workflows/` directory before this — GitHub only reads workflows
from whatever branch is pushed, so admin's deploy pipeline has to exist here
even though the docs stay canonical in the other checkout).
