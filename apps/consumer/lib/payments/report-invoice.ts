/**
 * Asks Stripe to raise a paid invoice for the report payment. A one-off
 * Checkout payment has no invoice by default, only a receipt; with this, the
 * payer is emailed the invoice (PDF attached) together with the receipt, as
 * long as "Successful payments" is switched on under Customer emails in the
 * Stripe Dashboard. The purchase history already links to the invoice when
 * one exists (app/api/payments/history/route.ts).
 */
export const REPORT_INVOICE_CREATION = {
  enabled: true,
  invoice_data: {
    description: "Map My CORE: CORE career guidance report",
  },
} as const;
