import type { AxisCode, AxisSide, CuriosityCode, MotivatorCode } from "./types";

/**
 * Career bank shape (file 05: 76 families, 304 jobs). Bank order is the
 * array order and breaks every tie in Section 4. An adapter maps the
 * delivered JSON onto this shape once the file arrives.
 */

export type RouteTag =
  | "Set out"
  | "Open"
  | "Deep"
  | "Broad"
  | "Together"
  | "Own"
  | "Steady"
  | "Changing"
  | "Mixed"
  | "No data";

export interface CareerJob {
  id: string;
  name: string;
  routes: Record<AxisCode, RouteTag>;
  /** Motivators this job "often offers". SEC and FAM are never matched. */
  offers: readonly MotivatorCode[];
}

export interface CareerFamily {
  id: string;
  name: string;
  /** One code for a single-curiosity family, two for a combination ("meet") family. */
  curiosities: readonly [CuriosityCode] | readonly [CuriosityCode, CuriosityCode];
  jobs: readonly CareerJob[];
  studyFields: readonly string[];
}

export interface CareerBank {
  families: readonly CareerFamily[];
}

/** Student side → the route tag a job must carry to match it (spec §6.4). */
export const SIDE_TO_TAG: Record<AxisSide, RouteTag> = {
  S: "Set out",
  F: "Open",
  D: "Deep",
  B: "Broad",
  T: "Together",
  O: "Own",
  ST: "Steady",
  CH: "Changing",
};
