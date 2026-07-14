# Methodology integration plan — Phase 1

How the research dump from 21 May 2026 maps onto the Tareeq codebase, what already exists, what's missing, and the sequence to land it.

The source documents live next to this file in `docs/methodology/`. Everything quoted here is in-tree so engineering, design, and the research team are reading from the same copy.

---

## TL;DR — what each document becomes

| Source document | Becomes in the codebase | Status |
|---|---|---|
| `scoring_logic.md` | `lib/scoring/index.ts` (extend) + new `lib/scoring/cluster.ts` + tests | Partial — types exist, bonus + confidence missing |
| `results_narrative_framework.md` | `lib/results/narratives.ts` + `app/(assessment)/result/page.tsx` | Not started |
| `example_personalized_narratives.txt` | Test fixtures in `lib/scoring/scoring.test.ts` + narrative golden files | Not started |
| `fun_facts_for_assessment.txt` | Replaces `lib/assessment/interstitials.ts` content | Has v1 placeholders — needs swap |
| `consent_framework.txt` | New `app/(assessment)/consent/page.tsx` + storage | Not started |
| `data_collection_spec.txt` | Drizzle schema in `db/` (currently empty) | Not started |
| `extensible_schema_guide.txt` | Informs the schema decisions above | Reference only |
| `irb_ethics_guide.txt` | Non-code (process / paperwork for the research team) | Out of scope |
| `two_tier_report_design.txt` | Drives the v2 redesign of the result page + parent PDF export | Not started |
| `Suggestions for Sharable cards design.zip` | `app/(assessment)/result/share/` route + card templates | v1 source HTML in `/tmp/sharable-cards/`, needs v2 reskin |

---

## What already exists vs the spec

The good news: a lot of the **structure** is already correct. The gaps are in the **scoring math** and the **post-assessment surface**.

### Already aligned with the spec

| Concept in `scoring_logic.md` | Already in the codebase | File |
|---|---|---|
| 8 career clusters (Tech, Eng, Sci, Art, Bus, Law, Ppl, Env) | `clusterCodes` array of 8 codes | `lib/scoring/types.ts:1-10` |
| 5 reward drivers (Recognition, Impact, Autonomy, Mastery, Stability) | `driverCodes` of 5 + `driverNames` map | `lib/scoring/types.ts:12` + `lib/scoring/index.ts:24-30` |
| 4 operational archetypes (Precisionist, Coordinator, Explorer, Catalyst) | `ArchetypeName` union + descriptions | `lib/scoring/types.ts:17-21` + `lib/scoring/index.ts:11-21` |
| 4 axes (Processing, Scope, Social, Environment) | `AxisCode` + `AxisValue` unions | `lib/scoring/types.ts:23-33` |
| Pillar structure (0..4) on each question | `Question.pillar` field | `lib/scoring/types.ts:50` |
| 16 + 8 + 10 questions for pillars 1, 2, 3 | Matches spec | `lib/content/seed.ts` |
| Ecosystem fit categories (High-Energy Team, Structured Team, Solo Sprinter, Solo Specialist) | Live in `CompassResult.axes` | `lib/scoring/types.ts:75-86` |

### Gaps to close

| Spec requirement | Current state | Action |
|---|---|---|
| **40 questions total** (4+16+8+10+6) | We have **54** (4+16+8+10+**16**) — pillar 4 over-sampled | DECISION NEEDED — see below |
| **Pillar 4 = 6 questions** (Q35–40) | Currently 16 questions | Trim or keep, same decision |
| **+0.5 bonus** from operational archetype to specific clusters | Not implemented | Add to `lib/scoring/cluster.ts` |
| **+0.5 bonus** from ecosystem fit to specific clusters | Not implemented | Add to `lib/scoring/cluster.ts` |
| **Confidence percentage** = primary score / 16 × 100 | Not implemented | Add to `CompassResult` |
| **Multi-Curious edge case** (top 3 within 1 point) | Not implemented | Add detection + a multi-curious branch in `CompassResult` |
| **Adaptive 5th archetype** when both axes tie after tiebreakers | Not implemented (returns one of 4) | Add `"Adaptive"` to `ArchetypeName` union |
| **Tie-breaker rule** for Processing axis using Q18 | Not implemented | Add explicit Q18 lookup in archetype resolver |
| **Tie-breaker rule** for Focus axis using Q21 | Not implemented | Add explicit Q21 lookup in archetype resolver |
| **5 validation profiles** from `scoring_logic.md` lines 537–561 | Not in test suite | Add to `lib/scoring/scoring.test.ts` |
| **Reward driver tie-breaking** when all scores 0–1 → `"Balanced"` | Not implemented | Add `"Balanced"` sentinel to driver resolution |

### Decision needed — question count

The spec is **40 deterministic questions** designed to score cleanly across the 4 pillars with the exact +0.5 bonus arithmetic. The current Tareeq seed has **54** (the extra 14 are in pillar 4 — Ecosystems was over-sampled in the prototype).

Two options:

**A) Conform to the spec (40 questions).** Trim 10 ecosystems questions, re-map IDs, regenerate the audio voiceovers for the removed questions, update the compass progress denominator. Cleanest path to the scoring math the research team designed and validated.

**B) Keep 54 questions.** Adjust the spec's denominators (confidence percentage uses 16, but if we keep more questions in pillar 4 we may want a tighter weighting). Means the validated scoring math from `scoring_logic.md` no longer applies 1:1 — we'd ship our own variant.

**Recommendation: A.** The whole point of the research dump is to ship the validated engine. Trimming is one afternoon of work; building a custom math that mostly matches but isn't validated is a permanent footnote.

---

## Phase 1 — what to ship for the first complete flow

A user can: take 40 questions → see their CORE result + persona → share a card. The bare minimum to call Tareeq's MVP complete.

### Batch 1 — scoring engine

**Goal:** byte-exact agreement with `scoring_logic.md`.

- [ ] Trim seed to 40 questions (per Decision A above) and re-export.
- [ ] Add `lib/scoring/cluster.ts` with:
  - `applyArchetypeBonus(scores, archetype)` → adds +0.5 to the spec's pairings
  - `applyEcosystemBonus(scores, ecosystem)` → adds +0.5 to the spec's pairings
  - `calculateConfidence(primaryScore)` → integer percent, with `"High" | "Moderate" | "Low"` label
  - `detectMultiCurious(rankedScores)` → boolean if top 3 within 1 point
- [ ] Extend `ArchetypeName` to include `"Adaptive"`.
- [ ] Wire Q18 / Q21 tie-breakers into the archetype resolver.
- [ ] Add `"Balanced"` driver branch when all 5 scores ≤ 1.
- [ ] Extend `CompassResult` with: `primaryClusterScore`, `confidencePercentage`, `confidenceLabel`, `multiCurious: boolean`, `coPrimaryClusters?: ClusterCode[]`.
- [ ] Port the 5 validation profiles from `scoring_logic.md` lines 537–561 into `lib/scoring/scoring.test.ts`.

**Acceptance:** all 5 validation profiles pass; existing tests still green.

### Batch 2 — fun facts (do this in parallel with scoring)

The methodology document delivers ready-to-ship copy with sources. Replace the placeholders in `lib/assessment/interstitials.ts`.

- [ ] Replace the current 4 interstitials (firing at index 9/19/29/39) with the 3 fact sets from `fun_facts_for_assessment.txt` (firing at index 9, 19, 29 — note the spec says only **3 sets**, not 4).
- [ ] Each set carries 3–4 alternate facts; pick one at random within each set (the existing data structure can hold an array; pick with `Math.floor(Math.random() * facts.length)` at render time, NOT at scoring time, so the seed stays deterministic).
- [ ] Each fact ships with: emoji icon, surprising headline, context line, source. Source goes in muted text at the bottom — design already supports this.
- [ ] Arabic translations: each fact's Arabic version sits in the same data object under `bodyAr` / `headlineAr`. The methodology doc gives the tone rules (numbers stay Western, source names stay English).
- [ ] Update `DidYouKnow.tsx` to render the source attribution line if present.

**Acceptance:** fun-fact sheet shows real research-backed facts with citations; both English and Arabic copy renders correctly with the existing motion.

### Batch 3 — result page

**Goal:** `/result` exists. Renders the user's compass with the 8-cluster narrative for their primary cluster, plus the personalisation paragraphs for archetype / driver / ecosystem.

- [ ] New file `lib/results/narratives.ts`:
  - 8 base narratives (Sections 1, 2, 3, 5, 6 from `results_narrative_framework.md`), one per `ClusterCode`. Stored as structured data with sections — not free-form prose — so we can compose them deterministically.
  - Section 4 (Integration) generated by composing 3 conditional snippets keyed on `(archetype, driver, ecosystem)`. The methodology doc provides the matrix at lines 444–474.
  - Multi-curious variant that intersects the top 3 clusters using the lookup at `results_narrative_framework.md:478–496`.
- [ ] New route `app/(assessment)/result/page.tsx`:
  - Reads the assessment progress from local storage.
  - Calls `computeScore(progress, questions)` to get the `CompassResult`.
  - Picks the narrative for the primary cluster.
  - Renders the **student-facing** version per `two_tier_report_design.txt` (hero card → working style → academic path → next step), all on the v2 night surface.
- [ ] The "Take it again" / "Share" CTAs are real; "Download full report" is stubbed for Phase 2.

**Acceptance:** all 8 clusters render a complete personalized narrative; the 3 worked examples in `example_personalized_narratives.txt` are reproducible word-for-word from our data + composition (or close enough that the research team signs off on the diff).

### Batch 4 — sharable cards

The provided zip has v1-styled HTML (blue gradient, coral accents). We reskin to v2.

- [ ] New folder `components/share/`:
  - `ShareCardHero.tsx` — page 1, the result reveal (night surface + warm-gradient cluster name)
  - `ShareCardBreakdown.tsx` — page 2, the three personality dimensions
  - `ShareCardPath.tsx` — page 3, the academic + career list
- [ ] New route `app/(assessment)/result/share/page.tsx` — renders all 3 cards stacked for screenshot/share.
- [ ] Use the spec's 1080×1920 dimensions internally; the user's actual capture happens via the browser's native screenshot.
- [ ] Replace the v1 cluster colors (Tech `#1E3A8A` etc.) with v2 cluster-coded variants of the warm gradient — keep the principle (each cluster has a signature color) but anchor to the v2 palette.
- [ ] Tareeq mark in the corner uses the v2 warm-gradient version (already shipped on /intro and /contract).

**Acceptance:** user lands on `/result/share`, sees three phone-shaped cards stacked; screenshots are square-ready for Instagram carousel.

### Batch 5 — consent + persistence (research-enablement layer)

This is the gate for actually using the data for research. Until this ships, every assessment is anonymous and ephemeral.

- [ ] New route `app/(assessment)/consent/page.tsx`, shown **between completion and result reveal** per `consent_framework.txt:53–...`.
- [ ] Four checkboxes: terms (mandatory), research participation (optional), longitudinal follow-up (optional), university sharing (optional). Each persists as a boolean with a timestamp and the consent version (`"v1.0"`).
- [ ] Persistence target — Supabase Postgres. Two tables per `data_collection_spec.txt`:
  - `user_accounts` (PII, deletable, encrypted)
  - `assessment_data` (anonymised research dataset, permanent, with `user_id_hash` SHA-256 of user id)
- [ ] Use Drizzle migrations under `db/` (currently empty).
- [ ] Server action `saveAssessment(progress, result, consent)` called after consent screen submission.

**Acceptance:** consent screen captures the 4 booleans; a record lands in `assessment_data` with the correct hashed user ID; running the same assessment with different consent choices produces correctly-flagged rows.

---

## Open decisions for the research team / client

1. **Trim to 40 questions, or keep 54 and modify the scoring math?** (See above — strong recommendation to trim.)
2. **Narrative generation: hand-authored or AI?** Methodology doc lays out both options. For Phase 1, hand-authored is faster and cheaper; the framework + the 3 worked examples (`example_personalized_narratives.txt`) are enough to write the remaining 5 base templates in a day. AI generation can be Phase 2.
3. **Result page personalisation depth.** Three options in `README_FROM_RESEARCH.md:115`:
   - A) just the primary cluster narrative (recommended for first launch)
   - B) also surface archetype / driver / ecosystem as separate panels
   - C) full cluster rankings + all scores
4. **Multi-language for narratives.** Arabic translation of 8 base narratives + the integration snippets is a discrete cost. Do we ship EN-only and add AR in Phase 1.5?
5. **Sharable card format.** Static PNG (server-generated, Phase 2) or live HTML the user screenshots (ships now). Recommend HTML-now → PNG-later.

---

## File-level inventory after Phase 1

```
lib/
  scoring/
    cluster.ts         (NEW — bonus + confidence + multi-curious + balanced)
    index.ts           (modified — pulls in cluster helpers, new fields on CompassResult)
    scoring.test.ts    (modified — 5 validation profiles)
    types.ts           (modified — Adaptive archetype, Balanced driver sentinel)
  results/
    narratives.ts      (NEW — 8 base + integration snippets + multi-curious)
  assessment/
    interstitials.ts   (modified — replace with the methodology fun facts)

app/(assessment)/
  consent/page.tsx     (NEW)
  result/
    page.tsx           (NEW — student-facing view)
    share/page.tsx     (NEW — three-card share view)

components/
  share/
    ShareCardHero.tsx        (NEW)
    ShareCardBreakdown.tsx   (NEW)
    ShareCardPath.tsx        (NEW)

db/
  schema.ts            (NEW — user_accounts + assessment_data)
  migrations/          (NEW)

docs/methodology/      (already landed — research source of truth in-tree)
```

---

## What is NOT in Phase 1

- Parent PDF export (Phase 2 — the "two-tier report" doc describes this).
- AI generation of narratives (Phase 2 — hand-authored is fine).
- Static PNG card generation server-side (Phase 2 — HTML cards are enough).
- RIASEC / functional cluster / O*NET mapping (Phase 2/3, placeholders only in the schema).
- IRB / ethics paperwork (research team owns this — not engineering).
- Longitudinal follow-up email job (Phase 2 — the consent gate ships now, the job runs later).

---

End of plan.
