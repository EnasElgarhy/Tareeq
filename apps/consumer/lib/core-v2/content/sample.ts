import type { CareerBank, CareerFamily, CareerJob, RouteTag } from "../bank";
import type { AxisAnswer, CoreAnswers, CuriosityCode, MotivatorCode } from "../types";

/**
 * PREVIEW ONLY. "Sara", the design canvas's sample student, and the slice of
 * the career bank her report shows. Families and jobs are the canvas's own;
 * their route tags are illustrative until file 05 (the real bank) arrives.
 * Never used for a real student's report.
 */

function repeat<T extends string>(counts: Partial<Record<T, number>>): T[] {
  return Object.entries(counts).flatMap(([code, n]) =>
    Array.from({ length: n as number }, () => code as T),
  );
}

function axis(axisCode: AxisAnswer["axis"], sides: AxisAnswer["side"][]): AxisAnswer[] {
  return sides.map((side) => ({ axis: axisCode, side }));
}

/** Close and coherent: RD 5, PW 4; leans S and T; motivated by IMP and MAS. */
export const SAMPLE_STUDENT: CoreAnswers = {
  curiosities: repeat<CuriosityCode>({ RD: 5, PW: 4, IE: 3, TS: 2, AE: 2 }),
  motivators: repeat<MotivatorCode>({ IMP: 5, MAS: 4, AUT: 2, REC: 1, SEC: 1, INC: 1 }),
  axes: [
    ...axis("structure", ["S", "S", "S", "F"]),
    ...axis("focus", ["D", "D", "B", "B"]),
    ...axis("team", ["T", "T", "T", "O"]),
    ...axis("setting", ["ST", "ST", "CH", "CH"]),
  ],
};

export const SAMPLE_STUDENT_NAME = "Sara";

const MIXED = { structure: "Mixed", focus: "Mixed", team: "Mixed", setting: "Mixed" } as const;

function job(
  id: string,
  name: string,
  routes: Partial<Record<keyof typeof MIXED, RouteTag>> = {},
  offers: MotivatorCode[] = [],
): CareerJob {
  return { id, name, routes: { ...MIXED, ...routes }, offers };
}

function family(
  id: string,
  name: string,
  curiosities: CareerFamily["curiosities"],
  jobs: CareerJob[],
  studyFields: string[],
): CareerFamily {
  return { id, name, curiosities, jobs, studyFields };
}

/** Families the canvas lists by name only; their jobs come with file 05. */
function namedOnly(id: string, name: string, code: CuriosityCode): CareerFamily {
  return family(id, name, [code], [], []);
}

export const SAMPLE_BANK: CareerBank = {
  families: [
    family(
      "F-RD-PW",
      "Clinical and health sciences",
      ["RD", "PW"],
      [
        job("J-CLIN-PSY", "Clinical psychologist", { team: "Together" }, ["IMP"]),
        job("J-DIET", "Dietitian", { structure: "Set out" }, ["IMP"]),
        job("J-GEN-COUN", "Genetic counsellor", {}, ["IMP"]),
        job("J-OCC-HEALTH", "Occupational health specialist"),
      ],
      ["Psychology", "Nutrition", "Genetics", "Public health"],
    ),
    family(
      "F-RD-MED",
      "Medicine and health sciences",
      ["RD"],
      [
        job("J-PHARM", "Pharmacist", { structure: "Set out" }, ["IMP"]),
        job("J-BIOMED", "Biomedical researcher", { team: "Together" }, ["MAS"]),
        job("J-DOC-DIAG", "Doctor (diagnostic specialties)", {}, ["IMP"]),
        job("J-MED-LAB", "Medical laboratory scientist", { team: "Own" }),
      ],
      ["Medicine", "pharmacy", "biomedical science", "medical laboratory science"],
    ),
    family(
      "F-RD-DATA",
      "Data and patterns",
      ["RD"],
      [
        job("J-ACTUARY", "Actuary", { structure: "Set out" }),
        job("J-STAT", "Statistician", { team: "Own" }),
        job("J-DATA-SCI", "Data scientist"),
        job("J-RES-ANALYST", "Research analyst"),
      ],
      ["Mathematics", "statistics", "data science", "actuarial science"],
    ),
    namedOnly("F-RD-INV", "Investigation and diagnosis", "RD"),
    namedOnly("F-RD-LIFE", "Life and environmental sciences", "RD"),
    namedOnly("F-RD-PHYS", "Physical and earth sciences", "RD"),
    namedOnly("F-RD-HUM", "Human behaviour and society", "RD"),
    family(
      "F-PW-CARE",
      "Patient care and therapy",
      ["PW"],
      [
        job("J-NURSE", "Nurse", { team: "Together" }, ["IMP"]),
        job("J-PHYSIO", "Physiotherapist", { team: "Together" }, ["IMP"]),
        job("J-SPEECH", "Speech therapist", { team: "Together" }),
        job("J-DOC-CARE", "Doctor (patient-care specialties)"),
      ],
      ["Nursing", "physiotherapy", "speech and language therapy", "medicine"],
    ),
    namedOnly("F-PW-MIND", "Mind and counselling", "PW"),
    namedOnly("F-PW-TEACH", "Teaching and learning", "PW"),
    namedOnly("F-PW-COMM", "Community and social care", "PW"),
    namedOnly("F-PW-COACH", "Coaching and people development", "PW"),
    namedOnly("F-PW-SERV", "Service and hospitality", "PW"),
  ],
};
