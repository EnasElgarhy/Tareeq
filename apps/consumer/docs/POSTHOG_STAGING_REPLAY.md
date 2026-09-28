# PostHog staging session replay

Session replay is intentionally environment-gated. It stays off unless the
consumer build receives all three public values:

```env
NEXT_PUBLIC_POSTHOG_ENABLED=true
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_key
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Use a separate PostHog project for staging. Configure its recording sample to
100% while the private tester group is small.

## Privacy behavior

- Recording starts only after the tester chooses **Allow recording**.
- The decision is stored in `tareeq.staging-replay-consent.v1`.
- All form inputs are masked.
- All text is masked on assessment questions, authentication, Kai, results,
  shared results, dashboard, explore, profile, and contract routes.
- Email-like and token-like text is masked on other routes.
- Query strings and URL fragments are removed before capture.
- Network bodies, headers, canvas content, and cross-origin iframes are not
  recorded.
- PostHog receives anonymous sessions only; Tareeq does not identify users by
  name or email.
- Automated UAT browsers are accepted only after they click the same consent
  control as a human tester.

To repeat the consent flow during QA, remove
`tareeq.staging-replay-consent.v1` from the browser's local storage.

Browser tracking protection can block `eu.i.posthog.com` or
`eu-assets.i.posthog.com`. If a consenting tester does not appear in PostHog,
allow those domains for `staging.tareek.me` and retry.

## AWS VM build

The consumer Docker image inlines `NEXT_PUBLIC_*` values during `docker build`.
Add the three PostHog values to the staging VM's `.env` file and pass them as
consumer build arguments in `docker-compose.yml`, then rebuild the consumer
service. Do not add the PostHog key to `consumer.env` only; runtime values cannot
change an already-built Next.js client bundle.
