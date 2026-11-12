/**
 * An email for a case-insensitive exact match with `.ilike()`. Without the
 * escaping, `_` and `%` in an address are LIKE wildcards, so s_ra@… would
 * match s.ra@…'s invitation (security review, 12 Nov 2026).
 */
export function exactEmailPattern(email: string): string {
  return email.trim().replace(/[\\%_]/g, (char) => `\\${char}`);
}
