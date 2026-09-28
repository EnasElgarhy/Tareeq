# Analytics Exports — UX Redesign

## What changed
Replaced the three competing standalone CSV buttons ("Summary metrics (CSV)",
"Anonymized assessment rows (CSV)", "Flagged records (CSV)") with a single
guided export workflow in `components/admin/analytics/ExportPanel.tsx`.

## New structure
- **Heading:** "Export data" + description "Download data based on the filters above."
- **Pre-export summary** line: selected date range · assessment · record count
  (from the active analytics filters + `overview.totalCompleted`).
- **Single-choice selector** — three radio option cards, each with a title,
  one-sentence description, a restrained inline icon, and a clear selected
  state (violet border + tint + check):
  1. **Summary report** — "High-level metrics and totals for presentations or reporting."
  2. **Assessment data** — "One anonymized row per assessment for deeper analysis."
  3. **Flagged records** — "Only records currently marked for review."
- **One primary button** whose label tracks the selection: *Export summary* /
  *Export assessment data* / *Export flagged records*.
- **Privacy note:** "Names and emails are excluded. Assessment exports use anonymized user IDs."

## Wording
- "Summary metrics (CSV)" → **Summary report**
- "Anonymized assessment rows (CSV)" → **Assessment data**
- "Flagged records (CSV)" → **Flagged records**

## Behavior preserved
- Export **backend is unchanged** — the primary action is still a GET to
  `/api/admin/analytics/export?type={summary|rows|flagged}&<filters>`; the same
  `type` values map to the same server logic.
- Filters still flow through via `queryString` (unchanged `buildQueryString(vm)`).
- The component became a client component (`"use client"`) only to hold the
  radio selection state; the page (`analytics/exports/page.tsx`) still passes
  `queryString` + `saltConfigured` and now also `dateFrom/dateTo/assessmentLabel/recordCount`
  for the pre-export summary.

## States
- **Disabled / unavailable:** when `ANALYTICS_HASH_SALT` is unset, the selector
  is disabled and the primary button is a disabled "Export CSV" with an inline
  error explaining why (same guard as before, clearer presentation).
- **Selected:** violet border/tint + check icon on the chosen option.

## Scope honored
- Only the Exports section changed. Analytics navigation, the filter bar, and
  export backend behavior are untouched.
- No multi-step wizard, no modals.

## Design system
Uses existing tokens (`adm-violet`, `adm-violet-soft`, `adm-deep`, `adm-sand`,
`adm-ink*`, `adm-line*`, `rounded-adm-*`) and the `Card` / `InlineStatus`
components. Icons are inline SVG (no new dependency), thin-stroke, currentColor.

## Verification
- `tsc --noEmit` clean; `eslint` clean on both changed files.
- Not deployed, not committed (per instructions).
