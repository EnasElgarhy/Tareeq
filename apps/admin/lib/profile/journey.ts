import {
  readGeneratedReport,
  readResultRegistration,
} from "@/lib/results/storage";
import type { PersonalizedCompassReport, ResultRegistration } from "@/lib/results/types";

/**
 * The Profile Journey — what assessments exist, which ones the user
 * has completed, and what their results unlock in their personal
 * profile page.
 *
 * Phase 1 ships with one live module (the CORE Compass assessment).
 * The remaining modules are visible-but-locked placeholders so the
 * user can see their profile growing as new assessments roll out.
 */

export type ModuleStatus = "available" | "completed" | "locked";

/** Every assessment Tareeq plans to ship, in the order users meet them. */
export const ASSESSMENT_MODULES = [
  {
    id: "core-compass",
    name: "CORE Compass",
    tagline: "Your career direction in 40 questions.",
    description:
      "Maps your curiosities, operations, rewards, and ecosystems into a primary cluster + persona snapshot.",
    durationLabel: "12 min",
    icon: "compass",
    status: "available" as const,
    route: "/start",
  },
  {
    id: "deep-dive",
    name: "Deep Dive Interview",
    tagline: "A 1-on-1 conversation with Kai, voiced.",
    description:
      "Live voice interview that goes deeper on the threads from your CORE result. Unlocks a long-form portrait of how you think.",
    durationLabel: "~25 min",
    icon: "interview",
    status: "locked" as const,
    requires: "core-compass",
  },
  {
    id: "skills-audit",
    name: "Skills Audit",
    tagline: "What you already have, what you're missing.",
    description:
      "A guided inventory of the hard and soft skills your top cluster actually rewards — with a personalised gap plan.",
    durationLabel: "~15 min",
    icon: "skills",
    status: "locked" as const,
    requires: "core-compass",
  },
  {
    id: "pulse-check",
    name: "Career Pulse",
    tagline: "A monthly check-in on where you're heading.",
    description:
      "Light 5-minute pulse every 4 weeks. Tracks how your interests and direction shift as you move through school, scholarships, and first jobs.",
    durationLabel: "5 min",
    icon: "pulse",
    status: "locked" as const,
    requires: "core-compass",
  },
] as const;

export type AssessmentModuleId = (typeof ASSESSMENT_MODULES)[number]["id"];

/** A computed snapshot of the user's progress across all modules. */
export interface ProfileSnapshot {
  registration: ResultRegistration | null;
  coreReport: PersonalizedCompassReport | null;
  modules: ReadonlyArray<{
    id: AssessmentModuleId;
    name: string;
    tagline: string;
    description: string;
    durationLabel: string;
    icon: string;
    status: ModuleStatus;
    completedAt: string | null;
    route?: string;
  }>;
  /** Number of modules completed (0–N). */
  completedCount: number;
  /** Total modules planned (live + locked). */
  totalCount: number;
  /** Integer percent of the journey complete, 0–100. */
  completionPct: number;
  /** Has the user finished anything? Drives empty-state UI. */
  hasAnyResult: boolean;
}

/**
 * Compose a profile snapshot from local storage. Pure read — never
 * writes. Safe to call on the server (returns an empty snapshot).
 */
export function readProfileSnapshot(): ProfileSnapshot {
  const registration =
    typeof window === "undefined" ? null : readResultRegistration();
  const coreReport =
    typeof window === "undefined" ? null : readGeneratedReport();

  const modules = ASSESSMENT_MODULES.map((mod) => {
    if (mod.id === "core-compass") {
      const completed = Boolean(coreReport);
      return {
        id: mod.id,
        name: mod.name,
        tagline: mod.tagline,
        description: mod.description,
        durationLabel: mod.durationLabel,
        icon: mod.icon,
        status: (completed ? "completed" : "available") as ModuleStatus,
        completedAt: coreReport?.generatedAt ?? null,
        route: completed ? "/results" : mod.route,
      };
    }
    // Locked modules — visible but greyed out. They become "available"
    // once their prerequisite is complete (currently the CORE Compass).
    const prereqMet = Boolean(coreReport);
    return {
      id: mod.id,
      name: mod.name,
      tagline: mod.tagline,
      description: mod.description,
      durationLabel: mod.durationLabel,
      icon: mod.icon,
      status: (prereqMet ? "locked" : "locked") as ModuleStatus,
      completedAt: null,
      route: undefined,
    };
  });

  const completedCount = modules.filter((m) => m.status === "completed").length;
  const totalCount = modules.length;
  const completionPct = Math.round((completedCount / totalCount) * 100);

  return {
    registration,
    coreReport,
    modules,
    completedCount,
    totalCount,
    completionPct,
    hasAnyResult: completedCount > 0,
  };
}
