import type { Locale } from "@/lib/i18n/locale";

/**
 * Words inside the home page's product mock-ups (StoryVisuals), per locale.
 * Colours and layout stay in the components; Arabic uses the product's own
 * report terms so the mock-ups match what users really see.
 */

type Three = readonly [string, string, string];

interface StoryWords {
  glance: {
    title: string;
    owner: string;
    curiosity: {
      tag: string;
      heading: string;
      clusters: readonly [
        { name: string; desc: string },
        { name: string; desc: string },
      ];
      connect: string;
    };
    operations: { tag: string; heading: string; sub: string; options: Three };
    ecosystem: { tag: string; heading: string; sub: string; options: Three };
    rewards: { tag: string; heading: string; items: readonly [string, string] };
  };
  meaning: {
    title: string;
    context: string;
    tag: string;
    heading: string;
    body: string;
    noticeLabel: string;
    notices: Three;
  };
  options: {
    title: string;
    meetLabel: string;
    tags: readonly [string, string];
    field: string;
    roles: readonly string[];
    /** The family's study fields: in the real report they belong to the family, not one job. */
    familyStudy: string;
    career: string;
    closest: string;
    workLabel: string;
    work: string;
    motiveLabel: string;
    motive: string;
    studyLabel: string;
    nextLabel: string;
    next: readonly [string, string, string, string];
  };
  kai: {
    reportLabel: string;
    section: string;
    discuss: string;
    name: string;
    question: string;
    reply: string;
    footer: string;
  };
}

export const STORY_COPY: Record<Locale, StoryWords> = {
  en: {
    glance: {
      title: "Your CORE at a glance",
      owner: "Sara’s report",
      curiosity: {
        tag: "Curiosities",
        heading: "What sparks your curiosity",
        clusters: [
          {
            name: "Research & Discovery",
            desc: "Finding out why things happen",
          },
          {
            name: "People & Wellbeing",
            desc: "Understanding people and helping them",
          },
        ],
        connect: "They connect into one direction.",
      },
      operations: {
        tag: "Operating style",
        heading: "How you like to work",
        sub: "How set out you like the work",
        options: ["Steps set out for you", "A mix of both", "Room to find your own way"],
      },
      ecosystem: {
        tag: "Ecosystem",
        heading: "Your work setting",
        sub: "Team or individual work",
        options: ["Side by side with others", "A mix of both", "On your own"],
      },
      rewards: {
        tag: "Rewards",
        heading: "What motivates you most",
        items: [
          "Making a difference for others and your community",
          "Getting really good at something difficult",
        ],
      },
    },
    meaning: {
      title: "Your report",
      context: "What sparks your curiosity",
      tag: "Research & Discovery",
      heading: "You want to know why.",
      body: "The answer itself is the reward: understanding how something works, what causes it, and what the evidence says.",
      noticeLabel: "You might notice it when:",
      notices: [
        "you keep asking “but why?” after the lesson ends",
        "you look things up just to understand them",
        "a puzzle or mystery stays on your mind",
      ],
    },
    options: {
      title: "What this means for you",
      meetLabel: "Where your curiosities meet",
      tags: ["Research & Discovery", "People & Wellbeing"],
      field: "Clinical and health sciences",
      roles: ["Dentist", "Dietitian", "Genetic counsellor", "Occupational health specialist"],
      familyStudy: "Psychology, nutrition and dietetics, genetics, public health",
      career: "Genetic counsellor",
      closest: "Closest to your answers",
      workLabel: "Works the way you like to work.",
      work: "This work usually offers: close teamwork",
      motiveLabel: "Often offers what motivates you:",
      motive: "making a difference for others and your community; getting really good at something difficult",
      studyLabel: "Study fields:",
      nextLabel: "Next steps:",
      next: ["Watch", "Try", "Talk", "Ask"],
    },
    kai: {
      reportLabel: "In your report",
      section: "What sparks your curiosity",
      discuss: "Discuss this with Kai",
      name: "Kai",
      question: "Which of these curiosities feels most like you, and which feels least?",
      reply: "Research, for sure. I always want to know why things happen.",
      footer: "Kai has read your report, so every chat starts from your results.",
    },
  },
  ar: {
    glance: {
      title: "لمحة عن كور الخاص بك",
      owner: "تقرير سارة",
      curiosity: {
        tag: "ما يثير فضولك",
        heading: "ما الذي يثير فضولك",
        clusters: [
          {
            name: "البحث والاكتشاف",
            desc: "معرفة لماذا تحدث الأشياء",
          },
          {
            name: "خدمة الناس ودعمهم",
            desc: "فهم الناس ومساعدتهم",
          },
        ],
        connect: "يلتقيان في اتجاه واحد.",
      },
      operations: {
        tag: "طريقتك في العمل",
        heading: "كيف تحب أن تعمل",
        sub: "إلى أي حد تحب أن يكون العمل منظّماً",
        options: ["خطوات واضحة لك", "مزيج من الاثنين", "مساحة لتجد طريقتك"],
      },
      ecosystem: {
        tag: "أجواء العمل",
        heading: "بيئة عملك",
        sub: "العمل ضمن فريق أو بشكل فردي",
        options: ["جنباً إلى جنب مع الآخرين", "مزيج من الاثنين", "بمفردك"],
      },
      rewards: {
        tag: "ما يحفّزك",
        heading: "أكثر ما يحفّزك",
        items: [
          "إحداث فرق للآخرين ولمجتمعك",
          "إتقان شيء صعب",
        ],
      },
    },
    meaning: {
      title: "تقريرك",
      context: "ما الذي يثير فضولك",
      tag: "البحث والاكتشاف",
      heading: "تريد أن تعرف لماذا.",
      body: "الإجابة نفسها هي المكافأة: أن تفهم كيف يعمل الشيء، وما سببه، وماذا تقول الأدلة.",
      noticeLabel: "قد تلاحظ ذلك عندما:",
      notices: [
        "تستمر في السؤال «لكن لماذا؟» بعد انتهاء الدرس",
        "تبحث عن الأشياء فقط لتفهمها",
        "يبقى لغز أو أحجية في ذهنك",
      ],
    },
    options: {
      title: "ماذا يعني هذا لك",
      meetLabel: "حيث تلتقي اهتماماتك",
      tags: ["البحث والاكتشاف", "خدمة الناس ودعمهم"],
      field: "العلوم السريرية والصحية",
      roles: ["طبيب أسنان", "أخصائي تغذية", "مستشار وراثي", "أخصائي الصحة المهنية"],
      familyStudy: "علم النفس، التغذية العلاجية، علم الوراثة، الصحة العامة",
      career: "مستشار وراثي",
      closest: "الأقرب إلى إجاباتك",
      workLabel: "يُنجَز بطريقتك المفضّلة في العمل.",
      work: "يوفّر هذا العمل عادةً: عمل جماعي وثيق",
      motiveLabel: "يوفّر غالبًا ما يحفّزك:",
      motive: "إحداث فرق للآخرين ولمجتمعك، وإتقان شيء صعب",
      studyLabel: "مجالات الدراسة:",
      nextLabel: "الخطوات التالية:",
      next: ["شاهد", "جرّب", "تحدّث", "اسأل"],
    },
    kai: {
      reportLabel: "في تقريرك",
      section: "ما الذي يثير فضولك",
      discuss: "مناقشة هذا مع كاي",
      name: "كاي",
      question: "أيّ هذه الاهتمامات يشبهك أكثر، وأيّها يشبهك أقل؟",
      reply: "البحث بالتأكيد. أريد دائماً أن أعرف لماذا تحدث الأشياء.",
      footer: "قرأ كاي تقريرك، لذلك تبدأ كل محادثة من نتائجك.",
    },
  },
};
