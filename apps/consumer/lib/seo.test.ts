import { describe, expect, it } from "vitest";
import { isIndexable, robotsFor, sitemapFor } from "./seo";

describe("robots", () => {
  it("blocks everything unless the site is marked indexable (staging)", () => {
    expect(isIndexable({})).toBe(false);
    expect(robotsFor(false, "https://staging.mapmycore.com")).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });

  it("opens public pages to search engines and AI crawlers in production", () => {
    expect(isIndexable({ SITE_INDEXABLE: "true" })).toBe(true);
    const robots = robotsFor(true, "https://mapmycore.com");
    const rules = robots.rules as { userAgent: string[] | string; allow: string; disallow: string[] }[];
    expect(rules[0].userAgent).toEqual(expect.arrayContaining(["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]));
    expect(rules[0].disallow).toEqual(expect.arrayContaining(["/api/", "/pay/", "/kai"]));
    expect(robots.sitemap).toBe("https://mapmycore.com/sitemap.xml");
  });
});

describe("sitemap", () => {
  it("lists the public pages only", () => {
    const urls = sitemapFor("https://mapmycore.com", new Date(0)).map((entry) => entry.url);
    expect(urls).toEqual([
      "https://mapmycore.com",
      "https://mapmycore.com/model",
      "https://mapmycore.com/research",
      "https://mapmycore.com/parents",
      "https://mapmycore.com/faq",
      "https://mapmycore.com/about",
      "https://mapmycore.com/privacy-policy",
      "https://mapmycore.com/terms-of-service",
    ]);
  });
});
