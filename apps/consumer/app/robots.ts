import type { MetadataRoute } from "next";
import { isIndexable, robotsFor, siteOrigin } from "@/lib/seo";

// Read at request time, so staging and production can share one build.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return robotsFor(isIndexable(), siteOrigin());
}
