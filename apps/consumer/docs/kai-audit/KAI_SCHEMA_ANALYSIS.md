# Kai Chat — Schema Analysis (Phase 1)

Source: `lib/kai/chat-prompt.ts` (`buildResponseSchema`, `buildBlockSchema`),
`lib/kai/chat-server.ts` (block-type descriptions), `lib/kai/required-blocks.ts`.

## Shape
- **One shared response schema for ALL turns** (small talk and 7-day plans use the same top-level object).
- Top-level: required `text`, `intent`; optional `quickReplies`, `blocks[]`, `summary`, `memoryUpdates`, `personSummary`.
- **20 block types total**: career_card, university_card, action_plan, comparison, comparison_table, decision_matrix, journey, milestone_card, memory_card, recommendation_history, resume_conversation, goal_card, learning_resources, insight_block, bullet_list, checklist, talking_points, family_script, objection_response_list, reflection_question.
- **Nesting depth ~4**: response → `blocks[]` → block object → array field (e.g. `tasks[]`, `objections[]`, `matrix_rows[]`) → item object.

## Per-turn narrowing (mitigation already in place)
`buildResponseSchema(intentHint)` narrows the union to `ALWAYS_ALLOWED_BLOCK_TYPES` (8) + `INTENT_BLOCK_TYPES[intent]`. Only the fields of allowed block types are flattened in. This already keeps schema size ~400–700 tokens and avoids the "full 20-type union" (which the code comments note caused outright serving failures: *"schema produces a constraint that has too many states for serving"*).

## Complexity → failure correlation (measured)
| Block types the intent enables | Emitted reliably? |
|---|---|
| `insight_block`, `learning_resources`, `bullet_list` (simple) | ✅ (~500 output tokens) |
| `action_plan` (title + duration + `tasks[]{text,estimated_time,status}`) | ❌ MAX_TOKENS loop |
| `family_script` + `objection_response_list[]{objection,response}` | ❌ MAX_TOKENS loop |
| `comparison_table` / `decision_matrix` (nested arrays of arrays/numbers) | ❌ expected (same class) |

The failing intents are exactly those whose allowed blocks contain **nested arrays of objects**. Even narrowed, that structure under strict JSON-mode + `thinkingBudget:0` is where `gemini-2.5-flash` degenerates.

## Findings
1. **Plans and normal chat share one schema and one call** — there is no dedicated action-plan response format. This couples the fragile heavy path to every message.
2. **Schema narrowing helped but did not solve it** — the remaining nested-array block types still exceed the model's reliable structured-output complexity.
3. Schema token size is not the issue (~500 tok); **structural complexity of the required output is.**

## Implication for Phase 2
Give complex, nested-array outputs (action_plan, family_script, comparison/matrix) a **separate, dedicated generation path** (own endpoint, simpler/looser schema or JSON-repair, and/or a stronger model), and keep the normal chat path to `text` + `quickReplies` (+ light blocks) so everyday coaching is a single fast, reliable call.
