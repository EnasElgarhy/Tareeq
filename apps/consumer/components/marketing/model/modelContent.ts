import type { Icon } from "@phosphor-icons/react";
import {
  ArrowsOutSimple,
  Briefcase,
  Compass,
  Crosshair,
  Feather,
  Flame,
  Gauge,
  HandHeart,
  Heart,
  Leaf,
  Lightning,
  ListChecks,
  Medal,
  PlayCircle,
  Plant,
  Pulse,
  Scales,
  ShieldCheck,
  Sparkle,
  Star,
  Target,
  TreeStructure,
  Trophy,
  User,
  UsersThree,
  Clock,
} from "@phosphor-icons/react/dist/ssr";

/**
 * Copy for the /model page, kept short on purpose: one line per idea, with an
 * icon doing the rest. Lives apart from layout so it can move into the i18n
 * catalog as one piece later.
 */

export type PillarId = "curiosities" | "operations" | "rewards" | "ecosystems";

export interface Point {
  icon: Icon;
  text: string;
}

export interface Pillar {
  id: PillarId;
  letter: string;
  index: string;
  name: string;
  question: string;
  intro: string;
  icon: Icon;
  points: readonly Point[];
  /** Ink accent on the day surface. */
  dayAccent: string;
  /** Glow accent on the night surface — taken from Kai's orb aura. */
  nightAccent: string;
}

export const PILLARS: readonly Pillar[] = [
  {
    id: "curiosities",
    letter: "C",
    index: "01",
    name: "Curiosities",
    question: "What captures your attention?",
    intro:
      "Interest is one of the strongest predictors of long-term career satisfaction.",
    icon: Sparkle,
    points: [
      { icon: PlayCircle, text: "Real-life scenarios, not abstract questions" },
      { icon: Compass, text: "Which video, club or project would you pick?" },
      { icon: Target, text: "Find your top three career clusters" },
    ],
    dayAccent: "#9A6A12",
    nightAccent: "#F4C660",
  },
  {
    id: "operations",
    letter: "O",
    index: "02",
    name: "Operations",
    question: "How do you naturally function?",
    intro:
      "Two dimensions of working style. Where they cross is your archetype.",
    icon: Gauge,
    points: [
      { icon: ListChecks, text: "Structured or flexible — how you process" },
      { icon: ArrowsOutSimple, text: "Deep or broad — how wide you focus" },
      { icon: Briefcase, text: "A career that fits how you work" },
    ],
    dayAccent: "#6D5BA8",
    nightAccent: "#9D7FF0",
  },
  {
    id: "rewards",
    letter: "R",
    index: "03",
    name: "Rewards",
    question: "Why do you strive for success?",
    intro: "Five drivers of motivation, revealed through trade-offs.",
    icon: Heart,
    points: [
      { icon: Scales, text: "Paired choices, not “how important is…?”" },
      { icon: Flame, text: "Motivation outlasts salary and title" },
      { icon: Medal, text: "Your primary and secondary driver" },
    ],
    dayAccent: "#B45C50",
    nightAccent: "#F2A8B3",
  },
  {
    id: "ecosystems",
    letter: "E",
    index: "04",
    name: "Ecosystems",
    question: "Where do you thrive?",
    intro: "The perfect job in the wrong environment leads to burnout.",
    icon: Leaf,
    points: [
      { icon: UsersThree, text: "Around people, or recharging alone" },
      { icon: Pulse, text: "Fast-changing, or steady and predictable" },
      { icon: Plant, text: "Stay engaged for the long run" },
    ],
    dayAccent: "#2F7A64",
    nightAccent: "#6FE0C0",
  },
] as const;

export const HERO = {
  eyebrow: "The CORE model",
  title: "Four questions.",
  accent: "One clear picture of you.",
  lede: "Most tools measure only interests. CORE measures four dimensions of career fit.",
} as const;

export interface Archetype {
  name: string;
  formula: string;
  body: string;
  icon: Icon;
  accent: string;
}

/**
 * Row-major: Deep row (Structured, Flexible), then Broad row. Matches the
 * scoring engine in lib/scoring/index.ts, which is what results show.
 */
export const ARCHETYPES: readonly Archetype[] = [
  {
    name: "Precisionist",
    formula: "Structured + Deep",
    body: "Masters one craft with discipline",
    icon: Crosshair,
    accent: "#9A6A12",
  },
  {
    name: "Explorer",
    formula: "Flexible + Deep",
    body: "Dives into one domain at a time",
    icon: Compass,
    accent: "#2F7A64",
  },
  {
    name: "Coordinator",
    formula: "Structured + Broad",
    body: "Keeps complex systems aligned",
    icon: TreeStructure,
    accent: "#6D5BA8",
  },
  {
    name: "Catalyst",
    formula: "Flexible + Broad",
    body: "Connects dots across many areas",
    icon: Lightning,
    accent: "#B45C50",
  },
];

export const DRIVERS: readonly { name: string; body: string; icon: Icon }[] = [
  { name: "Recognition", body: "Being known for your work", icon: Star },
  { name: "Impact", body: "Making a real difference", icon: HandHeart },
  { name: "Autonomy", body: "Freedom in how you work", icon: Feather },
  { name: "Mastery", body: "Becoming truly excellent", icon: Trophy },
  { name: "Stability", body: "Security and predictability", icon: ShieldCheck },
];

export interface SpectrumPole {
  label: string;
  icon: Icon;
}

export const SPECTRUMS: readonly {
  name: string;
  poles: readonly [SpectrumPole, SpectrumPole];
}[] = [
  {
    name: "Social Battery",
    poles: [
      { label: "Collaborative", icon: UsersThree },
      { label: "Independent", icon: User },
    ],
  },
  {
    name: "Environmental Pulse",
    poles: [
      { label: "Dynamic", icon: Lightning },
      { label: "Predictable", icon: Clock },
    ],
  },
];

export const COMPARISON = {
  eyebrow: "Why four pillars",
  title: "The gap",
  accent: "CORE fills.",
  body: "Holland’s RIASEC (1950s) measures interests only — and was built for adults with work experience.",
  rows: [
    { label: "What interests you", riasec: true },
    { label: "Everyday questions teens can answer", riasec: false },
    { label: "How you work", riasec: false },
    { label: "What drives you", riasec: false },
    { label: "Where you thrive", riasec: false },
  ],
} as const;
