import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";
import { PAGES } from "@/lib/page-metadata";

/**
 * Search engines and AI tools (28 Oct update, Part A.6). Staging stays
 * blocked; production opts in with SITE_INDEXABLE=true at runtime, so the
 * same image can serve both.
 */

/** Named so the launch list is explicit; "*" also covers them. */
export const ALLOWED_CRAWLERS = [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
] as const;

/** The app itself and payment links are never indexed. */
export const PRIVATE_PATHS = [
  "/api/",
  "/pay/",
  "/invite/",
  "/compass",
  "/kai",
  "/you",
  "/home",
  "/explore",
  "/signin",
  "/start",
  "/q/",
  "/intro",
  "/contract",
  "/analyzing",
  "/register",
  "/results",
  "/profile",
  "/kai-chat",
  "/deep-dive-preview",
  "/home-preview",
  "/report-design-check",
  "/pay-design-check",
  "/redesign",
  "/share/",
] as const;

export const PUBLIC_PATHS = [
  PAGES.home.path,
  PAGES.model.path,
  PAGES.science.path,
  PAGES.parents.path,
  PAGES.faq.path,
  PAGES.about.path,
  "/privacy-policy",
  "/terms-of-service",
] as const;

export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || BRAND.siteUrl).replace(/\/$/, "");
}

export function isIndexable(env: Record<string, string | undefined> = process.env): boolean {
  return env.SITE_INDEXABLE === "true";
}

export function robotsFor(indexable: boolean, origin: string): MetadataRoute.Robots {
  if (!indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: [
      { userAgent: [...ALLOWED_CRAWLERS], allow: "/", disallow: [...PRIVATE_PATHS] },
      { userAgent: "*", allow: "/", disallow: [...PRIVATE_PATHS] },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}

export function sitemapFor(origin: string, lastModified: Date): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${origin}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
