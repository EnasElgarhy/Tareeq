/**
 * Deterministic text → block extraction. Applied server-side after
 * Gemini responds, before the required-blocks check (required-blocks.ts)
 * decides whether a stricter retry is needed. Only handles patterns that
 * can be extracted *safely* — a day-by-day plan or a bullet list is
 * genuinely present in the prose, just in the wrong shape. Resource
 * recommendations are deliberately NOT repaired here: synthesizing
 * title/author/difficulty/time from prose would mean inventing plausible
 * -sounding but fake resource metadata, which is worse than falling
 * through to a retry or the generic fallback template.
 */

/** Removes decorative markdown syntax while keeping the words — applied
 * to every text-ish field server-side; KaiTextMessage.tsx also strips
 * client-side as a second safety net for anything that slips through. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(?<!\*)\*(?!\*)([^*\n]+?)\*(?!\*)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
}

const BULLET_LINE = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/;

/** Finds a contiguous run of markdown-style bullet lines and splits the
 * text into a lead-in sentence plus the extracted items. Requires at
 * least 2 bullets in a row (a stray "-" mid-sentence shouldn't trigger
 * extraction) and returns null when no clean run is found. Expects
 * already-markdown-stripped input. */
export function extractBulletsFromText(text: string): { leadIn: string; items: string[] } | null {
  const lines = text.split(/\r?\n/);
  const bulletIndices: number[] = [];
  lines.forEach((line, index) => {
    if (BULLET_LINE.test(line)) bulletIndices.push(index);
  });
  if (bulletIndices.length < 2) return null;

  const first = bulletIndices[0];
  const isContiguous = bulletIndices.every((value, i) => value === first + i);
  if (!isContiguous) return null;

  const items = bulletIndices
    .map((index) => lines[index].match(BULLET_LINE)?.[1]?.trim())
    .filter((item): item is string => Boolean(item));
  if (items.length < 2) return null;

  const leadIn = lines.slice(0, first).join(" ").replace(/\s+/g, " ").trim();
  return { leadIn, items };
}

const DAY_LINE = /^\s*(?:day|week)\s*\d+\s*[:.\-–]\s*(.+)$/i;

/** Finds "Day 1: ...", "Day 2: ..." (or "Week N:") lines and extracts
 * them into plain task phrases — the deterministic fix for a model that
 * wrote a day-by-day plan as prose instead of an action_plan block.
 * Requires at least 2 day/week lines. Expects already-stripped input. */
export function extractDayPlanFromText(text: string): { leadIn: string; tasks: string[] } | null {
  const lines = text.split(/\r?\n/);
  const dayIndices: number[] = [];
  lines.forEach((line, index) => {
    if (DAY_LINE.test(line)) dayIndices.push(index);
  });
  if (dayIndices.length < 2) return null;

  const tasks = dayIndices
    .map((index) => lines[index].match(DAY_LINE)?.[1]?.trim())
    .filter((task): task is string => Boolean(task));
  if (tasks.length < 2) return null;

  const leadIn = lines.slice(0, dayIndices[0]).join(" ").replace(/\s+/g, " ").trim();
  return { leadIn, tasks };
}
