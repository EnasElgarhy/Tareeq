# Admin Responses — see each user's result per assessment

Admin surface for browsing every assessment a respondent has taken, the answers
they gave, and the result they got. Built on the existing `assessments` table.

## What shipped (admin side — done)

- **Routes** (all gated by `requireAdmin()` via the `(shell)` layout):
  - `/admin/responses` — assessments that have responses, with started/completed counts.
  - `/admin/responses/[versionId]` — every respondent for one assessment + their result.
  - `/admin/responses/[versionId]/[assessmentId]` — one run: identity, result, and
    every answer decoded against the version's questions, grouped by pillar.
- **Read layer**: `lib/admin/responses.ts` (service-role reads; `*` selects so it
  tolerates the migration state). Pure formatting in `lib/admin/response-format.ts`
  (unit-tested in `response-format.test.ts`).
- **Schema**: migration `202606260001_assessment_respondent.sql` adds nullable
  `respondent_name` / `respondent_email` to `assessments` (the consumer flow is
  anonymous, so there is usually no `auth.users` row to name the respondent).
  Apply with `node_modules/.bin/tsx scripts/apply_respondent_migration.mts`.
- **Sample data**: `scripts/seed_sample_responses.mts` (faithful — answers scored
  by the real `computeScore`). Remove with `scripts/clear_sample_responses.mts`.
  Samples are tagged `anon_session_id like 'sample-resp-%'`.
- **Nav**: a "Responses" item in `AdminSidebar`.

## What's NOT done — wiring the live consumer flow (needs your go-ahead)

The consumer assessment app (`feat/bilingual-assessment`) is 100% localStorage /
anonymous and writes **nothing** to the DB today, so real data won't appear until
the completion flow persists a row. This touches the live assessment/results
flow, so it was intentionally left for you to approve.

When ready, on completion (the `/analyzing` → `/results` step) insert one row.
RLS already allows an anonymous insert (`with check (... or user_id is null)`),
so the consumer's Supabase **anon** client can write directly — no server route
needed:

```ts
await supabase.from("assessments").insert({
  version_id: activeVersionId,      // the live content_versions.id (not the seed label)
  anon_session_id: localAssessmentId,
  locale,                            // "en" | "ar"
  started_at: startedAtIso,
  completed_at: new Date().toISOString(),
  answers,                           // { [externalId]: letter }
  result,                            // the CompassResult object
  respondent_name: registration.name,
  respondent_email: registration.email,
});
```

Files that would change (consumer app): `lib/results/storage.ts` (or a new
`lib/results/persist.ts`), called from `components/assessment/AnalyzingScreen.tsx`
after the result is computed. Make it fire-and-forget / fail-open so a DB hiccup
never breaks the existing localStorage UX (and never touch `ResultsScreen.tsx`).

### Open follow-ups
- Email is collected but never verified on the consumer side — `respondent_email`
  is self-reported until real verification lands.
- The consumer must insert the **DB** `content_versions.id`, which means it first
  needs to read the active version from the DB (the keystone "app reads active
  content_version" work) rather than the hardcoded seed.
