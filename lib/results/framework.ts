import type { CompassResult, Question } from "@/lib/scoring";
import type {
  EcosystemFitName,
  PersonalizedCompassReport,
  ResultSource,
} from "@/lib/results/types";
import type { ClusterCode, DriverCode } from "@/lib/scoring/types";
import { getLocalizedText } from "@/lib/assessment/questions";

type ClusterProfile = {
  name: string;
  essence: string;
  subjects: string[];
  majors: string[];
  careers: string[];
  nonObvious: string[];
  realityCheck: string;
  nextStep: string;
};

export const CLUSTER_PROFILES: Record<ClusterCode, ClusterProfile> = {
  TECH: {
    name: "Technology",
    essence:
      "systems, code, digital infrastructure, and solving problems through software",
    subjects: [
      "Computer Science or IT",
      "Mathematics",
      "Further Maths if available",
      "Physics",
      "Design Technology",
    ],
    majors: [
      "Computer Science",
      "Software Engineering",
      "Data Science",
      "Artificial Intelligence",
      "Cybersecurity",
      "Information Systems",
      "Computer Engineering",
      "Applied Mathematics",
    ],
    careers: [
      "Software Engineer",
      "Data Engineer",
      "DevOps Engineer",
      "AI/ML Engineer",
      "Cybersecurity Analyst",
      "Systems Architect",
      "Technical Product Manager",
      "Site Reliability Engineer",
    ],
    nonObvious: [
      "Civic Tech",
      "Legal Tech",
      "HealthTech",
      "EdTech",
      "Climate Tech",
      "Computational Biology",
    ],
    realityCheck:
      "Technology changes fast. Continuous learning is non-negotiable, and some roles carry real burnout risk through on-call work, startup pressure, or constant tool churn.",
    nextStep:
      "Build one tiny digital thing this week: a calculator, a Notion automation, a personal website, or a script that saves you five minutes.",
  },
  ENG: {
    name: "Engineering",
    essence:
      "designing, building, testing, and improving physical systems that have to work in the real world",
    subjects: [
      "Physics",
      "Mathematics",
      "Design Technology",
      "Engineering",
      "Chemistry",
    ],
    majors: [
      "Mechanical Engineering",
      "Civil Engineering",
      "Electrical Engineering",
      "Aerospace Engineering",
      "Robotics Engineering",
      "Biomedical Engineering",
      "Chemical Engineering",
      "Materials Science",
    ],
    careers: [
      "Mechanical Engineer",
      "Civil Engineer",
      "Robotics Engineer",
      "Aerospace Engineer",
      "Design Engineer",
      "Manufacturing Engineer",
      "Quality Assurance Engineer",
      "R&D Engineer",
    ],
    nonObvious: [
      "Patent Law",
      "Engineering Consulting",
      "Technical Sales",
      "Prosthetics Design",
      "Sustainability Engineering",
      "Forensic Engineering",
    ],
    realityCheck:
      "Engineering requires serious study and often professional certification. Early roles involve CAD modelling, testing, documentation, and constraints that make ideas harder than they looked on paper.",
    nextStep:
      "Take apart one everyday object in your head: a hinge, fan, bicycle, kettle, or lift. Sketch the parts and find out why each one exists.",
  },
  SCI: {
    name: "Science and Data",
    essence:
      "research, evidence, patterns, experiments, and understanding how complex systems behave",
    subjects: [
      "Biology",
      "Chemistry",
      "Physics",
      "Mathematics",
      "Statistics",
      "Computer Science",
    ],
    majors: [
      "Biology",
      "Chemistry",
      "Physics",
      "Biochemistry",
      "Neuroscience",
      "Data Science",
      "Environmental Science",
      "Genetics",
    ],
    careers: [
      "Research Scientist",
      "Data Scientist",
      "Lab Technician",
      "Clinical Research Coordinator",
      "Quantitative Analyst",
      "Epidemiologist",
      "Bioinformatics Specialist",
      "Environmental Scientist",
    ],
    nonObvious: [
      "Science Policy Advisor",
      "Technical Writer",
      "Forensic Scientist",
      "Pharmaceutical Researcher",
      "Science Journalism",
      "Quantitative Finance",
    ],
    realityCheck:
      "Research can be slow, repetitive, and competitive. Academic paths often require graduate study, while data roles expect strong statistics, coding, and evidence discipline.",
    nextStep:
      "Pick one claim you saw online this week and trace the evidence behind it. Find the original study, dataset, or source instead of stopping at the headline.",
  },
  ART: {
    name: "Arts and Media",
    essence:
      "storytelling, design, creative expression, communication, visual thinking, and narrative craft",
    subjects: [
      "Art or Visual Arts",
      "Design Technology",
      "Media Studies",
      "Film Studies",
      "English or Literature",
      "Drama",
      "Music",
    ],
    majors: [
      "Graphic Design",
      "Film and Television Production",
      "Journalism",
      "Creative Writing",
      "Fine Arts",
      "Digital Media",
      "Animation",
      "Photography",
    ],
    careers: [
      "Graphic Designer",
      "Film/Video Editor",
      "Copywriter",
      "Art Director",
      "UX/UI Designer",
      "Photographer",
      "Content Creator",
      "Journalist",
    ],
    nonObvious: [
      "UX Research",
      "Medical Illustration",
      "Science Communication",
      "Game Design",
      "Exhibition Curator",
      "Documentary Filmmaking",
    ],
    realityCheck:
      "Creative fields are competitive. A portfolio, network, and resilience matter as much as formal study, and early work is often freelance, contract-based, or inconsistent.",
    nextStep:
      "Make one finished piece this week and publish it somewhere small: a poster, short edit, essay, photo set, interface mockup, or explainer.",
  },
  BUS: {
    name: "Business",
    essence:
      "strategy, entrepreneurship, commerce, market dynamics, and practical problem-solving around money and operations",
    subjects: [
      "Mathematics",
      "Economics",
      "Business Studies",
      "Accounting",
      "Geography",
    ],
    majors: [
      "Business Administration",
      "Economics",
      "Finance",
      "Accounting",
      "Marketing",
      "Entrepreneurship",
      "International Business",
      "Supply Chain Management",
    ],
    careers: [
      "Business Analyst",
      "Marketing Manager",
      "Financial Analyst",
      "Product Manager",
      "Strategy Consultant",
      "Founder",
      "Sales Manager",
      "Operations Manager",
    ],
    nonObvious: [
      "Social Enterprise",
      "Business Development in Tech",
      "Impact Investing",
      "Sports Management",
      "Startup Operations",
      "E-commerce Strategy",
    ],
    realityCheck:
      "Business is broad. You need a specific skill stack: finance, marketing, operations, analytics, or sales. Entrepreneurship is unstable, and corporate roles can bring long hours and politics.",
    nextStep:
      "Choose one product you use every day and map how it makes money, finds customers, delivers value, and keeps costs under control.",
  },
  LAW: {
    name: "Law and Diplomacy",
    essence:
      "governance, negotiation, policy, justice, international relations, and systems of rules",
    subjects: [
      "English or Literature",
      "History",
      "Government and Politics",
      "Economics",
      "Languages",
    ],
    majors: [
      "Law (LLB)",
      "Political Science",
      "International Relations",
      "Public Policy",
      "Criminology",
      "Philosophy, Politics and Economics",
      "Human Rights",
    ],
    careers: [
      "Lawyer",
      "Diplomat",
      "Policy Analyst",
      "Legal Consultant",
      "Paralegal",
      "International Relations Officer",
      "Human Rights Advocate",
      "Political Advisor",
    ],
    nonObvious: [
      "Corporate Compliance",
      "Legal Tech",
      "Mediation",
      "Immigration Law",
      "Sports Law",
      "Environmental Law",
      "NGO Policy Director",
    ],
    realityCheck:
      "Law requires extra professional qualifications after university. The field is competitive, seniority matters, and early roles can involve long hours, research, document review, and pressure.",
    nextStep:
      "Pick one public issue you care about and read two opposing arguments. Write the strongest case for each side before choosing where you stand.",
  },
  PPL: {
    name: "People and Psychology",
    essence:
      "human behaviour, wellbeing, education, community, interpersonal dynamics, and social systems",
    subjects: [
      "Psychology",
      "Biology",
      "Sociology",
      "English or Literature",
      "Philosophy",
    ],
    majors: [
      "Psychology",
      "Counselling",
      "Psychotherapy",
      "Social Work",
      "Human Resources",
      "Education",
      "Public Health",
      "Sociology",
    ],
    careers: [
      "Clinical Psychologist",
      "Counsellor",
      "Social Worker",
      "HR Manager",
      "Teacher",
      "Community Outreach Coordinator",
      "UX Researcher",
      "Organisational Development Consultant",
    ],
    nonObvious: [
      "User Experience Research",
      "Sports Psychology",
      "Forensic Psychology",
      "Market Research",
      "Employee Wellbeing",
      "Conflict Resolution",
    ],
    realityCheck:
      "Many psychology, counselling, and social work paths require graduate study and supervised hours. The work can be emotionally demanding, and boundaries are essential.",
    nextStep:
      "Interview one person about a decision they made recently. Ask what they wanted, what blocked them, and what helped. Listen for patterns, not advice.",
  },
  ENV: {
    name: "Environment",
    essence:
      "ecology, sustainability, natural systems, conservation, climate, and planetary health",
    subjects: [
      "Biology",
      "Geography",
      "Chemistry",
      "Environmental Science",
      "Mathematics",
    ],
    majors: [
      "Environmental Science",
      "Ecology",
      "Conservation Biology",
      "Environmental Engineering",
      "Sustainability Studies",
      "Marine Biology",
      "Forestry",
      "Climate Science",
    ],
    careers: [
      "Environmental Consultant",
      "Conservation Scientist",
      "Marine Biologist",
      "Sustainability Coordinator",
      "Environmental Engineer",
      "Wildlife Biologist",
      "Climate Data Analyst",
      "Park Ranger",
    ],
    nonObvious: [
      "Corporate Sustainability",
      "Environmental Law",
      "Green Architecture",
      "Climate Finance",
      "Renewable Energy",
      "Environmental Journalism",
    ],
    realityCheck:
      "Environmental careers can involve fieldwork, lower-paying nonprofit roles, slow policy change, and emotional fatigue. Corporate sustainability pays more but can be further from direct ecological work.",
    nextStep:
      "Choose one local environmental issue and trace the system around it: who causes it, who pays the cost, who regulates it, and who is already working on it.",
  },
};

const DRIVER_COPY: Record<DriverCode, string> = {
  REC: "look for roles where good work becomes visible: leadership, public-facing output, published work, awards, or clear ownership",
  IMP: "look for work where you can see who benefits and how the outcome changes someone’s day",
  AUT: "look for paths with ownership, remote work, freelancing potential, or small teams where you control the shape of the work",
  MAS: "look for deep technical tracks, specialisation, expert mentors, and work that keeps raising the bar",
  STA: "look for clear career ladders, regulated industries, government paths, or organisations with predictable income and progression",
};

const ARCHETYPE_COPY: Record<CompassResult["archetype"], string> = {
  Precisionist:
    "You work best when the craft is clear, the standards are high, and depth matters.",
  Coordinator:
    "You work best when you can organise moving parts, create structure, and keep complex work calm.",
  Explorer:
    "You work best when you can learn by doing, investigate, prototype, and go deep through direct contact with the problem.",
  Catalyst:
    "You work best when you can connect ideas quickly, move across domains, and create momentum with other people.",
  Adaptive:
    "You shift between structure and flexibility depending on the context, so test environments before committing to one work style.",
};

export function getEcosystemFit(result: CompassResult): EcosystemFitName {
  if (result.ecosystemFit) return result.ecosystemFit;

  const social =
    result.axes.social.collaborative >= result.axes.social.independent
      ? "COL"
      : "IND";
  const environment =
    result.axes.environment.dynamic >= result.axes.environment.predictable
      ? "DYN"
      : "PRE";

  if (social === "COL" && environment === "DYN")
    return "High-Energy Team Player";
  if (social === "COL" && environment === "PRE")
    return "Structured Team Player";
  if (social === "IND" && environment === "DYN") return "Solo Sprinter";
  return "Solo Specialist";
}

export function getMultiCuriousClusters(result: CompassResult) {
  if (result.multiCuriousClusters?.length) return result.multiCuriousClusters;

  const topScore = result.clusterRanked[0]?.[1] ?? 0;
  const close = result.clusterRanked.filter(
    ([, score]) => topScore - score <= 1,
  );
  return close.length >= 3 ? close.slice(0, 3).map(([code]) => code) : [];
}

export function createAnswerDigest(
  answers: Record<string, string>,
  questions: Question[],
) {
  return questions
    .filter((question) => answers[question.externalId])
    .map((question) => {
      const value = answers[question.externalId];
      const option = question.options.find((entry) => entry.letter === value);

      return {
        id: question.externalId,
        pillar: question.pillar,
        question: getLocalizedText(question.title),
        answer: option ? getLocalizedText(option.text) : value,
      };
    });
}

export function buildFallbackReport({
  result,
  name,
  source = "fallback",
  fallbackReason,
  model,
}: {
  result: CompassResult;
  name?: string;
  source?: ResultSource;
  fallbackReason?: string;
  model?: string;
}): PersonalizedCompassReport {
  const cluster = CLUSTER_PROFILES[result.topCluster];
  const firstName = name?.trim().split(/\s+/)[0];
  const driverName =
    result.primaryDrivers.length > 0
      ? result.primaryDrivers.map((code) => result.driverNames[code]).join(", ")
      : "Balanced motivations";
  const secondaryDriverName =
    result.secondaryDrivers.length > 0
      ? result.secondaryDrivers
          .map((code) => result.driverNames[code])
          .join(", ")
      : result.driverNames[result.secondaryDriver];
  const ecosystemFit = getEcosystemFit(result);
  const multiCuriousCodes = getMultiCuriousClusters(result);
  const isMultiCurious = multiCuriousCodes.length >= 3;
  const multiCuriousClusters = multiCuriousCodes.map(
    (code) => CLUSTER_PROFILES[code].name,
  );
  const greeting = firstName ? `${firstName}, your` : "Your";
  const motivationSentence =
    result.primaryDrivers.length > 0
      ? `You are primarily motivated by ${driverName}, with ${secondaryDriverName} also showing up strongly, so ${DRIVER_COPY[result.primaryDriver]}.`
      : "Your motivations look balanced, so context matters: judge opportunities by the team, mission, learning curve, and stability together.";

  const headline = isMultiCurious
    ? "Your Compass points toward intersections"
    : `Your Compass points toward ${cluster.name}`;

  const summary = isMultiCurious
    ? `${greeting} curiosities span ${multiCuriousClusters.join(
        ", ",
      )}. This is not confusion; it is a signal to explore intersections where multiple fields meet.`
    : `${greeting} curiosities point toward ${cluster.essence}. This is a direction to explore, not a box to live inside.`;

  return {
    generatedAt: new Date().toISOString(),
    source,
    model,
    fallbackReason,
    clusterCode: result.topCluster,
    clusterName: cluster.name,
    isMultiCurious,
    multiCuriousClusters,
    archetype: result.archetype,
    primaryDriver: driverName,
    secondaryDriver: secondaryDriverName,
    ecosystemFit,
    headline,
    summary,
    academicPath: `If you are still in high school, prioritise ${cluster.subjects
      .slice(0, 5)
      .join(
        ", ",
      )}. If your school uses A-Levels, Tawjihi, IB, or another track, choose the version of those subjects that gives you the strongest foundation. At university, explore ${cluster.majors
      .slice(0, 8)
      .join(
        ", ",
      )}. These paths build the habits this territory asks for: evidence, practice, discipline, and the ability to turn interest into useful work.`,
    careerLandscape: `Early paths can include ${cluster.careers
      .slice(0, 5)
      .join(
        ", ",
      )}. As you build skill, the path can widen into specialist, leadership, consulting, or founder tracks. Do not ignore the less obvious routes: ${cluster.nonObvious
      .slice(0, 5)
      .join(
        ", ",
      )}. Those intersections are often where young people find sharper opportunities than the obvious job titles.`,
    integration: `Your operational style is ${result.archetype}. ${
      ARCHETYPE_COPY[result.archetype]
    } ${motivationSentence} Your strongest environment signal is ${ecosystemFit}; use that when judging schools, internships, teams, and first jobs.`,
    realityCheck: `${cluster.realityCheck} Because ${driverName} is a strong reward driver for you, pay attention to whether a path actually provides that reward day to day, not just in the brochure.`,
    nextSteps: `This week: ${cluster.nextStep} This term: speak to one student, graduate, or working professional already close to this field. This year: build proof. A small project, portfolio piece, experiment, volunteer role, or shadowing day will teach you more than another hour of guessing.`,
    highSchoolSubjects: cluster.subjects,
    universityMajors: cluster.majors,
    careerExamples: cluster.careers,
    nonObviousPaths: cluster.nonObvious,
    score: result,
  };
}
