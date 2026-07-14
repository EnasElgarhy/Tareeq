import { computeScore } from "./index";
import { scoreCustomAssessment } from "./spec-executor";
import type { ScoringSpec, SpecOutcome } from "./spec-types";
import type { CompassResult, Question } from "./types";

/**
 * Deterministic scoring dispatch by assessment engine.
 *
 *  - `core`   → the existing, untouched CORE engine (`computeScore`).
 *  - `custom` → the ScoringSpec executor (`scoreCustomAssessment`).
 *
 * Pure: a function of (engine, answers, questions, spec). The same inputs always
 * produce the same result. This is the single seam the live student flow will
 * call; AI never participates in either branch.
 */

export type AssessmentEngine = "core" | "custom";

export type DispatchResult =
  | { engine: "core"; result: CompassResult }
  | { engine: "custom"; result: SpecOutcome };

export interface DispatchInput {
  engine: AssessmentEngine;
  answers: Record<string, string>;
  questions: Question[];
  /** Required for `custom`; ignored for `core`. */
  spec?: ScoringSpec | null;
}

export function dispatchScore(input: DispatchInput): DispatchResult {
  if (input.engine === "custom") {
    if (!input.spec) {
      throw new Error("Custom assessment requires a scoring spec.");
    }
    return {
      engine: "custom",
      result: scoreCustomAssessment(input.answers, input.questions, input.spec),
    };
  }
  return {
    engine: "core",
    result: computeScore(input.answers, input.questions),
  };
}
