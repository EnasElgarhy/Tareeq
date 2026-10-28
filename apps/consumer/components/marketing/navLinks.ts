/** Top menu (28 Oct update): The model · The science · For parents. */
export const NAV_LINKS = [
  { key: "marketing.nav.model" as const, href: "/model" },
  { key: "marketing.footer.research" as const, href: "/research" },
  { key: "marketing.footer.parents" as const, href: "/parents" },
] as const;

/** Still reachable from the footer and the mobile menu. */
export const SECONDARY_NAV_LINKS = [
  { key: "marketing.footer.faq" as const, href: "/faq" },
  { key: "marketing.nav.about" as const, href: "/about" },
] as const;

export const FOOTER_LINK_GROUPS = [
  {
    key: "marketing.footer.col_explore" as const,
    links: [
      { key: "marketing.nav.model" as const, href: "/model" },
      { key: "marketing.footer.research" as const, href: "/research" },
      { key: "marketing.footer.parents" as const, href: "/parents" },
    ],
  },
  {
    key: "marketing.footer.col_audience" as const,
    links: [
      { key: "marketing.footer.faq" as const, href: "/faq" },
      { key: "marketing.nav.about" as const, href: "/about" },
    ],
  },
  {
    key: "marketing.footer.col_legal" as const,
    links: [
      { key: "marketing.footer.privacy" as const, href: "/privacy-policy" },
      { key: "marketing.footer.terms" as const, href: "/terms-of-service" },
    ],
  },
] as const;
