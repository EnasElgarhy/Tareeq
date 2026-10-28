import type { Icon } from "@phosphor-icons/react";
import {
  ArrowsOutSimple,
  Briefcase,
  Coins,
  Cpu,
  Feather,
  Gauge,
  HandHeart,
  Heart,
  House,
  Leaf,
  ListChecks,
  MagnifyingGlass,
  Megaphone,
  PaintBrush,
  PersonSimpleRun,
  PlayCircle,
  Plant,
  Pulse,
  Scales,
  ShieldCheck,
  Sparkle,
  Star,
  Sun,
  Target,
  Trophy,
  User,
  UsersThree,
  Wrench,
  Clock,
} from "@phosphor-icons/react/dist/ssr";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Copy for the /model page: file 07, Part 1 (17 Oct package) in English and
 * the 28 Oct Arabic website text, section 5. Icons and colours are shared;
 * only the words change. CORE uses no types or archetypes, and every
 * motivator carries equal weight.
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
  /** "What", "How", "Why", "Where": the part's question word. */
  tag: string;
  question: string;
  intro: string;
  icon: Icon;
  points: readonly Point[];
  /** Ink accent on the day surface. */
  dayAccent: string;
  /** Glow accent on the night surface — taken from Kai's orb aura. */
  nightAccent: string;
}

export interface NamedItem {
  name: string;
  line?: string;
  icon: Icon;
}

export interface SpectrumPole {
  label: string;
  icon: Icon;
}

export interface Spectrum {
  name: string;
  poles: readonly [SpectrumPole, SpectrumPole];
}

export interface ModelCopy {
  hero: { eyebrow: string; title: string; accent: string; lede: string };
  pillars: readonly Pillar[];
  curiosities: { title: string; items: readonly NamedItem[] };
  operating: { title: string; bars: readonly { name: string; ends: readonly [string, string, string] }[] };
  rewards: { title: string; items: readonly NamedItem[] };
  ecosystem: {
    title: string;
    line: string;
    spectrums: readonly Spectrum[];
    balanced: string;
    leaning: (pole: string) => string;
  };
  why: {
    kicker: string;
    headline: string;
    text: string;
    steps: readonly [string, string];
    link: string;
  };
  closing: { headline: string; science: string; time: string };
}

const STYLE = {
  curiosities: { letter: "C", index: "01", icon: Sparkle, dayAccent: "#9A6A12", nightAccent: "#F4C660", points: [PlayCircle, Scales, Target] },
  operations: { letter: "O", index: "02", icon: Gauge, dayAccent: "#6D5BA8", nightAccent: "#9D7FF0", points: [ListChecks, ArrowsOutSimple, Briefcase] },
  rewards: { letter: "R", index: "03", icon: Heart, dayAccent: "#B45C50", nightAccent: "#F2A8B3", points: [Scales, Heart, Target] },
  ecosystems: { letter: "E", index: "04", icon: Leaf, dayAccent: "#2F7A64", nightAccent: "#6FE0C0", points: [UsersThree, Pulse, Plant] },
} as const;

const CURIOSITY_ICONS = [MagnifyingGlass, PaintBrush, HandHeart, Megaphone, ListChecks, Cpu, Wrench, PersonSimpleRun];
const REWARD_ICONS = [Star, HandHeart, Trophy, Feather, ShieldCheck, Coins, House, Sun];

function pillar(
  id: PillarId,
  words: { name: string; tag: string; question: string; intro: string; points: readonly [string, string, string] },
): Pillar {
  const style = STYLE[id];
  return {
    id,
    letter: style.letter,
    index: style.index,
    icon: style.icon,
    dayAccent: style.dayAccent,
    nightAccent: style.nightAccent,
    name: words.name,
    tag: words.tag,
    question: words.question,
    intro: words.intro,
    points: words.points.map((text, i) => ({ icon: style.points[i], text })),
  };
}

const named = (items: readonly (readonly [string, string?])[], icons: readonly Icon[]): NamedItem[] =>
  items.map(([name, line], i) => ({ name, line, icon: icons[i] }));

const EN: ModelCopy = {
  hero: {
    eyebrow: "The CORE model",
    title: "Four questions.",
    accent: "One clear picture of you.",
    lede: "Interests matter, but they are only part of a good study choice. CORE also looks at how you like to work, what you want your work to give you, and the work setting you prefer.",
  },
  pillars: [
    pillar("curiosities", {
      name: "Curiosities",
      tag: "What",
      question: "What pulls your interest?",
      intro: "Not school subjects or grades, but what draws you in: the kind of question, problem or activity you keep coming back to.",
      points: [
        "Short real-life situations, not abstract questions",
        "You choose between options, so your answers show what comes first for you",
        "See which curiosities lead, and whether they connect into one direction",
      ],
    }),
    pillar("operations", {
      name: "Operating style",
      tag: "How",
      question: "How do you like to do the work?",
      intro: "Two leanings about the work itself. Neither end is better, and many people sit somewhere in the middle.",
      points: [
        "How set out you like the work",
        "Whether you like going deep or covering a range",
        "See which jobs usually work the way you like",
      ],
    }),
    pillar("rewards", {
      name: "Rewards",
      tag: "Why",
      question: "What do you want your work to give you?",
      intro: "Eight things people want from a career. You choose between them, because real choices usually mean putting one thing ahead of another.",
      points: [
        "Trade-off questions, not “how important is…?”",
        "See what matters most to you",
        "Spot which jobs often offer it",
      ],
    }),
    pillar("ecosystems", {
      name: "Ecosystem",
      tag: "Where",
      question: "What kind of work setting do you prefer?",
      intro: "Whether you’d rather work alongside others or on your own, and how much you’d like your days to change. The same field can feel very different depending on the setting.",
      points: [
        "Working side by side with others, or on your own",
        "A familiar place and rhythm, or something different every day",
        "See different routes within the same field",
      ],
    }),
  ],
  curiosities: {
    title: "Eight curiosities",
    items: named(
      [
        ["Research & Discovery", "Finding out why things happen"],
        ["Imagination & Expression", "Creating something new that carries meaning"],
        ["People & Wellbeing", "Understanding people and helping them"],
        ["Enterprise & Influence", "Making things happen through people"],
        ["Planning & Execution", "Making things run properly, start to finish"],
        ["Technology & Systems", "Building digital systems that work"],
        ["Invention & Repair", "Making physical things work"],
        ["Action & Endurance", "Being active and physical in the real world"],
      ],
      CURIOSITY_ICONS,
    ),
  },
  operating: {
    title: "Two leanings",
    bars: [
      {
        name: "How set out you like the work",
        ends: ["Steps and expectations set out for you", "A mix of both", "Room to find your own way"],
      },
      {
        name: "Going deep or covering a range",
        ends: ["Going deep into one thing until you know it well", "A mix of both", "Understanding many topics and how they connect"],
      },
    ],
  },
  rewards: {
    title: "Eight things people want from work",
    items: named(
      [
        ["Being looked up to for what you do"],
        ["Making a difference for others and your community"],
        ["Getting really good at something difficult"],
        ["Being in charge of your own work"],
        ["A steady, secure career"],
        ["High earnings"],
        ["A path your family is proud of"],
        ["A life beyond work"],
      ],
      REWARD_ICONS,
    ),
  },
  ecosystem: {
    title: "Where would you sit?",
    line: "Drag the dot. Neither end is better.",
    spectrums: [
      { name: "Team or individual work", poles: [{ label: "With others", icon: UsersThree }, { label: "On your own", icon: User }] },
      { name: "Work setting", poles: [{ label: "Steady", icon: Clock }, { label: "Changing", icon: Pulse }] },
    ],
    balanced: "In the middle",
    leaning: (pole) => `Leaning ${pole.toLowerCase()}`,
  },
  why: {
    kicker: "Why four parts",
    headline: "Same field, different routes.",
    text: "Two people can be drawn to medicine for different reasons and end up in very different jobs: one in a quiet hospital laboratory, the other in a busy emergency department. Your curiosities point to the fields worth exploring. How you like to work, what motivates you and the work setting you prefer help you compare the routes within them.",
    steps: [
      "Curiosities point to job families and study fields",
      "Operating style, Rewards and Ecosystem help you compare the routes within them",
    ],
    link: "Where does this come from? Read the science →",
  },
  closing: {
    headline: "Four answers are waiting to be found.",
    science: "Read the science",
    time: "About 15 minutes",
  },
};

const AR: ModelCopy = {
  hero: {
    eyebrow: "نموذج كور",
    title: "أربعة أسئلة.",
    accent: "صورة واضحة عنك.",
    lede: "الاهتمامات مهمة، لكنها جزء فقط من الاختيار الدراسي الجيد. لذلك ينظر تقييم كور أيضًا إلى طريقتك المفضّلة في العمل، وما تريد أن يمنحك إياه عملك، وأجواء العمل التي تفضّلها.",
  },
  pillars: [
    pillar("curiosities", {
      name: "الفضول",
      tag: "ماذا",
      question: "ما الذي يشدّ اهتمامك؟",
      intro: "ليست المواد الدراسية أو الدرجات، بل ما يجذبك: نوع السؤال أو المشكلة أو النشاط الذي تعود إليه مرة بعد مرة.",
      points: [
        "مواقف قصيرة من الحياة الواقعية، لا أسئلة مجرّدة",
        "الاختيار بين الخيارات يُظهر ما يأتي أولًا بالنسبة إليك",
        "معرفة أيّ جوانب الفضول تتقدّم، وهل تلتقي في توجّه واحد",
      ],
    }),
    pillar("operations", {
      name: "أسلوب العمل",
      tag: "كيف",
      question: "كيف تحبّ أن تؤدّي العمل؟",
      intro: "ميلان يتعلّقان بالعمل نفسه. لا طرف أفضل من الآخر، وكثيرون يقعون في المنتصف.",
      points: [
        "مدى تفضيلك لأن تكون المهام محدّدة",
        "التعمّق في موضوع واحد أم التنوّع",
        "معرفة المهن التي تُنجَز عادةً بالطريقة التي تفضّلها",
      ],
    }),
    pillar("rewards", {
      name: "المحفّزات",
      tag: "لماذا",
      question: "ماذا تريد أن يمنحك عملك؟",
      intro: "ثمانية أمور يريدها الناس من مسيرتهم المهنية. والاختيار بينها مقصود، لأن الخيارات الحقيقية تعني عادةً تقديم أمر على آخر.",
      points: [
        "أسئلة مفاضلة، لا «ما مدى أهمية…؟»",
        "معرفة ما يهمّك أكثر",
        "ملاحظة المهن التي توفّره غالبًا",
      ],
    }),
    pillar("ecosystems", {
      name: "البيئة",
      tag: "أين",
      question: "ما أجواء العمل التي تفضّلها؟",
      intro: "إن كنت تفضّل العمل مع الآخرين أو بمفردك، وإلى أيّ مدى تحبّ أن تتغيّر أيام عملك. فالمجال نفسه قد يبدو مختلفًا تمامًا بحسب الأجواء.",
      points: [
        "العمل جنبًا إلى جنب مع الآخرين، أو بشكل فردي",
        "مكان وإيقاع مألوفان، أو تنوّع وتجدّد كل يوم",
        "رؤية مسارات مختلفة داخل المجال نفسه",
      ],
    }),
  ],
  curiosities: {
    title: "ثمانية جوانب للفضول",
    items: named(
      [
        ["البحث والاكتشاف", "معرفة سبب حدوث الأشياء"],
        ["الخيال والتعبير", "ابتكار شيء جديد يحمل معنى"],
        ["خدمة الناس ودعمهم", "فهم الناس ومساعدتهم"],
        ["الريادة والتأثير", "تحقيق الأمور من خلال الناس"],
        ["التخطيط والتنفيذ", "جعل الأمور تسير بإتقان من البداية إلى النهاية"],
        ["التكنولوجيا والأنظمة", "بناء أنظمة رقمية تعمل"],
        ["الابتكار والتصنيع", "صنع الأشياء وتشغيلها بيديك"],
        ["الحركة والميدان", "النشاط البدني والحركة في الميدان"],
      ],
      CURIOSITY_ICONS,
    ),
  },
  operating: {
    title: "ميلان",
    bars: [
      {
        name: "مدى تفضيلك لأن تكون المهام محدّدة",
        ends: ["خطوات وتوقّعات محدّدة لك مسبقًا", "مزيج من الاثنين", "مساحة لإيجاد طريقتك الخاصة"],
      },
      {
        name: "التعمّق أم التنوّع في العمل",
        ends: ["التعمّق في موضوع واحد حتى إتقانه", "مزيج من الاثنين", "الإلمام بمواضيع متعددة والربط بينها"],
      },
    ],
  },
  rewards: {
    title: "ثمانية أمور يريدها الناس من العمل",
    items: named(
      [
        ["تقدير الناس لما تقوم به"],
        ["إحداث فرق للآخرين ولمجتمعك"],
        ["إتقان شيء صعب"],
        ["التحكّم في عملك بنفسك"],
        ["وظيفة مستقرة وآمنة"],
        ["دخل مرتفع"],
        ["طريق تفخر به عائلتك"],
        ["وقت لحياتك خارج العمل"],
      ],
      REWARD_ICONS,
    ),
  },
  ecosystem: {
    title: "أين تجد نفسك؟",
    line: "حرّك النقطة. لا طرف أفضل من الآخر.",
    spectrums: [
      { name: "العمل الجماعي أو الفردي", poles: [{ label: "مع الآخرين", icon: UsersThree }, { label: "بمفردك", icon: User }] },
      { name: "بيئة العمل", poles: [{ label: "ثابتة", icon: Clock }, { label: "متغيّرة", icon: Pulse }] },
    ],
    balanced: "في المنتصف",
    leaning: (pole) => `أقرب إلى: ${pole}`,
  },
  why: {
    kicker: "لماذا أربعة جوانب",
    headline: "المجال نفسه، ومسارات مختلفة.",
    text: "قد ينجذب شخصان إلى الطب لأسباب مختلفة، فينتهي بهما الأمر في وظيفتين مختلفتين تمامًا: أحدهما في مختبر مستشفى هادئ، والآخر في قسم طوارئ مزدحم. يشير فضولك إلى المجالات التي تستحق الاستكشاف، بينما تساعدك طريقتك المفضّلة في العمل، وما يحفّزك، وأجواء العمل التي تفضّلها على المقارنة بين المسارات داخلها.",
    steps: [
      "الفضول يشير إلى مجموعات المهن ومجالات الدراسة",
      "أسلوب العمل والمحفّزات والبيئة تساعد على المقارنة بين المسارات داخلها",
    ],
    link: "من أين جاء ذلك؟ اقرأ عن الأساس العلمي ←",
  },
  closing: {
    headline: "أربع إجابات تنتظر اكتشافها.",
    science: "الأساس العلمي",
    time: "نحو 15 دقيقة",
  },
};

const COPY: Record<Locale, ModelCopy> = { en: EN, ar: AR };

export function modelCopy(locale: Locale): ModelCopy {
  return COPY[locale];
}
