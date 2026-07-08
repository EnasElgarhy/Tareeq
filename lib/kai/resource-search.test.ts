import { describe, expect, it } from "vitest";
import { buildResourceSearchUrl } from "@/lib/kai/resource-search";

describe("buildResourceSearchUrl", () => {
  it("builds a YouTube search URL for youtube_video resources", () => {
    const url = buildResourceSearchUrl({
      type: "youtube_video",
      title: "Practical Deep Learning for Coders",
      authorOrProvider: "fast.ai",
    });
    expect(url).toBe("https://www.youtube.com/results?search_query=Practical%20Deep%20Learning%20for%20Coders%20fast.ai");
  });

  it("builds a Google search URL for every other resource type", () => {
    const url = buildResourceSearchUrl({
      type: "book",
      title: "Atomic Habits",
      authorOrProvider: "James Clear",
    });
    expect(url).toBe("https://www.google.com/search?q=Atomic%20Habits%20James%20Clear");
  });

  it("encodes special characters safely", () => {
    const url = buildResourceSearchUrl({
      type: "article",
      title: "What is Law & Diplomacy?",
      authorOrProvider: "Foreign Affairs",
    });
    expect(url).toContain("What%20is%20Law%20%26%20Diplomacy");
  });

  it("prefers searchQuery over the title/author derivation when present", () => {
    const url = buildResourceSearchUrl({
      type: "youtube_video",
      title: "Some Channel's Episode Title",
      authorOrProvider: "Some Channel",
      searchQuery: "day in the life of a marine biologist",
    });
    expect(url).toBe("https://www.youtube.com/results?search_query=day%20in%20the%20life%20of%20a%20marine%20biologist");
  });

  it("falls back to the title/author derivation when searchQuery is blank", () => {
    const url = buildResourceSearchUrl({
      type: "book",
      title: "Atomic Habits",
      authorOrProvider: "James Clear",
      searchQuery: "   ",
    });
    expect(url).toBe("https://www.google.com/search?q=Atomic%20Habits%20James%20Clear");
  });
});
