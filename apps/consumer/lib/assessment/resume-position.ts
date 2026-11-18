export interface ResumePosition {
  /** The student stopped in About you, which the counter does not count. */
  inAboutYou: boolean;
  /** 1-based number among the counted questions; 0 while in About you. */
  current: number;
  total: number;
}

/**
 * Where a returning student picks up, as the start screen says it: About
 * you has no number, and the assessment counts 1 to `countedQuestions`
 * (staging corrections of 6 Nov: "01/46 to 46/46", no counter in About you).
 *
 * @param resumeAt 1-based position among all screens' questions, About you included.
 */
export function resumePosition(
  resumeAt: number,
  totalQuestions: number,
  countedQuestions: number,
): ResumePosition {
  const aboutYou = Math.max(0, totalQuestions - countedQuestions);
  if (resumeAt <= aboutYou) {
    return { inAboutYou: true, current: 0, total: countedQuestions };
  }
  return {
    inAboutYou: false,
    current: Math.min(resumeAt - aboutYou, countedQuestions),
    total: countedQuestions,
  };
}
