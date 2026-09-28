# Assessment Versioning Rules

How content versions behave in the CMS, why published versions are immutable,
and how the UI communicates that. This documents existing behaviour — it does
**not** propose any database or behaviour change.

## The model

A content version (`content_versions`) has:

- `id`, `label`, `notes`, `created_at`
- `is_active: boolean` — **the** governance flag.

There is intentionally **no** in-place editing of a live version. The system
recognises exactly two states:

| State | `is_active` | Editable? | Meaning |
|-------|-------------|-----------|---------|
| **Draft** | `false` | ✅ Yes | Work in progress. Not served to students. |
| **Published (live)** | `true` | ❌ No (except Arabic translations) | Served to students; responses & analytics attach to it. |

> The schema has no `published_at`, no version number (v4/v5), no `archived`
> state, and no parent-link between a draft and the version it was cloned from.
> The UI therefore surfaces only what's real: active/draft state, `created_at`
> (shown as "live since"), and the response count attached to the version. It
> must not display invented lineage (e.g. "v3 Archived → v4 → v5").

## Why published versions are immutable

1. **Reproducibility** — a student's result only means something against the
   exact questions they answered. Editing in place would retroactively change
   what their answers meant.
2. **Comparability** — changing questions after cohorts have answered would
   invalidate comparisons across cohorts and over time.
3. **Integrity of derived data** — analytics, archetypes, and Compass scoring
   are all computed against a fixed version. Editing in place would silently
   rewrite history.

## The lifecycle

```
Published (live)  →  Clone to draft  →  Edit draft  →  Publish new version
        │                                                      │
        │                                                      └─ new students
        │                                                         get the new version
        └─ existing responses stay attached to this version, forever
```

- **Clone to draft** duplicates every question (keeping question IDs where
  appropriate), creates a **new** `content_versions` row (`is_active=false`),
  and leaves the source version's responses untouched.
- **Publish** flips the draft to `is_active=true` and (for CORE) regenerates
  narration audio as needed.
- Responses are **never** migrated between versions.

## How the UI communicates this

- **Published content pages** (`/admin/content/[versionId]` and `.../custom`)
  render a read-only **`VersionGovernancePanel`** instead of editable-looking
  fields: a "Published snapshot" identity, the why-it's-immutable disclosure,
  the lifecycle flow, live-since date, and attached-response count.
- **CORE** published questions render as read-only cards (`ReadonlyQuestion`),
  never as disabled inputs.
- **`VersionRename`** hides its edit control on published versions and shows a
  status badge instead — no false affordance.
- **Arabic translations** remain editable on published CORE versions (they
  don't change the assessment's meaning), reachable from the panel.

## Known gaps / follow-ups (not false affordances)

- The **custom** editor's read-only branch shows the governance panel but does
  **not** yet render the published custom questions read-only (CORE does).
  A read-only variant of `CustomQuestionsEditor` would close this.
- "Live since" uses `created_at` as a proxy for publish time (no `published_at`
  column). If precise publish timestamps are ever needed, that's an additive
  migration — out of scope here.
