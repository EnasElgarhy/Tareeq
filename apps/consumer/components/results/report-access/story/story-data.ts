import type { ReportOffer } from "@/lib/payments/report-access";

/**
 * Copy and pricing helpers for the locked Compass tab. Templates come
 * from the string table; this only fills them and formats the offer.
 */

/** Fills `{name}` placeholders the way the rest of the app does with `.replace`. */
export function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    template,
  );
}

function formatMinorAmount(
  amountMinor: number,
  currency: string,
  locale: string,
): string {
  const hasCents = amountMinor % 100 !== 0;
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en", {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amountMinor / 100);
}

/** What the customer pays, e.g. "AED 360" — no cents when they are zero. */
export function formatOfferPrice(offer: ReportOffer, locale: string): string {
  return formatMinorAmount(offer.amountMinor, offer.currency, locale);
}

/** The full price the offer is taken from, e.g. "AED 450". */
export function formatOfferListPrice(
  offer: ReportOffer,
  locale: string,
): string {
  return formatMinorAmount(offer.listAmountMinor, offer.currency, locale);
}

/** True when there is a real reduction to show against the list price. */
export function hasOfferDiscount(offer: ReportOffer): boolean {
  return offer.discountPercent > 0 && offer.listAmountMinor > offer.amountMinor;
}
