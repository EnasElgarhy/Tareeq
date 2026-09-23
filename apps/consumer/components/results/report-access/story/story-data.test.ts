import { describe, expect, it } from "vitest";
import {
  fill,
  formatOfferListPrice,
  formatOfferPrice,
  hasOfferDiscount,
} from "./story-data";

// Intl separates the currency code with a non-breaking space.
const plain = (text: string) => text.replace(/ /g, " ");

describe("fill", () => {
  it("replaces every occurrence of each placeholder", () => {
    expect(fill("{n} of {n} — {x}", { n: "6", x: "y" })).toBe("6 of 6 — y");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(fill("{n} {missing}", { n: "1" })).toBe("1 {missing}");
  });
});

describe("offer pricing", () => {
  const launch = {
    productId: "tareeq-deep-dive-v1",
    name: "Tareeq Complete Report",
    amountMinor: 36_000,
    listAmountMinor: 45_000,
    discountPercent: 20,
    currency: "AED",
  };

  it("shows the list price the offer is taken from", () => {
    expect(plain(formatOfferListPrice(launch, "en"))).toBe("AED 450");
    expect(plain(formatOfferPrice(launch, "en"))).toBe("AED 360");
  });

  it("only reports a discount when the pay price is really lower", () => {
    expect(hasOfferDiscount(launch)).toBe(true);
    expect(hasOfferDiscount({ ...launch, discountPercent: 0 })).toBe(false);
    expect(hasOfferDiscount({ ...launch, listAmountMinor: 36_000 })).toBe(
      false,
    );
  });
});

describe("formatOfferPrice", () => {
  const offer = {
    productId: "tareeq-deep-dive-v1",
    name: "Tareeq Complete Report",
    amountMinor: 3700,
    listAmountMinor: 3700,
    discountPercent: 0,
    currency: "AED",
  };

  it("drops the cents for a whole amount", () => {
    expect(plain(formatOfferPrice(offer, "en"))).toBe("AED 37");
  });

  it("keeps the cents when they are not zero", () => {
    expect(plain(formatOfferPrice({ ...offer, amountMinor: 3750 }, "en"))).toBe(
      "AED 37.50",
    );
  });
});
