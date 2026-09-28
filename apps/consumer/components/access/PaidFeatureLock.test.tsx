import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PaidAccessChecking,
  PaidFeatureLock,
  type LockedFeature,
} from "@/components/access/PaidFeatureLock";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";

vi.mock("@/lib/analytics/track", () => ({ trackEvent: vi.fn() }));

let container: HTMLDivElement;

async function render(
  node: React.ReactElement,
  locale: "en" | "ar" = "en",
): Promise<string> {
  container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <LocaleProvider initialLocale={locale}>{node}</LocaleProvider>,
    );
  });
  // Intl currency formatting separates the code with a non-breaking space.
  return (container.textContent ?? "").replace(/\u00a0/g, " ");
}

describe("PaidFeatureLock", () => {
  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.clear();
  });

  afterEach(() => {
    container?.remove();
  });

  it.each([
    ["kai", "Kai is part of your full report", ["Action Plans", "Career Explore", "Deep Dive Interview"]],
    ["explore", "The full map is inside your report", ["University Majors", "High-School Subjects", "Less Obvious Paths"]],
    ["plans", "Plans are built from your full report", ["Your next-step plan", "Skills worth building next", "Where to stretch next"]],
  ] as [LockedFeature, string, string[]][])(
    "names the %s surface and what unlocking includes",
    async (feature, heading, items) => {
      const text = await render(createElement(PaidFeatureLock, { feature }));

      expect(text).toContain(heading);
      for (const item of items) expect(text).toContain(item);
      expect(text).toContain("In your full report");
    },
  );

  it("carries the price, the offer and the paywall's own call to action", async () => {
    const text = await render(createElement(PaidFeatureLock, { feature: "kai" }));

    expect(text).toContain("AED 360");
    expect(text).toContain("AED 450");
    expect(text).toContain("20% off");
    expect(text).toContain("Unlock My Full Compass");
  });

  it("sends the visitor to the one checkout in the app", async () => {
    await render(createElement(PaidFeatureLock, { feature: "kai" }));

    const link = container.querySelector("a[href='/compass']");
    expect(link).not.toBeNull();
  });

  it("tells a returning buyer how to get back in, once", async () => {
    const text = await render(createElement(PaidFeatureLock, { feature: "plans" }));

    expect(text).toContain("Already bought it?");
    // One CTA per screen: the note must not become a second button.
    expect(container.querySelectorAll("a")).toHaveLength(1);
  });

  it("renders in Arabic, in the same structure", async () => {
    const text = await render(createElement(PaidFeatureLock, { feature: "kai" }), "ar");

    expect(text).toContain("كاي جزء من تقريرك الكامل");
    expect(text).toContain("في تقريرك الكامل");
    expect(text).toContain("افتح بوصلتي الكاملة");
  });

  it("labels the checking state for assistive tech", async () => {
    await render(createElement(PaidAccessChecking));

    expect(container.querySelector("[role='status']")?.textContent).toContain(
      "Checking your access",
    );
  });
});
