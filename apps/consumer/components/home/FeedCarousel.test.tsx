import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { FeedCarousel } from "@/components/home/FeedCarousel";

let container: HTMLDivElement;
let root: Root;

function track(): HTMLElement | null {
  return (
    [...container.querySelectorAll("div")].find((d) =>
      d.className.includes("snap-mandatory"),
    ) ?? null
  );
}

function buttons(): HTMLButtonElement[] {
  return [...container.querySelectorAll("button")].filter((b) =>
    ["Next", "Previous", "التالي", "السابق"].includes(
      b.getAttribute("aria-label") ?? "",
    ),
  ) as HTMLButtonElement[];
}

/** happy-dom reports zero layout, so overflow is faked per test. */
function fakeOverflow(
  el: HTMLElement,
  state: { scrollWidth: number; clientWidth: number; scrollLeft: number },
) {
  Object.defineProperty(el, "scrollWidth", {
    configurable: true,
    get: () => state.scrollWidth,
  });
  Object.defineProperty(el, "clientWidth", {
    configurable: true,
    get: () => state.clientWidth,
  });
  Object.defineProperty(el, "scrollLeft", {
    configurable: true,
    get: () => state.scrollLeft,
    set: (v: number) => {
      state.scrollLeft = v;
    },
  });
}

async function render(
  node: ReactNode,
  locale: "en" | "ar" = "en",
): Promise<void> {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<LocaleProvider initialLocale={locale}>{node}</LocaleProvider>);
  });
}

function carousel() {
  return (
    <FeedCarousel title="Paths" subtitle="Sub" hasControls>
      <div />
      <div />
      <div />
    </FeedCarousel>
  );
}

describe("FeedCarousel controls", () => {
  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.clear();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    root?.unmount();
    container?.remove();
  });

  it("renders no arrows without hasControls", async () => {
    await render(
      <FeedCarousel title="Paths">
        <div />
      </FeedCarousel>,
    );

    expect(track()).not.toBeNull();
    expect(buttons()).toHaveLength(0);
  });

  it("hides both arrows when everything fits", async () => {
    await render(carousel());

    expect(buttons()).toHaveLength(2);
    for (const button of buttons()) {
      expect(button.disabled).toBe(true);
    }
  });

  it("enables next at the start and previous at the end (LTR)", async () => {
    await render(carousel());
    const el = track();
    expect(el).not.toBeNull();
    const state = { scrollWidth: 1200, clientWidth: 700, scrollLeft: 0 };
    fakeOverflow(el!, state);

    await act(async () => {
      el!.dispatchEvent(new Event("scroll"));
    });

    const [previous, next] = buttons();
    expect(previous.getAttribute("aria-label")).toBe("Previous");
    expect(previous.disabled).toBe(true);
    expect(next.getAttribute("aria-label")).toBe("Next");
    expect(next.disabled).toBe(false);

    state.scrollLeft = 500; // scrollWidth - clientWidth
    await act(async () => {
      el!.dispatchEvent(new Event("scroll"));
    });

    expect(buttons()[0].disabled).toBe(false);
    expect(buttons()[1].disabled).toBe(true);
  });

  it("treats the start of the aligned track as the start", async () => {
    await render(carousel());
    const el = track();
    expect(el).not.toBeNull();
    const state = { scrollWidth: 1232, clientWidth: 390, scrollLeft: 0 };
    fakeOverflow(el!, state);
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      columnGap: "12px",
      paddingInlineStart: "0px",
    } as unknown as CSSStyleDeclaration);

    await act(async () => {
      el!.dispatchEvent(new Event("scroll"));
    });

    const [previous, next] = buttons();
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);
  });

  it("moves about two and a half cards per press, following reading order", async () => {
    await render(carousel());
    const el = track();
    expect(el).not.toBeNull();
    const state = { scrollWidth: 1200, clientWidth: 700, scrollLeft: 0 };
    fakeOverflow(el!, state);
    const scrolled: Array<{ left?: number }> = [];
    (el as unknown as { scrollBy: unknown }).scrollBy = (options: {
      left?: number;
    }) => {
      scrolled.push(options);
    };

    await act(async () => {
      el!.dispatchEvent(new Event("scroll"));
    });
    await act(async () => {
      buttons()[1].click();
    });

    // (190px card + 12px gap) × 2.5, forward in LTR.
    expect(scrolled).toHaveLength(1);
    expect(scrolled[0].left).toBeCloseTo(505, 0);
  });

  it("pins arrows to the illustration band with arrowAnchor media", async () => {
    await render(
      <FeedCarousel
        title="Paths"
        subtitle="Sub"
        hasControls
        arrowAnchor="media"
      >
        <div />
      </FeedCarousel>,
    );

    expect(buttons()).toHaveLength(2);
    for (const button of buttons()) {
      expect(button.className).toContain("max-md:top-[76px]");
    }
  });

  it("keeps arrows on the row middle by default", async () => {
    await render(carousel());

    expect(buttons()).toHaveLength(2);
    for (const button of buttons()) {
      expect(button.className).not.toContain("max-md:top-[76px]");
    }
  });

  it("moves roughly one card per press on narrow viewports", async () => {
    vi.stubGlobal("innerWidth", 390);
    await render(carousel());
    const el = track();
    expect(el).not.toBeNull();
    const state = { scrollWidth: 1200, clientWidth: 390, scrollLeft: 0 };
    fakeOverflow(el!, state);
    const scrolled: Array<{ left?: number }> = [];
    (el as unknown as { scrollBy: unknown }).scrollBy = (options: {
      left?: number;
    }) => {
      scrolled.push(options);
    };

    await act(async () => {
      el!.dispatchEvent(new Event("scroll"));
    });
    await act(async () => {
      buttons()[1].click();
    });

    // One card + gap on phones.
    expect(scrolled).toHaveLength(1);
    expect(scrolled[0].left).toBeCloseTo(202, 0);
  });

  it("labels arrows in Arabic and scrolls toward inline-end in RTL", async () => {
    await render(carousel(), "ar");
    const el = track();
    expect(el).not.toBeNull();
    const state = { scrollWidth: 1200, clientWidth: 700, scrollLeft: 0 };
    fakeOverflow(el!, state);
    const scrolled: Array<{ left?: number }> = [];
    (el as unknown as { scrollBy: unknown }).scrollBy = (options: {
      left?: number;
    }) => {
      scrolled.push(options);
    };

    await act(async () => {
      el!.dispatchEvent(new Event("scroll"));
    });

    const labels = buttons().map((b) => b.getAttribute("aria-label"));
    expect(labels).toEqual(["السابق", "التالي"]);

    await act(async () => {
      buttons()[1].click();
    });

    // Forward in RTL is negative scrollLeft.
    expect(scrolled).toHaveLength(1);
    expect(scrolled[0].left).toBeCloseTo(-505, 0);
  });
});
