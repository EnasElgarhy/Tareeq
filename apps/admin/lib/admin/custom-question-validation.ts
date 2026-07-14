/**
 * Pure validation for Custom-assessment questions (custom_points_v1).
 *
 * No IO — used both client-side (instant feedback in the editor) and server-side
 * (authoritative guard in the save action), so the rules can never diverge.
 * Returns a list of human-readable error messages; an empty list means valid.
 */

export interface CustomOptionInput {
  letter: string;
  text: Record<string, string>; // { en, ar }
  /** Scoring category code, or null for an unscored answer. */
  categoryCode: string | null;
  /** Points awarded to the category when this answer is chosen. */
  points: number;
}

export interface CustomQuestionInput {
  kind: string; // "single" | "binary" | "select" | "text"
  title: Record<string, string>; // { en, ar }
  options: CustomOptionInput[];
}

const KINDS_WITH_OPTIONS = new Set(["single", "binary", "select"]);

export function questionKindHasOptions(kind: string): boolean {
  return KINDS_WITH_OPTIONS.has(kind);
}

export function validateCustomQuestion(
  input: CustomQuestionInput,
  validCategoryCodes: readonly string[],
): string[] {
  const errors: string[] = [];

  if (!(input.title?.en ?? "").trim()) {
    errors.push("English title is required.");
  }

  if (!questionKindHasOptions(input.kind)) {
    return errors; // text questions carry no answers/scoring
  }

  const options = input.options ?? [];
  const validCategories = new Set(validCategoryCodes);

  const letters = options.map((o) => (o.letter ?? "").trim().toUpperCase());
  if (letters.some((l) => l === "")) {
    errors.push("Every answer needs a letter.");
  }
  if (new Set(letters).size !== letters.length) {
    errors.push("Answer letters must be unique.");
  }

  if (input.kind === "single" && options.length < 2) {
    errors.push("A single-choice question needs at least 2 answers.");
  }
  if (input.kind === "binary" && options.length !== 2) {
    errors.push("A binary question needs exactly 2 answers.");
  }

  for (const option of options) {
    const label = (option.letter ?? "").trim().toUpperCase() || "?";
    if (!(option.text?.en ?? "").trim()) {
      errors.push(`Answer ${label}: English text is required.`);
    }
    if (option.categoryCode && !validCategories.has(option.categoryCode)) {
      errors.push(`Answer ${label}: unknown category "${option.categoryCode}".`);
    }
    // A scored answer (mapped to a category) must award positive points (DB
    // stores weight > 0). An unscored answer's points are ignored.
    if (option.categoryCode) {
      if (!Number.isFinite(option.points) || option.points <= 0) {
        errors.push(`Answer ${label}: a scored answer needs points greater than 0.`);
      }
    }
  }

  return errors;
}
