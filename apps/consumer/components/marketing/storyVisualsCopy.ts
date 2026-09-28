import type { Locale } from "@/lib/i18n/locale";

/**
 * Words inside the home page's product mock-ups (StoryVisuals), per locale.
 * Numbers, colours and layout stay in the components; Arabic uses the
 * product's own report terms so the mock-ups match what users really see.
 */

interface StoryWords {
  fit: (value: number) => string;
  compass: {
    title: string;
    archetypeLabel: string;
    archetype: string;
    topClusters: string;
    clusters: readonly [string, string, string];
    drivesLabel: string;
    drives: string;
    thrivesLabel: string;
    thrives: string;
  };
  report: {
    signal: string;
    signalValue: string;
    confidence: string;
    style: string;
    styleValue: string;
    title: string;
    heading: string;
    patternLabel: string;
    pattern: string;
    patternBody: string;
  };
  options: {
    title: string;
    basis: string;
    topMatch: string;
    careers: readonly [string, string, string];
    careerClusters: readonly [string, string, string];
    subjectsLabel: string;
    subjects: readonly [string, string, string];
    pathsLabel: string;
    paths: readonly [string, string, string];
    pathDescs: readonly [string, string, string];
  };
  kai: {
    directionLabel: string;
    direction: string;
    name: string;
    role: string;
    question: string;
    answerHeading: string;
    answerBody: string;
    basedOn: string;
    and: string;
    evidence: readonly [string, string];
    actions: readonly [string, string, string];
  };
}

export const STORY_COPY: Record<Locale, StoryWords> = {
  en: {
    fit: (value) => `${value}% fit`,
    compass: {
      title: "Your Career Compass",
      archetypeLabel: "Operational archetype",
      archetype: "The Catalyst",
      topClusters: "Top clusters",
      clusters: ["Technology", "Arts / Media", "Business"],
      drivesLabel: "Drives you",
      drives: "Impact",
      thrivesLabel: "Thrives in",
      thrives: "Dynamic teams",
    },
    report: {
      signal: "Signal",
      signalValue: "High curiosity",
      confidence: "Confidence",
      style: "Style",
      styleValue: "Catalyst",
      title: "Narrative report",
      heading: "Why fast-moving environments suit you",
      patternLabel: "Key pattern",
      pattern: "Adaptability keeps you engaged; repetition drains your energy.",
      patternBody:
        "You engage most when work changes quickly and gives you room to explore.",
    },
    options: {
      title: "Career matches",
      basis: "Based on your profile",
      topMatch: "Top match",
      careers: ["Clinical Psychologist", "Counsellor", "UX Researcher"],
      careerClusters: [
        "People & Psychology",
        "People & Psychology",
        "Technology",
      ],
      subjectsLabel: "Subjects",
      subjects: ["Psychology", "Biology", "Sociology"],
      pathsLabel: "Paths",
      paths: ["Psychology BA", "Counselling", "Human Resources"],
      pathDescs: ["Related degree", "Strong match", "Alternative path"],
    },
    kai: {
      directionLabel: "Your direction",
      direction: "People & Psychology",
      name: "Kai",
      role: "Personalised guide",
      question: "Which path keeps the most options open?",
      answerHeading: "You don’t need to choose one career yet.",
      answerBody:
        "Psychology keeps several paths open — from counselling and research to HR and UX.",
      basedOn: "Based on",
      and: "&",
      evidence: ["People curiosity", "Catalyst"],
      actions: ["Compare paths", "What to study", "Make a plan"],
    },
  },
  ar: {
    fit: (value) => `توافق ${value}%`,
    compass: {
      title: "بوصلة مسارك المهني",
      archetypeLabel: "نمط العمل",
      archetype: "المحفّز",
      topClusters: "أبرز المجالات",
      clusters: ["التقنية", "الفنون والإعلام", "الأعمال"],
      drivesLabel: "يحفّزك",
      drives: "الأثر",
      thrivesLabel: "تتألق في",
      thrives: "فرق ديناميكية",
    },
    report: {
      signal: "المؤشر",
      signalValue: "فضول مرتفع",
      confidence: "مستوى الثقة",
      style: "النمط",
      styleValue: "المحفّز",
      title: "التقرير السردي",
      heading: "لماذا تناسبك البيئات سريعة الإيقاع",
      patternLabel: "النمط الأبرز",
      pattern: "المرونة تُبقيك متحمساً، والتكرار يستنزف طاقتك.",
      patternBody:
        "تكون في أفضل حالاتك حين يتغيّر العمل بسرعة ويمنحك مساحة للاستكشاف.",
    },
    options: {
      title: "مهن تناسبك",
      basis: "بناءً على ملفك",
      topMatch: "الأكثر توافقاً",
      careers: ["أخصائي نفسي إكلينيكي", "مرشد نفسي", "باحث تجربة المستخدم"],
      careerClusters: ["الناس وعلم النفس", "الناس وعلم النفس", "التقنية"],
      subjectsLabel: "المواد",
      subjects: ["علم النفس", "الأحياء", "علم الاجتماع"],
      pathsLabel: "المسارات",
      paths: ["بكالوريوس علم النفس", "الإرشاد النفسي", "الموارد البشرية"],
      pathDescs: ["تخصص مرتبط", "توافق قوي", "مسار بديل"],
    },
    kai: {
      directionLabel: "اتجاهك",
      direction: "الناس وعلم النفس",
      name: "كاي",
      role: "مرشدتك الشخصية",
      question: "أي مسار يُبقي خياراتي مفتوحة أكثر؟",
      answerHeading: "لست مضطراً لاختيار مهنة واحدة الآن.",
      answerBody:
        "علم النفس يُبقي أمامك عدة مسارات مفتوحة — من الإرشاد والبحث إلى الموارد البشرية وتجربة المستخدم.",
      basedOn: "بناءً على",
      and: "و",
      evidence: ["فضولك تجاه الناس", "المحفّز"],
      actions: ["قارن المسارات", "ماذا أدرس", "ضع خطة"],
    },
  },
};
