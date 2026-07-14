/**
 * "Did you know" interstitials — pause-beat content shown between
 * every 10 questions to break up the assessment rhythm.
 *
 * Content follows the May 21 Wahba fun-facts spec: surprising,
 * source-backed career data with a short personal implication.
 */

import type { ComponentType, SVGProps } from "react";
import {
  CrossingPathsScene,
  DualWaysScene,
  PatternEmergingScene,
  PeakReachedScene,
} from "@/components/brand/InterstitialScenes";
import { KAI_SECTION_ENCOURAGEMENTS } from "@/lib/audio/kai-narration";
import type { LocalizedText } from "@/lib/scoring/types";

export type InterstitialIllustration = ComponentType<
  SVGProps<SVGSVGElement> & {
    size?: number | string;
    tone?: "cream" | "ink";
  }
>;

export interface Interstitial {
  /** Stable key — used for "already-seen" persistence */
  key: string;
  /** 0-indexed question after which this fires
   *  (i.e. `triggerAfterIndex = 9` fires after answering Q10) */
  triggerAfterIndex: number;
  illustration: InterstitialIllustration;
  /** Optional accent for the soft glow behind the illustration */
  glow: "coral" | "cyan" | "lavender";
  audioId: string;
  title: LocalizedText;
  body: LocalizedText;
  source?: LocalizedText;
  ctaLabel: LocalizedText;
}

const DID_YOU_KNOW_TITLE: LocalizedText = { en: "Did you know?", ar: "هل تعلم؟" };
const CTA_GOT_IT: LocalizedText = { en: "Got it", ar: "فهمت" };
const CTA_KEEP_GOING: LocalizedText = { en: "Keep going", ar: "أكمل" };
const CTA_MAKES_SENSE: LocalizedText = { en: "Makes sense", ar: "منطقي" };
const CTA_FINISH_STRONG: LocalizedText = { en: "Finish strong", ar: "أنهِ بقوة" };

export const INTERSTITIALS: ReadonlyArray<Interstitial> = [
  {
    key: "after-10-gcc-entrepreneurship",
    triggerAfterIndex: 9,
    illustration: PatternEmergingScene,
    glow: "coral",
    audioId: KAI_SECTION_ENCOURAGEMENTS[0].audioId,
    title: DID_YOU_KNOW_TITLE,
    body: {
      en: "55% of GCC youth plan to start their own business in the next 5 years. The Middle East has the highest entrepreneurship ambition globally.",
      ar: "55% من شباب دول الخليج يخططون لبدء مشروعهم الخاص خلال السنوات الخمس القادمة. الشرق الأوسط لديه أعلى طموح ريادي في العالم.",
    },
    source: { en: "2020 Arab Youth Survey", ar: "استطلاع الشباب العربي 2020" },
    ctaLabel: CTA_GOT_IT,
  },
  {
    key: "after-10-mena-workforce",
    triggerAfterIndex: 9,
    illustration: PatternEmergingScene,
    glow: "coral",
    audioId: KAI_SECTION_ENCOURAGEMENTS[0].audioId,
    title: DID_YOU_KNOW_TITLE,
    body: {
      en: "The MENA region will add 127 million new workers by 2035. Your generation is literally shaping the future of work in the region.",
      ar: "ستضيف منطقة الشرق الأوسط وشمال أفريقيا 127 مليون عامل جديد بحلول عام 2035. جيلك يُشكّل فعلياً مستقبل العمل في المنطقة.",
    },
    source: { en: "World Bank 2024", ar: "البنك الدولي 2024" },
    ctaLabel: CTA_GOT_IT,
  },
  {
    key: "after-10-major-pivots",
    triggerAfterIndex: 9,
    illustration: PatternEmergingScene,
    glow: "coral",
    audioId: KAI_SECTION_ENCOURAGEMENTS[0].audioId,
    title: DID_YOU_KNOW_TITLE,
    body: {
      en: "Only 27% of college graduates end up working in a field directly related to their major. Your first job does not define your whole career.",
      ar: "27% فقط من خريجي الجامعات ينتهي بهم المطاف بالعمل في مجال مرتبط مباشرة بتخصصهم. وظيفتك الأولى لا تُحدد مسيرتك المهنية بأكملها.",
    },
    source: { en: "Federal Reserve Bank of New York", ar: "بنك الاحتياطي الفيدرالي في نيويورك" },
    ctaLabel: CTA_GOT_IT,
  },
  {
    key: "after-20-art-history",
    triggerAfterIndex: 19,
    illustration: CrossingPathsScene,
    glow: "lavender",
    audioId: KAI_SECTION_ENCOURAGEMENTS[1].audioId,
    title: DID_YOU_KNOW_TITLE,
    body: {
      en: "Art History majors have a lower unemployment rate than Computer Science majors in one major dataset. The job market is not always what people expect.",
      ar: "خريجو تاريخ الفن لديهم معدل بطالة أقل من خريجي علوم الحاسوب في إحدى مجموعات البيانات الكبرى. سوق العمل ليس دائماً كما يتوقعه الناس.",
    },
    source: {
      en: "Federal Reserve Bank of New York, 2023",
      ar: "بنك الاحتياطي الفيدرالي في نيويورك، 2023",
    },
    ctaLabel: CTA_KEEP_GOING,
  },
  {
    key: "after-20-automation",
    triggerAfterIndex: 19,
    illustration: CrossingPathsScene,
    glow: "lavender",
    audioId: KAI_SECTION_ENCOURAGEMENTS[1].audioId,
    title: DID_YOU_KNOW_TITLE,
    body: {
      en: "Automation will remove many routine jobs, but it is also creating new work for people who can use data, tools, and AI well.",
      ar: "ستُزيل الأتمتة كثيراً من الوظائف الروتينية، لكنها أيضاً تخلق عملاً جديداً لمن يُتقن استخدام البيانات والأدوات والذكاء الاصطناعي.",
    },
    source: { en: "McKinsey Global Institute", ar: "معهد ماكنزي العالمي" },
    ctaLabel: CTA_KEEP_GOING,
  },
  {
    key: "after-20-nursing",
    triggerAfterIndex: 19,
    illustration: CrossingPathsScene,
    glow: "lavender",
    audioId: KAI_SECTION_ENCOURAGEMENTS[1].audioId,
    title: DID_YOU_KNOW_TITLE,
    body: {
      en: "Nursing has one of the lowest unemployment rates of any major. Healthcare careers can stay resilient even when the economy shifts.",
      ar: "التمريض لديه واحد من أدنى معدلات البطالة بين جميع التخصصات. المهن الصحية يمكن أن تبقى صامدة حتى عندما يتغيّر الاقتصاد.",
    },
    source: { en: "Federal Reserve Bank of New York", ar: "بنك الاحتياطي الفيدرالي في نيويورك" },
    ctaLabel: CTA_KEEP_GOING,
  },
  {
    key: "after-30-gen-z-leadership",
    triggerAfterIndex: 29,
    illustration: DualWaysScene,
    glow: "cyan",
    audioId: KAI_SECTION_ENCOURAGEMENTS[2].audioId,
    title: DID_YOU_KNOW_TITLE,
    body: {
      en: "Only 6% of Gen Z say reaching senior leadership is their top career goal. Learning, balance, and purpose are becoming serious career priorities.",
      ar: "6% فقط من جيل Z يقولون إن الوصول إلى القيادة العليا هو هدفهم المهني الأول. التعلّم والتوازن والمعنى أصبحوا أولويات مهنية جادة.",
    },
    source: {
      en: "Deloitte Middle East Gen Z Study 2025",
      ar: "دراسة ديلويت للشرق الأوسط عن جيل Z 2025",
    },
    ctaLabel: CTA_MAKES_SENSE,
  },
  {
    key: "after-30-career-changes",
    triggerAfterIndex: 29,
    illustration: DualWaysScene,
    glow: "cyan",
    audioId: KAI_SECTION_ENCOURAGEMENTS[2].audioId,
    title: DID_YOU_KNOW_TITLE,
    body: {
      en: "The average person changes careers several times in their lifetime. Choosing your first path does not lock you in forever.",
      ar: "يُغيّر الشخص العادي مساره المهني عدة مرات خلال حياته. اختيار مسارك الأول لا يُقيّدك إلى الأبد.",
    },
    source: { en: "Bureau of Labor Statistics", ar: "مكتب إحصاءات العمل الأمريكي" },
    ctaLabel: CTA_MAKES_SENSE,
  },
  {
    key: "after-30-soft-skills",
    triggerAfterIndex: 29,
    illustration: DualWaysScene,
    glow: "cyan",
    audioId: KAI_SECTION_ENCOURAGEMENTS[2].audioId,
    title: DID_YOU_KNOW_TITLE,
    body: {
      en: "Many Gen Z and Millennial workers say soft skills matter more in the age of AI. Being human is still a competitive advantage.",
      ar: "يقول كثير من موظفي جيل Z والألفية إن المهارات الشخصية أصبحت أكثر أهمية في عصر الذكاء الاصطناعي. أن تكون إنساناً لا يزال ميزة تنافسية.",
    },
    source: {
      en: "Deloitte Global Gen Z Survey 2025",
      ar: "استطلاع ديلويت العالمي لجيل Z 2025",
    },
    ctaLabel: CTA_MAKES_SENSE,
  },
  {
    key: "after-40-future-jobs",
    triggerAfterIndex: 39,
    illustration: PeakReachedScene,
    glow: "coral",
    audioId: KAI_SECTION_ENCOURAGEMENTS[3].audioId,
    title: DID_YOU_KNOW_TITLE,
    body: {
      en: "By 2030, millions of jobs will be displaced, but even more new roles are expected to emerge. Change creates risk, but it also creates openings.",
      ar: "بحلول عام 2030، ستختفي ملايين الوظائف، لكن يُتوقع ظهور عدد أكبر من الأدوار الجديدة. التغيير يخلق مخاطر، لكنه أيضاً يخلق فرصاً.",
    },
    source: {
      en: "World Economic Forum Future of Jobs Report",
      ar: "تقرير مستقبل الوظائف - المنتدى الاقتصادي العالمي",
    },
    ctaLabel: CTA_FINISH_STRONG,
  },
];

/** Find the interstitial that should fire after the given question index. */
export function findInterstitialFor(
  questionIndex: number,
): Interstitial | null {
  const candidates = INTERSTITIALS.filter(
    (i) => i.triggerAfterIndex === questionIndex,
  );
  if (candidates.length === 0) return null;

  const seen = readSeen();
  const unseen = candidates.filter((candidate) => !seen.has(candidate.key));
  const pool = unseen.length > 0 ? unseen : candidates;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

// ---------- Persistence helpers ----------

const STORAGE_KEY = "tareeq:interstitials-seen";

function readSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function writeSeen(seen: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    // ignore quota errors
  }
}

export function hasSeenInterstitial(key: string): boolean {
  return readSeen().has(key);
}

export function markInterstitialSeen(key: string): void {
  const seen = readSeen();
  seen.add(key);
  writeSeen(seen);
}

export function resetInterstitialsSeen(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
