import type { CuriosityCode } from "@/lib/core-v2/types";

/** Illustrated scene per curiosity, all eight in the report's clay style. */
export const CURIOSITY_SCENES: Partial<Record<CuriosityCode, string>> = {
  RD: "/report/curiosity-research-v2.webp",
  IE: "/report/curiosity-imagination-v1.webp",
  PW: "/report/curiosity-wellbeing-v2.webp",
  EI: "/report/curiosity-enterprise-v1.webp",
  PE: "/report/curiosity-planning-v1.webp",
  TS: "/report/curiosity-technology-v1.webp",
  IR: "/report/curiosity-invention-v1.webp",
  AE: "/report/curiosity-action-v1.webp",
};
