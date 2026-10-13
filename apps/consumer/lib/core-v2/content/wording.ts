import type { Locale } from "@/lib/i18n/locale";

/**
 * Report wording by block ID (spec §6: "never hard-code report text").
 *
 * PROVISIONAL. File 04 (181 blocks, EN + AR) has not been delivered, so these
 * are the sample lines from the founder's design canvas (version B), mapped to
 * the block IDs the spec names. Blocks the canvas does not show are absent and
 * render as a visible "pending" marker. When file 04 arrives, replace this map
 * with an import of its data; no component changes.
 */

export const REPORT_WORDING_VERSION = "provisional-canvas-2026-10-01";

type Wording = Readonly<Record<string, string>>;

const EN: Wording = {
  // Section 1 · Before you read
  "S1-TITLE": "Before you read",
  "S1-B1":
    "This report shows where your curiosity points, how you like to work, and what motivates you most, based on your answers today.",
  "S1-B2": "It's not a test score, and it doesn't decide anything for you.",
  "S1-B3": "You know yourself best. Keep what feels right, and question what doesn't.",
  "S1-B4": "It suggests directions to explore, not one single answer.",
  "S1-B5": "Interests change as you grow. That's normal.",
  "S1-B6": "Talk it through with Kai at any point.",
  "S1-KEY-TITLE": "Your report follows the four letters of CORE",
  "S1-KEY-C": "Curiosities: **what** sparks your curiosity",
  "S1-KEY-O": "Operating style: **how** you like to work",
  "S1-KEY-R": "Rewards: **why** one path appeals more than another",
  "S1-KEY-E": "Ecosystem: **where**, meaning your work setting",

  // Section 2 · At a glance
  "S2-TITLE": "Your CORE picture at a glance",
  "S2-C-TITLE": "What sparks your curiosity",
  "S2-C-CLOSE": "Two or more directions are nearly level.",
  "S2-C-COHERENT": "They connect into one direction.",
  "S2-O-TITLE": "How you like to work",
  "S2-O-BAR1-HEAD": "How set out you like the work",
  "S2-O-BAR1-A": "Steps set out for you",
  "S2-O-BAR1-B": "Room to find your own way",
  "S2-O-BAR2-HEAD": "Going deep or covering a range",
  "S2-O-BAR2-A": "Going deep into one thing",
  "S2-O-BAR2-B": "Many topics, connected",
  "BAR-MID": "A mix of both",
  "P2-QUALIFIER": "This describes how you answered, not how you'll do.",
  "S2-R-TITLE": "What motivates you most",
  "S2-R-OTHERS": "Also part of the picture",
  "S2-E-TITLE": "Your work setting",
  "S2-E-LINE":
    "Whether you'd rather work alongside others or on your own, and how much you'd like your days to change.",
  "S2-E-BAR1-HEAD": "Team or individual work",
  "S2-E-BAR1-A": "Side by side with others",
  "S2-E-BAR1-B": "On your own",
  "S2-E-BAR2-HEAD": "A steady or changing work setting",
  "S2-E-BAR2-A": "A familiar place and rhythm",
  "S2-E-BAR2-B": "Something different every day",
  "S2-NEXT": "Next: where this could lead",

  // Curiosities (names from spec §4.1; pulls and descriptions from the canvas)
  "CUR-RD-NAME": "Research & Discovery",
  "CUR-IE-NAME": "Imagination & Expression",
  "CUR-PW-NAME": "People & Wellbeing",
  "CUR-EI-NAME": "Enterprise & Influence",
  "CUR-PE-NAME": "Planning & Execution",
  "CUR-TS-NAME": "Technology & Systems",
  "CUR-IR-NAME": "Invention & Repair",
  "CUR-AE-NAME": "Action & Endurance",
  "CUR-RD-PULL": "Finding out why things happen",
  "CUR-PW-PULL": "Understanding people and helping them",

  // Motivators
  "DRV-REC-NAME": "Being looked up to for what you do",
  "DRV-IMP-NAME": "Making a difference for others and your community",
  "DRV-MAS-NAME": "Getting really good at something difficult",
  "DRV-AUT-NAME": "Being in charge of your own work",
  "DRV-SEC-NAME": "A steady, secure career",
  "DRV-INC-NAME": "High earnings",
  "DRV-FAM-NAME": "A path your family is proud of",
  "DRV-LIF-NAME": "A life beyond work",

  // Section 3 · What sparks your curiosity
  "S3-TITLE": "What sparks your curiosity",
  "S3-INTRO":
    "Your answers suggest your curiosity leans toward the following. Each one describes what draws your interest and drives your curiosity, not a school subject.",
  "S3-NOTICE-LABEL": "You might notice it when",
  "S3-RD-DESC":
    "You want to know why. The answer itself is the reward: understanding how something works, what causes it, and what the evidence says.",
  "S3-RD-EX1": "you keep asking “but why?” after the lesson ends",
  "S3-RD-EX2": "you look things up just to understand them",
  "S3-RD-EX3": "a puzzle or mystery stays on your mind",
  "S3-PW-DESC":
    "People themselves interest you: how they think and feel, and how to help them through things. Seeing someone better off is the reward.",
  "S3-PW-EX1": "friends come to you when something is wrong",
  "S3-PW-EX2": "you notice when someone is upset or left out",
  "S3-PW-EX3": "you'd rather help someone learn than do it for them",
  "S3-KAI-Q": "Which of these curiosities feels most like you, and which feels least?",

  // Section 4 · What this means for you
  "S4-TITLE": "What this means for you: where your curiosities could lead",
  "S4-INTRO":
    "These are the job families your curiosities point to, starting with those closest to your answers about how you like to work, what motivates you, and your work setting. They're areas to explore, not a list to choose from.",
  "S4-MEET-TITLE": "Where your curiosities meet",
  "S4-MEET-CLOSE": "These fields bring your curiosities together.",
  "S4-CLOSEST": "Closest to your answers",
  "S4-MATCH-WORK": "Matches how you like to work. This work usually offers:",
  "S4-MATCH-DRV": "Often offers what motivates you:",
  "S4-PH-SET": "clear steps and expectations",
  "S4-PH-TOGETHER": "close teamwork",
  "S4-STUDY-LABEL": "Study fields:",
  "S4-CHECK-LABEL": "Worth checking:",
  "S4-CHECK-TEAM": "How much of the work is done with others?",
  "S4-CHECK-SETTING": "How much do the place and the people change from day to day?",
  "S4-MORE-LABEL": "More families in this direction:",
  "S4-REQ-NOTE":
    "Study fields are the usual routes. Entry requirements differ by country, school system and university, so check them with your school counsellor and on university websites.",
  "S4-KAI-Q":
    "Which family would you like to know more about? Ask what a typical day looks like, or how it measures up against what motivates you.",

  // Section 5 · Your next steps
  "S5-TITLE": "Your next steps: how to explore further",
  "S5-INTRO":
    "The best way to know whether a direction suits you is to get a taste of it and ask the right people.",
  "S5-WATCH-LABEL": "Watch",
  "S5-WATCH":
    "Search for “a day in the life of [job]” and notice what you’d enjoy and what you wouldn’t.",
  "S5-TRY-LABEL": "Try",
  "S5-TRY-RD": "Pick a question that puzzles you and spend a week finding the answer.",
  "S5-TALK-LABEL": "Talk",
  "S5-TALK": "Find someone who works in [family] and ask them:",
  "S5-YARD-IMP": "“Who does this work help, and would you see the difference?”",
  "S5-YARD-MAS":
    "“How long does it take to get really good at it, and does it keep challenging you?”",
  "S5-ASK-LABEL": "Ask schools and universities",
  "S5-ASK": "At an open day or a school visit, ask staff or students:",
  "S5-SCHOOL-STRUCTURE":
    "“How much of the course is set out step by step, and how much is independent work?”",
  "S5-SCHOOL-IMP": "“Are there projects or placements that help the community?”",
  "S5-KAI-Q":
    "Before a visit, Kai can help you prepare your questions. Afterwards, tell Kai what you tried and what you noticed.",

  // Section 6 · For parents
  "S6-TITLE": "For parents",
  "S6-B1":
    "This report describes your child’s answers today: what sparks their curiosity and what motivates them. It isn’t a measure of ability or a prediction.",
  "S6-B2":
    "Your interest helps most when you explore together. Ask what feels right to them, rather than what they should choose.",
  "S6-B3": "Take the questions in “Your next steps” to open days and school meetings together.",
  "S6-B4":
    "If your hopes for your child differ from what they’re curious about, talk it through. Both views matter, and Kai can help your child prepare for that conversation.",
  "S6-B5":
    "Entry requirements differ by country and university. Your child’s school counsellor is the best person to confirm them.",

  // Section 7 · About this report
  "S7-TITLE": "About this report: what it is and what it isn't",
  "S7-IS-LABEL": "It is",
  "S7-IS-1": "a description of your answers today, to help you explore",
  "S7-IS-2":
    "based on well-known ideas about interests and work, with job suggestions from international job data",
  "S7-ISNT-LABEL": "It isn't",
  "S7-ISNT-1": "a test of ability, intelligence or personality",
  "S7-ISNT-2": "a prediction of success, grades or how happy you'll be",
  "S7-ISNT-3": "a comparison with other students",
  "S7-ISNT-4": "a decision. The choice is always yours.",
  "S7-CREDIT":
    "Job information is adapted from O*NET (U.S. Department of Labor), used under a CC BY 4.0 licence, and from international occupation and wage data. Jobs, pay and requirements can differ where you live.",

  "KAI-BUTTON": "Discuss this with Kai",
};

/** Arabic waits on file 04 (and Arabic job/family names); every block is pending. */
const AR: Wording = {};

const WORDING: Record<Locale, Wording> = { en: EN, ar: AR };

/** The block's text in this language, or null while the block is pending. */
export function wordingFor(locale: Locale, blockId: string): string | null {
  return WORDING[locale][blockId] ?? null;
}
