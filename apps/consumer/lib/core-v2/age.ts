/**
 * Age check (spec §2.2, §3.4, §10). Students give birth month and year only.
 * Under 13 stops the journey and nothing is saved; 13–17 needs a guardian's
 * consent before results are released; 18+ consents for themselves.
 */

export type AgeBand = "under13" | "13-17" | "18+";

export interface BirthMonth {
  year: number;
  /** 1–12. */
  month: number;
}

const MIN_AGE = 13;
const ADULT_AGE = 18;
const MAX_PLAUSIBLE_AGE = 100;

export function ageInYears({ year, month }: BirthMonth, today: Date): number {
  const currentYear = today.getUTCFullYear();
  const currentMonth = today.getUTCMonth() + 1;

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Birth month must be 1–12, got ${month}`);
  }
  if (!Number.isInteger(year) || year < currentYear - MAX_PLAUSIBLE_AGE) {
    throw new Error(`Birth year is not plausible: ${year}`);
  }
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    throw new Error("Birth date cannot be in the future");
  }

  // Without a day, the birth month itself counts as not yet reached, so a
  // borderline student is treated as younger (the protective side).
  const hasHadBirthday = currentMonth > month;
  return currentYear - year - (hasHadBirthday ? 0 : 1);
}

export function ageBandFor(birth: BirthMonth, today: Date): AgeBand {
  const age = ageInYears(birth, today);
  if (age < MIN_AGE) return "under13";
  if (age < ADULT_AGE) return "13-17";
  return "18+";
}
