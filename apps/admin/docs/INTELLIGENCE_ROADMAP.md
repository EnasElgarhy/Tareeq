# Tareeq Intelligence Roadmap — building "smart" out of user answers

> Goal: turn the answers of users who complete the assessment into a growing **intelligence layer**
> that makes Tareeq's guidance sharper and more personalized over time — without sacrificing trust,
> explainability, or the "compass, not a label" promise.
>
> Companion to [`CMS_BACKEND_PLAN.md`](CMS_BACKEND_PLAN.md) — the data collection here is Phase 3 of
> that plan and is the **hard prerequisite** for everything below.

---

## 1. The honest framing (read this first)

"Train an LLM on the answers" sounds right but is the wrong primitive. Two facts shape the whole plan:

1. **Intelligence needs a *target*, and the answers alone don't have one.** Today the *scoring rules
   define* the result, so a model trained on (answers → current score) just memorizes the rules you
   already have — zero new intelligence. The only thing that teaches the system something new is
   **real-world outcomes**: did the prediction fit, was the user satisfied, what did they actually
   choose/study/do. You already modeled this in **`user_outcomes`**. That table is the engine of all
   intelligence here. **No outcomes at scale → nothing to learn.**

2. **Different jobs need different tools.** Learning patterns from structured answers is a *tabular ML*
   problem (tree models), not an LLM problem. LLMs are for *language* — narrative, coaching, retrieval.
   So "our intelligence" is **not one model**; it's a layered engine where each layer uses the right tool.

**The deterministic scorer stays as the auditable baseline** (your methodology doc: *"no AI at the
scoring stage"*). We add intelligence *around* it and let data *refine* it — we never replace it with a
black box for a youth career tool.

---

## 2. What "intelligence built from answers" actually looks like

A 5-layer **intelligence engine**, each layer learnable from your data, each independently shippable:

```
 L0  Deterministic scorer            ← truth, explainable, keep (lib/scoring)
 L1  Psychometric item-analysis      ← refine the RULES from data (still explainable)
 L2  Outcome-trained tabular model    ← a learned 2nd signal, validated vs real outcomes
 L3  LLM narrative + RAG + Kai chat    ← the "smart/personal" the user feels (already started)
 L4  (optional) fine-tuned LLM         ← only if voice/quality demands it
```

Intelligence accumulates because **every completed assessment + every follow-up feeds L1–L3.**

---

## 3. The data flywheel (the actual product)

```
user answers ──► deterministic result ──► LLM-personalized report
     │                   │                        │
     ▼                   ▼                        ▼
 assessment_data (responses + all scores + confidence + consent + device + time)
     │
     ├──► (3–12 mo later) user_outcomes  ← THE LABEL: actual major/career, alignment, satisfaction
     │
     ▼
 item-analysis + model training ──► better mappings / weights / a learned signal
     │
     ▼
 new content_version (A/B tested) ──► measurably better predictions ──► (loop)
```

You already have every table this needs: `assessment_data`, `user_outcomes`, `content_versions`
(for A/B), and the **`riasec_*` / `onet_soc_codes` / `functional_cluster` extension fields** — which
let you bridge answers to **validated public career taxonomies** (Holland/RIASEC, O*NET) for free
external grounding.

---

## 4. The layers, concretely

### L0 — Deterministic scorer *(have it)*
Keep `lib/scoring` as the source of truth. It defines the cluster/archetype/driver/ecosystem and the
confidence. Everything else is measured *against* it.

### L1 — Psychometric item-analysis *(highest ROI, fully explainable)*
Once you have a few hundred completions, run classic test theory on `assessment_data.responses`:
- **Item discrimination** — which questions actually separate clusters vs add noise.
- **Option balance** — are some options never chosen / always chosen.
- **Internal consistency** per pillar (does it measure one thing).
- **Answer ↔ outcome correlation** (needs `user_outcomes`) — which items predict real choices.

Output: retune cluster mappings, drop weak questions, adjust the +0.5 bonuses — all editable in the
CMS (`scoring_config`) and shipped as a new `content_version`, **A/B tested**. This makes the system
smarter while staying 100% explainable. *This is where to start.*

### L2 — Outcome-trained tabular model *(the real "learned intelligence")*
When you have enough labeled outcomes (rough rule of thumb: **~1–2k completions with follow-ups**),
train a model that predicts an *outcome* from the answer vector:
- **Inputs:** the response vector + demographics (anonymized).
- **Targets:** `alignmentWithPrediction`, `satisfactionRating`, actual `chosenCluster`/career.
- **Model:** **gradient-boosted trees (XGBoost / LightGBM)** — for tabular answer data these beat
  LLMs decisively *and* give feature-importance (interpretable). A small neural net only if data is
  large.
- **Use:** run it **alongside** L0 as a *second opinion* — a confidence adjuster, a "you may also
  thrive in…" secondary signal, or a flag when the learned model and the rules disagree (great input
  back to L1). **Never the sole authority.**

### L3 — LLM intelligence: language, retrieval, coaching *(started — extend it)*
This is where the user *feels* intelligence, and it's the LLM's real strength:
- **Narrative personalization** — already live (Gemini fine-tunes prose over the deterministic base).
- **RAG** — retrieve over a curated career/university/labor dataset (seed it from **O*NET** via the
  `onet_soc_codes` you already store, plus regional university data) so Kai's advice is current,
  specific, and region-aware instead of generic.
- **Kai chat coach** — a conversation grounded in the user's result + RAG, that can answer "what
  should I study for X" with real specifics. This is the biggest perceived-intelligence jump.

### L4 — Fine-tuning the LLM *(optional, probably skip)*
If you ever fine-tune, do it on **curated, human-rated best-result examples** (to lock Kai's
voice/quality), **not** raw answers. Honestly: good prompting + RAG (L3) usually beats fine-tuning at
a fraction of the cost/maintenance. Treat this as a "later, maybe."

---

## 5. Tech stack for the intelligence layer

- **Collection / storage:** Supabase Postgres (you have it) — `assessment_data` + `events` +
  `user_outcomes`. Export to Parquet/CSV for training.
- **Analysis & ML (L1/L2):** **Python** (pandas, scikit-learn, statsmodels, XGBoost/LightGBM) in a
  notebook → then a scheduled training job. Models are tiny; serve them as a small **`/api/predict`
  endpoint** (ONNX or a Python microservice / Supabase Edge Function) the app calls alongside scoring.
- **LLM (L3):** your current Gemini pipeline + a **vector store** for RAG (Supabase `pgvector` — no
  new infra) seeded with O*NET + university content.
- **Experimentation:** `content_versions` for A/B; track which version a user got and compare outcome
  alignment.
- **Governance:** training only on rows with `consent_general_research = true`; a model registry +
  validation report per version.

---

## 6. Phased roadmap (gated by data volume, not calendar)

| Phase | Trigger | Build | Outcome |
|---|---|---|---|
| **I — Instrument** | now | persist `assessment_data`, `events`, and a **follow-up survey** that fills `user_outcomes`; consent gating | the flywheel starts turning |
| **II — Item analysis** | ~few hundred completions | L1 psychometrics → refined `scoring_config` → A/B a new `content_version` | rules get smarter, explainably |
| **III — Outcome model** | ~1–2k completions **with follow-ups** | L2 XGBoost trained on outcomes, served as a 2nd signal + confidence | the first *learned* intelligence |
| **IV — RAG + Kai chat** | anytime (parallel) | L3 pgvector + O*NET/university RAG + grounded chat coach | the "smart/personal" leap users feel |
| **V — Continuous loop** | ongoing | retrain on a schedule, monitor alignment lift vs baseline, fairness checks | self-improving system |

> Phases II/III depend on **data**; Phase IV (RAG/chat) you can build *now* and it delivers the most
> visible intelligence soonest.

---

## 7. The non-negotiables (youth + career stakes)

- **Consent** — train only on `consent_general_research = true`; honor withdrawal (`consentWithdrawn`).
- **Explainability** — the score the user sees is always the deterministic, auditable one; learned
  signals are *additive and labeled*, never a hidden override.
- **Fairness** — check every learned model for demographic bias (gender/country/age) before shipping;
  early-adopter data skews.
- **Validation** — no model ships without a held-out outcome-alignment report beating the baseline.
- **Human-in-the-loop** — guidance for minors should never be a pure black box.

---

## 8. What to do first (this quarter)

1. **Turn on collection** (CMS Phase 3): persist `assessment_data` + `events`; nothing is possible
   without it.
2. **Stand up the follow-up loop** — a light 3-month survey writing `user_outcomes`. This is the moat;
   start it early so labels accrue.
3. **Build L3 RAG + Kai chat** in parallel — it's the fastest visible "intelligence" win and needs no
   training data.
4. Revisit L1/L2 once the data thresholds in §6 are hit.

**Bottom line:** you *can* build "our intelligence from user answers" — but it's a **data flywheel +
a layered engine**, where outcomes (not answers) are the teacher, tree-models (not an LLM) learn the
patterns, and the LLM makes it feel smart. Keep the deterministic compass as the trustworthy core.
