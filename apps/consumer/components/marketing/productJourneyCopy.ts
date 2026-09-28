import {
  Brain,
  ChartBar,
  Compass,
  GraduationCap,
  HandHeart,
  Leaf,
  Lightning,
  ListChecks,
  MagnifyingGlass,
  PaintBrush,
  Scales,
  Sparkle,
  TreeStructure,
  UsersThree,
} from "@phosphor-icons/react";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Copy for the hero's product-journey cards, per locale. Icons are shared so
 * both languages tell the same story; only the words change. Arabic follows
 * the product's own terms (Kai is feminine, "بوصلة مسارك المهني", archetype
 * and cluster names from the report strings).
 */

const ICONS = {
  options: [UsersThree, PaintBrush, ChartBar],
  resultChips: [Sparkle, Lightning],
  careers: [Brain, HandHeart, MagnifyingGlass],
  subjects: [Brain, Leaf, UsersThree],
  nextPaths: [GraduationCap, TreeStructure],
  kaiChips: [Scales, GraduationCap],
  steps: [ListChecks, Compass, GraduationCap, Sparkle],
} as const;

interface Words {
  kaiName: string;
  aria: string;
  intro: {
    role: string;
    greeting: string;
    exploreLabel: string;
    dimensions: readonly string[];
  };
  assessment: {
    progress: string;
    question: string;
    options: readonly string[];
    kaiHint: string;
  };
  result: {
    header: string;
    cluster: string;
    summary: string;
    chips: readonly string[];
    confidence: string;
  };
  labels: { careers: string; subjects: string; nextPaths: string };
  careers: readonly string[];
  subjects: readonly string[];
  nextPaths: readonly string[];
  kai: { question: string; answer: string; chips: readonly string[] };
  summary: { steps: readonly string[]; line: string };
}

const WORDS: Record<Locale, Words> = {
  en: {
    kaiName: "Kai",
    aria: "How Tareeq works: meet Kai, your guide, then answer questions, get your career direction, see matching careers and subjects, then ask Kai what to do next.",
    intro: {
      role: "Your AI career navigator",
      greeting:
        "Hi, my name is Kai. I will be your guide in this journey of self-discovery.",
      exploreLabel: "What we’ll explore",
      dimensions: ["Curiosities", "Operations", "Rewards", "Ecosystems"],
    },
    assessment: {
      progress: "Question 4 of 12",
      question: "What kind of problems do you enjoy solving?",
      options: ["Understanding people", "Creating things", "Working with data"],
      kaiHint: "I’m learning what motivates you.",
    },
    result: {
      header: "Your Career Compass",
      cluster: "People & Psychology",
      summary: "Strong curiosity around people, behaviour and wellbeing.",
      chips: ["High curiosity", "Catalyst"],
      confidence: "38% · Moderate",
    },
    labels: {
      careers: "Career matches",
      subjects: "Subjects to explore",
      nextPaths: "Next paths",
    },
    careers: ["Clinical Psychologist", "Counsellor", "UX Researcher"],
    subjects: ["Psychology", "Biology", "Sociology"],
    nextPaths: ["University majors", "Career families"],
    kai: {
      question: "Which path keeps the most options open?",
      answer:
        "Psychology can lead into counselling, research, HR and UX research.",
      chips: ["Compare careers", "What should I study?"],
    },
    summary: {
      steps: ["Assessment", "Your direction", "Careers & subjects", "Ask Kai"],
      line: "From questions to a direction you can act on.",
    },
  },
  ar: {
    kaiName: "كاي",
    aria: "كيف يعمل طريق: تعرّف على كاي مرشدتك، ثم أجب عن الأسئلة، واحصل على اتجاهك المهني، واطّلع على المهن والمواد المناسبة، ثم اسأل كاي عن خطوتك التالية.",
    intro: {
      role: "مرشدتك المهنية بالذكاء الاصطناعي",
      greeting: "مرحباً، أنا كاي. سأكون مرشدتك في رحلة اكتشاف ذاتك.",
      exploreLabel: "ما سنستكشفه معاً",
      dimensions: ["الفضول", "طريقة العمل", "المكافآت", "بيئات العمل"],
    },
    assessment: {
      progress: "السؤال 4 من 12",
      question: "ما نوع المشكلات التي تستمتع بحلّها؟",
      options: ["فهم الناس", "صنع الأشياء", "العمل مع البيانات"],
      kaiHint: "أتعرّف على ما يحفّزك.",
    },
    result: {
      header: "بوصلة مسارك المهني",
      cluster: "الناس وعلم النفس",
      summary: "فضول قوي تجاه الناس والسلوك والصحة النفسية.",
      chips: ["فضول مرتفع", "المحفّز"],
      confidence: "38% · متوسطة",
    },
    labels: {
      careers: "مهن تناسبك",
      subjects: "مواد تستحق الاستكشاف",
      nextPaths: "مسارات تالية",
    },
    careers: ["أخصائي نفسي إكلينيكي", "مرشد نفسي", "باحث تجربة المستخدم"],
    subjects: ["علم النفس", "الأحياء", "علم الاجتماع"],
    nextPaths: ["التخصصات الجامعية", "المجالات المهنية"],
    kai: {
      question: "أي مسار يُبقي خياراتي مفتوحة أكثر؟",
      answer:
        "يمكن أن يقودك علم النفس إلى الإرشاد والبحث والموارد البشرية وأبحاث تجربة المستخدم.",
      chips: ["قارن بين المهن", "ماذا أدرس؟"],
    },
    summary: {
      steps: ["التقييم", "اتجاهك", "المهن والمواد", "اسأل كاي"],
      line: "من الأسئلة إلى اتجاه واضح تبدأ به.",
    },
  },
};

const withIcons = <T extends readonly string[]>(
  labels: T,
  icons: readonly React.ComponentType<{ size?: number; weight?: "bold" }>[],
) => labels.map((label, i) => ({ label, icon: icons[i] }));

/** The journey copy for one locale, shaped the way the stages render it. */
export function getJourneyCopy(locale: Locale) {
  const w = WORDS[locale];
  return {
    kaiName: w.kaiName,
    aria: w.aria,
    labels: w.labels,
    intro: w.intro,
    assessment: {
      progress: w.assessment.progress,
      question: w.assessment.question,
      options: withIcons(w.assessment.options, ICONS.options),
      selected: w.assessment.options[0],
      kaiHint: w.assessment.kaiHint,
    },
    result: {
      header: w.result.header,
      cluster: w.result.cluster,
      summary: w.result.summary,
      chips: withIcons(w.result.chips, ICONS.resultChips),
      confidence: w.result.confidence,
      tone: "#FF6F91",
    },
    careers: withIcons(w.careers, ICONS.careers),
    subjects: withIcons(w.subjects, ICONS.subjects),
    nextPaths: withIcons(w.nextPaths, ICONS.nextPaths),
    kai: {
      question: w.kai.question,
      answer: w.kai.answer,
      chips: withIcons(w.kai.chips, ICONS.kaiChips),
    },
    summary: {
      steps: withIcons(w.summary.steps, ICONS.steps),
      line: w.summary.line,
    },
  };
}

export type JourneyCopy = ReturnType<typeof getJourneyCopy>;
