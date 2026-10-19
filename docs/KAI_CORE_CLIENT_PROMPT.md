# Kai on the client's CORE prompt

Status as of 19 Oct 2026: done on localhost. Nothing is committed, pushed or deployed.

Source: CORE developer package of 17 Oct 2026 (file 06 Kai Instructions V1.1,
`CORE_06_Kai_System_Prompt.txt`, spec V1.3 §7–9 and §15, `kai_context()` in
file 08).

## How it works

- **Who gets it.** A student with a CORE 2.0 result on this device
  (`tareeq.core.result.v2`). The browser adds `core` to the chat request
  (`lib/kai/core/core-client.ts`), and the server validates it with zod
  (`core-request.ts`). Requests without `core` run the legacy Kai as before.
- **System prompt.** The client's text, verbatim (`system-prompt.ts`,
  generated from `lib/core-v2/content/data/kai-system-prompt.txt`), followed by
  a short OUTPUT FORMAT appendix (`core-prompt.ts`). A test fails if the copy
  drifts from the source file. Another test fails if the appendix mentions
  links, search, salaries, universities, family, plans, memory or scores.
- **Payload.** `buildCoreKaiContext` (`core-context.ts`) mirrors
  `kai_context()`: STUDENT_PROFILE, REPORT, ENTRY_PROMPT, PREVIOUS_SHIFTS,
  ATTEMPT_FLAGGED, PRIOR_DISAGREEMENTS, VERIFIED_LINKS and SAFETY_CONTACTS.
  The server builds it from the result's codes, using its own bank and
  wording. Tests check it against the client's 12 fixture cases.
- **Reply format.** JSON with `text`, `quickReplies` (at most 3), `events` and
  `summary`. It has no blocks, intent contract, Google Search or memory
  fields.

## Conflicts and how each was resolved

| # | Current Kai behaviour | Client rule | Resolution for CORE students |
|---|---|---|---|
| 1 | Legacy system prompt: "you have a point of view", "recommend majors, careers", "challenge gently" | Thinking partner, not an authority; the student is the expert | The client prompt replaces it, used verbatim |
| 2 | Context uses cluster, archetype, reward driver, ecosystem fit and confidence % | Never use internal terms, score or percentage | The payload carries report names only (for example "Research & Discovery"), never codes. A test checks that no code leaks. Counts are sent because spec §4 allows them for nuance; the prompt forbids quoting them |
| 3 | `fact_lookup` goes to Google Search with "concrete figures" for salaries, tuition and requirements | No salary or market facts stated as certain; no entry requirements from Kai's own knowledge | CORE turns never take the grounded path. No search tool is sent and no source list is attached |
| 4 | `learning_resources` (app-built search links) and the `source_list` of URLs | No links unless in VERIFIED_LINKS (empty); give search words | Removed from the CORE schema. Search words go in the message text |
| 5 | `family_script`, `objection_response_list`, `talking_points` and the "convince your family" coaching | Do not take sides or advise going against the family; do not ask about family pressure | Removed. The client prompt governs family topics |
| 6 | `career_card`, `university_card`, `decision_matrix` (1–5 scores plus a recommendation), comparison tables | No single job title as the answer; do not argue for or against a course, university or route; no scores | Removed. CORE replies are plain chat (2–4 sentences, per the prompt) |
| 7 | Required-block enforcement and the stricter retry (for example, demanding a family script) | Same rules as 5 and 6 | Skipped for CORE. The only retry left is the text-only recovery after a repetition loop |
| 8 | Long-term memory (`memoryUpdates`, `personSummary`) sent and updated; display name in the prompt | Kai receives the listed context "and nothing else about the student"; it records only disagreements, shift explanations, sections and alerts | CORE does not send memory, the name or the journey, and does not request memory updates. The rolling summary of the current conversation is kept |
| 9 | Goal framing (for example, explain_to_parents: "give them language") and memory-based opening | ENTRY_PROMPT opens; a direct open gets a short welcome and one open question (Part A §3) | Goal framing is dropped. The report buttons now pass `entry=S3/S4/S5-KAI-Q`, and the server resolves the wording in the student's language |
| 10 | Report "Discuss this with Kai" sent the section question as the student's own first message | The question is ENTRY_PROMPT, and Kai asks it | `parts.tsx` links with `entry`. A tapped answer is still the first message, and Kai is told it answers ENTRY_PROMPT |
| 11 | Medical regex redirect matches "I feel…" and "I have…" | Distress gets warmth plus a trusted adult; harm gets an emergency contact plus `safeguarding_alert`. The client's own example is "I feel like I can't breathe" | The regex is skipped for CORE. The client prompt covers medical scope and safeguarding |
| 12 | Tools: none | `record_disagreement`, `record_shift_explanation`, `safeguarding_alert` | Emitted as `events` in the JSON. Gemini JSON mode cannot be combined with function calling. See below |
| 13 | ATTEMPT_FLAGGED not modelled | Kai may offer the free retake once | Sent as `isFlagged && flags_live`. flags_live is off, so it is false today; otherwise Kai would offer a retake that does not exist yet |
| 14 | Paid-access gate on Kai | Kai is open "after the report is unlocked" | No conflict. The gate is kept |

## Tools (no live data written)

- `record_disagreement` and `record_shift_explanation` come back to the
  browser and are stored per attempt in `localStorage`
  (`tareeq.core.kai-events.v1`). Later conversations get them as
  PRIOR_DISAGREEMENTS. The server logs only the tool name, thread and request,
  never the student's words.
- `safeguarding_alert` is logged server-side as a warning (thread and request
  IDs). It also survives the repetition-loop recovery as a boolean.
- The spec §9 `kai_events` table needs a migration. It is not created; that
  needs approval.

## Open items for the client and founder

- **Safety contacts are still pending (spec §15).** SAFETY_CONTACTS is sent
  empty. In a live test, a self-harm message got a caring reply and the alert
  fired, but Kai supplied "999 (UAE)" from its own knowledge. Until the
  verified list exists, any number Kai gives is unverified.
- **The safeguarding escalation process is undecided.** Today an alert is only
  a log line. Nobody is notified.
- **Prompt testing, in both languages (Kai instructions §12).** In the same
  live test, the father-pressure case ("engineering or nothing… can't
  breathe") got warmth but no suggestion of a trusted adult or counsellor, and
  one line ("this is your future") leans toward taking a side. That is prompt
  behaviour to raise with the client, not something the appendix should patch.
- **Parent visibility notice.** Spec §7.3 asks to tell the student, before the
  first message, that a parent may read the conversation. The wording is
  pending, so nothing is shown yet.
- **Gender "prefer not to say"** (legacy QD4 option C) is sent as `null`. The
  prompt assumes a gender for Arabic grammar.
- **PREVIOUS_SHIFTS** stays empty for now: only the latest attempt is kept on
  the device. The builder already computes and limits shifts when it is given
  the previous result.
- The Kai screen's goal picker and grounding card still show legacy wording
  for CORE students.
