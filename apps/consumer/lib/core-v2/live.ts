/**
 * Switches real students onto the CORE 2.0 model: question set 5.1, scoring
 * 2.0 and the new report in Compass. Off by default, so production keeps the
 * legacy v4 assessment until the founder signs off on the content.
 */
export const IS_CORE_V2_LIVE = process.env.NEXT_PUBLIC_CORE_V2_LIVE === "true";
