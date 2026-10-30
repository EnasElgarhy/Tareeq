import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

/**
 * Title, description, canonical and link preview for one public page, as
 * given in the 28 Oct update (Part B): titles read "Map My CORE: <page>".
 * The site-wide fallbacks (image, icons) stay in app/layout.tsx.
 */
export interface PageCopy {
  /** Path on the site, e.g. "/parents". Also the canonical URL. */
  path: string;
  /** Without the brand; null for the home page, whose title stands alone. */
  title: string | null;
  description: string;
}

export const HOME_TITLE = `${BRAND.name}: Explore your study and career paths`;

export const PAGES = {
  home: {
    path: "/",
    title: null,
    description: "In 15 minutes, see the study fields and careers your everyday choices point to.",
  },
  parents: {
    path: "/parents",
    title: "For parents",
    description: "Give your child the tools to make informed study and career choices.",
  },
  faq: {
    path: "/faq",
    title: "Questions and answers",
    description:
      "Answers to common questions about CORE, the report, Kai, privacy, and choosing a study and career path.",
  },
  about: {
    path: "/about",
    title: "About us",
    description:
      "Map My CORE helps young people in the Middle East and North Africa explore the study fields and careers worth looking into.",
  },
  model: {
    path: "/model",
    title: "The CORE model",
    description:
      "Four questions, one clear picture: what pulls your interest, how you like to work, what you want your work to give you, and the setting you prefer.",
  },
  science: {
    path: "/research",
    title: "The science behind CORE",
    description:
      "What each part of CORE is built on, and why we made the choices we did, in plain words.",
  },
} as const satisfies Record<string, PageCopy>;

export function pageMetadata(page: PageCopy): Metadata {
  const title = page.title ? `${BRAND.name}: ${page.title}` : HOME_TITLE;
  return {
    title: { absolute: title },
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: { title, description: page.description, url: page.path },
    twitter: { title, description: page.description },
  };
}

/**
 * Arabic tab titles and descriptions (staging corrections v4, section E).
 * The language switch is client-side, so LocalizedPageTitle swaps these in;
 * a description left out keeps the English one, as agreed for /model and
 * /research.
 */
export const ARABIC_PAGE_TEXT: Readonly<Record<string, { title: string; description?: string }>> = {
  "/": {
    title: "ماب ماي كور: استكشاف المسارات الدراسية والمهنية",
    description: "خلال 15 دقيقة، تتّضح مجالات الدراسة والمهن التي تشير إليها اختياراتك اليومية.",
  },
  "/parents": {
    title: "ماب ماي كور: لأولياء الأمور",
    description: "امنحوا أبناءكم الأدوات لاتخاذ قرارات دراسية ومهنية مدروسة.",
  },
  "/faq": {
    title: "ماب ماي كور: أسئلة وأجوبة",
    description: "إجابات عن الأسئلة الشائعة حول تقييم كور والتقرير وكاي والخصوصية واختيار المسار الدراسي والمهني.",
  },
  "/about": {
    title: "ماب ماي كور: من نحن",
    description: "يساعد ماب ماي كور الشباب في الشرق الأوسط وشمال أفريقيا على استكشاف مجالات الدراسة والمهن التي تستحق الاهتمام.",
  },
  "/model": { title: "ماب ماي كور: نموذج كور" },
  "/research": { title: "ماب ماي كور: الأساس العلمي لتقييم كور" },
};

/** The English title and description for a path, from PAGES. */
export function englishPageText(path: string): { title: string; description: string } | null {
  const page = Object.values(PAGES).find((p) => p.path === path);
  if (!page) return null;
  return { title: page.title ? `${BRAND.name}: ${page.title}` : HOME_TITLE, description: page.description };
}
