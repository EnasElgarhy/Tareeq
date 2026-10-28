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
