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
 * the product's own terms (curiosity names and Kai's role from the report and
 * the 28 Oct Arabic website text). Jobs come from career bank 1.1, and the
 * result card carries the "Example report" label the client asked for.
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
    aria: "How Map My CORE works: meet Kai, your AI coach, answer questions about everyday situations, see your CORE, the jobs and study fields it points to, then talk it through with Kai.",
    intro: {
      role: "Your AI coach",
      greeting:
        "Hi, I’m Kai. I’ll walk you through each part of your CORE, then help you make sense of your results, whenever you need.",
      exploreLabel: "What we’ll explore",
      dimensions: ["Curiosities", "Operating style", "Rewards", "Ecosystem"],
    },
    assessment: {
      progress: "Question 4 of 46",
      question: "A free afternoon. What pulls you in first?",
      options: ["Helping a friend with a problem", "Making something new", "Finding out how something works"],
      kaiHint: "No right or wrong answers.",
    },
    result: {
      header: "Your CORE",
      cluster: "Research & Discovery",
      summary: "Finding out why things happen. It connects with People & Wellbeing.",
      chips: ["Leading curiosity", "Connects into one direction"],
      confidence: "Example report",
    },
    labels: {
      careers: "Jobs to explore",
      subjects: "Study fields",
      nextPaths: "Next steps",
    },
    careers: ["Dentist", "Dietitian", "Genetic counsellor"],
    subjects: ["Psychology", "Nutrition and dietetics", "Genetics"],
    nextPaths: ["Questions for an open day", "Someone to talk to"],
    kai: {
      question: "Which of these curiosities feels most like you?",
      answer:
        "Research & Discovery and People & Wellbeing connect into one direction: clinical and health sciences.",
      chips: ["Help me prepare questions", "What would a day look like?"],
    },
    summary: {
      steps: ["Your answers", "Your CORE", "Study fields and careers", "Talk it through with Kai"],
      line: "From everyday choices to directions worth exploring.",
    },
  },
  ar: {
    kaiName: "كاي",
    aria: "كيف يعمل ماب ماي كور: تعرّف على كاي، مدرّبك المهني الذكي، وأجب عن أسئلة من مواقفك اليومية، ثم اطّلع على نتائجك والمهن ومجالات الدراسة التي تشير إليها، وناقشها مع كاي.",
    intro: {
      role: "مدرّبك المهني الذكي",
      greeting: "مرحبًا، أنا كاي. سأرافقك في كل جزء من تقييم كور، ثم أساعدك على فهم نتائجك متى احتجت إلى ذلك.",
      exploreLabel: "ما سنستكشفه",
      dimensions: ["الفضول", "أسلوب العمل", "المحفّزات", "البيئة"],
    },
    assessment: {
      progress: "السؤال 4 من 46",
      question: "بعد ظهر يوم فارغ. ما الذي يجذبك أولًا؟",
      options: ["مساعدة صديق في مشكلة", "صنع شيء جديد", "معرفة كيف يعمل شيء ما"],
      kaiHint: "لا توجد إجابات صحيحة أو خاطئة.",
    },
    result: {
      header: "تقرير كور",
      cluster: "البحث والاكتشاف",
      summary: "معرفة سبب حدوث الأشياء، ويرتبط بالناس والرفاه.",
      chips: ["الفضول الأبرز", "يلتقيان في اتجاه واحد"],
      confidence: "نموذج تقرير",
    },
    labels: {
      careers: "مهن تستحق الاستكشاف",
      subjects: "مجالات الدراسة",
      nextPaths: "الخطوات التالية",
    },
    careers: ["طبيب أسنان", "أخصائي تغذية", "مستشار وراثي"],
    subjects: ["علم النفس", "التغذية العلاجية", "علم الوراثة"],
    nextPaths: ["أسئلة ليوم مفتوح", "شخص تتحدث إليه"],
    kai: {
      question: "أيّ هذه الاهتمامات يشبهك أكثر؟",
      answer: "البحث والاكتشاف والناس والرفاه يلتقيان في اتجاه واحد: العلوم السريرية والصحية.",
      chips: ["ساعدني في تحضير أسئلتي", "كيف سيبدو اليوم؟"],
    },
    summary: {
      steps: ["إجاباتك", "نتائجك", "مجالات الدراسة والمهن", "ناقشها مع كاي"],
      line: "من اختياراتك اليومية إلى اتجاهات تستحق الاستكشاف.",
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
