import type { Locale } from "@/lib/i18n/locale";
import { CORE_CONTENT_VERSIONS, coreWording } from "./core-content";

/**
 * Report wording by block ID (spec §6: "never hard-code report text"), from
 * file 04 (185 blocks, English and Arabic). A block missing from the file
 * renders as a visible "pending" marker.
 */

export const REPORT_WORDING_VERSION = CORE_CONTENT_VERSIONS.reportWording;

/** The block's text in this language, or null while the block is pending. */
export function wordingFor(locale: Locale, blockId: string): string | null {
  return coreWording(locale, blockId);
}
