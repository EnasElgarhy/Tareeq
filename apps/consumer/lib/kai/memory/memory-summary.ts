const MAX_PARAGRAPHS = 3;

/**
 * Keeps the person-level summary bounded at 2-3 paragraphs — never a
 * growing wall of text. If Gemini proposes something longer, only the
 * first three paragraphs survive.
 */
export function capSummary(summary: string): string {
  const paragraphs = summary
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return paragraphs.slice(0, MAX_PARAGRAPHS).join("\n\n");
}
