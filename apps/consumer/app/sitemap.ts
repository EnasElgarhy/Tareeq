import type { MetadataRoute } from "next";
import { siteOrigin, sitemapFor } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapFor(siteOrigin(), new Date("2026-10-28T00:00:00.000Z"));
}
