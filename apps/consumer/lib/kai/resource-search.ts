import type { KaiLearningResource } from "@/lib/kai/resource-types";

/**
 * Kai never has a real URL for a recommendation — no retrieval, no search
 * backend, nothing Gemini-authored (see resource-types.ts). This builds a
 * plain platform SEARCH link entirely client-side from the title/author
 * text Gemini already returned, so "how do I open this?" has an honest
 * answer without ever trusting an LLM-invented link. It's a lookup the
 * user still evaluates themselves, not a guaranteed destination.
 */
export function buildResourceSearchUrl(
  resource: Pick<KaiLearningResource, "type" | "title" | "authorOrProvider" | "searchQuery">,
): string {
  const query = encodeURIComponent(
    (resource.searchQuery?.trim() || `${resource.title} ${resource.authorOrProvider}`).trim(),
  );
  if (resource.type === "youtube_video") {
    return `https://www.youtube.com/results?search_query=${query}`;
  }
  return `https://www.google.com/search?q=${query}`;
}
