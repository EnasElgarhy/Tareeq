# Kai Artifact Engine (Phase 2C — design)

## Purpose
Isolate heavy, nested-array structured outputs from the conversational path.
Each artifact kind gets its **own** small schema and generation call, so no
single request carries the full block union that triggers the repetition loop.

## Artifact kinds (the intents that fail today)
| kind | shape | simplified retry |
|---|---|---|
| `action_plan` | title, duration, `tasks[]{text, estimated_time, status}` | 7-day → 3-day (fewer tasks) |
| `family_script` | opener, `talking_points[]`, `objection_response_list[]{objection,response}` | script → flat `bullet_list` |
| `comparison_table` | columns[], `rows[]{label, cells[]}` | table → short prose `comparison` |
| `decision_matrix` | options[], criteria[], `scores[][]` | matrix → top-2 `bullet_list` |

## Contract
```
POST /api/kai/artifact
req:  { kind, params, context }          // params = what the conversation extracted
res:  { ok: true, block } | { ok: false, reason }   // reason ∈ retry-strategy codes
```
- One `responseSchema` per kind (`lib/kai/artifact/schemas.ts`) — never a union.
- Own `generationConfig`: same `thinkingBudget: 0`, but `maxOutputTokens` tuned per kind (a 3-day plan needs far less than 6144).
- Runs `detectDegenerateOutput` (shared with chat). On `provider_repetition_loop`, retry **once with the simplified schema** for that kind (table above). If that also degenerates → deterministic honest fallback block ("Here's a shorter version…") — never a hang.

## Client flow
1. `/api/kai/chat` returns reply + optional `artifactRequest{kind, params}`.
2. Client renders the text immediately, shows a scoped skeleton card, calls `/api/kai/artifact`.
3. On `ok:false`, the card shows a compact retry affordance — the conversation is untouched.

## Migration path from today
Currently these blocks are produced inline by `/api/kai/chat` + enforced by
`chat-enforcement.ts`. Phase C moves the generation + enforcement for the four
kinds above into the artifact module; `chat-enforcement.ts` for the light inline
blocks (insight/bullet/reflection) stays as-is. Backward compatibility during
the cutover: chat may still inline an artifact if the client hasn't adopted the
separate call yet (feature-flagged), removed once the client ships.

## Status
Design only. Blocked behind Phase B (conversation-engine extraction) so the
`needsArtifact()` boundary exists before the second endpoint is wired.
