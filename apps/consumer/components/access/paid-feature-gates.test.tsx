import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { ExploreScreen } from "@/components/home/ExploreScreen";
import { PlansListScreen } from "@/components/kai/plans/PlansListScreen";
import { KaiChatScreen } from "@/components/kai/chat/KaiChatScreen";
import type { PaidAccessState } from "@/lib/payments/use-paid-access";

const access = { state: "unpaid" as PaidAccessState };

vi.mock("@/lib/payments/use-paid-access", () => ({
  usePaidAccess: () => ({ state: access.state }),
  markPaidAccessUnpaid: vi.fn(),
}));
vi.mock("@/lib/analytics/track", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/kai/plans/plan-storage", () => ({ readPlans: () => [] }));
vi.mock("@/components/assessment/CompassReport", () => ({
  CompassReport: () => createElement("div", null, "the full report"),
}));
// The chat itself is covered by its own suite; here only the gate matters.
vi.mock("@/components/kai/chat/KaiChatProvider", () => ({
  useKaiChat: () => ({}),
  KaiChatProvider: ({ children }: { children?: unknown }) =>
    createElement("div", null, children as never),
}));

let container: HTMLDivElement;

async function render(node: React.ReactElement, state: PaidAccessState) {
  access.state = state;
  container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<LocaleProvider initialLocale="en">{node}</LocaleProvider>);
  });
  return container;
}

vi.mock("@/lib/profile/journey", () => ({
  readProfileSnapshot: () => ({ coreReport: { id: "report-1" } }),
}));

beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

afterEach(() => {
  container?.remove();
});

describe("paid feature gates", () => {
  it("Explore: locks the map and names its sections", async () => {
    const dom = await render(createElement(ExploreScreen), "unpaid");

    expect(dom.textContent).toContain("The full map is inside your report");
    expect(dom.textContent).toContain("University Majors");
    expect(dom.textContent).not.toContain("the full report");
    // The tab's own header still explains where the visitor is.
    expect(dom.textContent).toContain("Explore");
  });

  it("Explore: shows the map to a paying visitor", async () => {
    const dom = await render(createElement(ExploreScreen), "paid");

    expect(dom.textContent).toContain("the full report");
    expect(dom.textContent).not.toContain("The full map is inside your report");
  });

  it("Explore: never flashes the lock while checking", async () => {
    const dom = await render(createElement(ExploreScreen), "checking");

    expect(dom.textContent).toContain("Checking your access");
    expect(dom.textContent).not.toContain("The full map is inside your report");
  });

  it("Plans: locks the list instead of showing it empty", async () => {
    const dom = await render(createElement(PlansListScreen), "unpaid");

    expect(dom.textContent).toContain("Plans are built from your full report");
    expect(dom.textContent).not.toContain("No plans yet");
  });

  it("Kai: does not mount the chat for an unpaid visitor", async () => {
    const dom = await render(createElement(KaiChatScreen), "unpaid");

    expect(dom.textContent).toContain("Kai is part of your full report");
    // Nothing to type into: the gate decides before the chat mounts.
    expect(dom.querySelector("textarea, input")).toBeNull();
  });
});
