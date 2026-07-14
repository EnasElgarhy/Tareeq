# tareeq-admin deployment — see the consolidated plan

Per the corrected single-repo plan, `consumer` and `admin` share one
GitHub repo (`EnasElgarhy/Tareeq`) and one `.github/workflows/` directory
— GitHub only reads workflows from the repo root, so this checkout
(`feat/hybrid-assessment`) doesn't get its own independent CI/CD config.

The canonical, up-to-date runbook — sequencing, AWS setup, IAM policies,
GitHub Environments, env var reference for both apps — lives at:

```
docs/deployment/AWS_DEPLOYMENT.md   (in the feat/bilingual-assessment checkout,
                                      i.e. /Users/thisiswahba/Tareeq)
```

This app's own deployment-relevant files (`Dockerfile`, `.dockerignore`,
`next.config.ts`'s `output: "standalone"`, `app/api/health/route.ts`) are
already correct as prepared — they just need to move to `apps/admin/`
once the monorepo restructure (described in the canonical doc) happens.

`docs/deployment/iam-permissions-policy-admin-*.json` for this app also
now live in the consolidated location (`Tareeq/docs/deployment/`), scoped
to this app's own ECR repo (`tareeq-admin`) and App Runner services
(`tareeq-admin-development`, `tareeq-admin-staging`) — see the canonical
doc for the full table.
