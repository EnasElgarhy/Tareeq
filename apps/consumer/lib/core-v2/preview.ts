/**
 * The CORE 2.0 report preview (/compass?preview=core-v2) shows sample
 * answers so the new report can be reviewed before real content arrives.
 * Never available in production unless NEXT_PUBLIC_CORE_V2_PREVIEW is set
 * (e.g. on staging).
 */
export const IS_CORE_PREVIEW_ALLOWED =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_CORE_V2_PREVIEW === "true";

export function isCoreReportPreview(pathname: string, search: string): boolean {
  return (
    IS_CORE_PREVIEW_ALLOWED &&
    pathname === "/compass" &&
    new URLSearchParams(search).get("preview") === "core-v2"
  );
}
