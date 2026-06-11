import type { Config } from "tailwindcss";

/**
 * Tareeq v2 Tailwind config.
 *
 * Token names match docs/design.md §2. Legacy v1 names (plum, coral,
 * cyan-brand, ink, cream, mist) are aliased to their nearest v2
 * equivalent so existing components keep working while they migrate.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* v2 palette — Orbit-inspired near-black night with violet bloom */
        night: "#08051A",
        midnight: "#100A24",
        dusk: "#221248",
        violet: {
          DEFAULT: "#6E48E4",
          soft: "#9D7FF0",
        },
        lilac: "#C8B6F0",
        sand: "#F5EEE6",
        paper: "#F9F4EC",
        carbon: {
          DEFAULT: "#14101F",
          soft: "#2B2440",
        },
        gold: {
          DEFAULT: "#F4C660",
          soft: "#FDE7A8",
        },
        blush: "#F2A8B3",
        mint: "#6FE0C0",

        /* v1 → v2 aliases (so legacy components keep rendering during migration) */
        plum: {
          DEFAULT: "#1B1240", // → midnight
          deep: "#0E0A28", // → night
          mid: "#3D2270", // → dusk
        },
        mauve: "#6E48E4", // → violet
        lavender: {
          DEFAULT: "#9D7FF0", // → violet-soft
          mist: "#C8B6F0", // → lilac
        },
        coral: {
          DEFAULT: "#F4C660", // → gold (CTA color migrated)
          glow: "#F5D57F",
          deep: "#D9A93D",
        },
        "cyan-brand": "#6FE0C0", // → mint
        ink: {
          DEFAULT: "#14101F", // → carbon
          soft: "#0E0A28", // → night
        },
        cream: "#F5EEE6", // → sand
        mist: "#E8E0D4",
        success: "#6FE0C0",
        warning: "#F4C660",
        error: "#E07A6F",

        /* Admin design system — aliases the `.adm`-scoped CSS vars in
           app/admin/admin.css. Utilities like bg-adm-paper / bg-adm-violet/10
           only resolve inside the admin surface. */
        adm: {
          violet: "rgb(var(--adm-violet-rgb) / <alpha-value>)",
          "violet-soft": "rgb(var(--adm-violet-soft-rgb) / <alpha-value>)",
          lilac: "rgb(var(--adm-lilac-rgb) / <alpha-value>)",
          deep: "rgb(var(--adm-deep-rgb) / <alpha-value>)",
          night: "rgb(var(--adm-night-rgb) / <alpha-value>)",
          midnight: "rgb(var(--adm-midnight-rgb) / <alpha-value>)",
          dusk: "rgb(var(--adm-dusk-rgb) / <alpha-value>)",
          paper: "rgb(var(--adm-paper-rgb) / <alpha-value>)",
          sand: "rgb(var(--adm-sand-rgb) / <alpha-value>)",
          card: "rgb(var(--adm-card-rgb) / <alpha-value>)",
          ink: "rgb(var(--adm-ink-rgb) / <alpha-value>)",
          "ink-soft": "rgb(var(--adm-ink-soft-rgb) / <alpha-value>)",
          "ink-muted": "rgb(var(--adm-ink-muted-rgb) / <alpha-value>)",
          "ink-faint": "rgb(var(--adm-ink-faint-rgb) / <alpha-value>)",
          line: "rgb(var(--adm-line-rgb) / <alpha-value>)",
          "line-strong": "rgb(var(--adm-line-strong-rgb) / <alpha-value>)",
          gold: "rgb(var(--adm-gold-rgb) / <alpha-value>)",
          "gold-ink": "rgb(var(--adm-gold-ink-rgb) / <alpha-value>)",
          blush: "rgb(var(--adm-blush-rgb) / <alpha-value>)",
          mint: "rgb(var(--adm-mint-rgb) / <alpha-value>)",
          "mint-ink": "rgb(var(--adm-mint-ink-rgb) / <alpha-value>)",
          error: "rgb(var(--adm-error-rgb) / <alpha-value>)",
          "error-ink": "rgb(var(--adm-error-ink-rgb) / <alpha-value>)",
        },
      },
      backgroundImage: {
        "night-gradient":
          "linear-gradient(180deg, #221248 0%, #100A24 38%, #08051A 100%)",
        aurora:
          "linear-gradient(135deg, #6E48E4 0%, #9D7FF0 35%, #F2A8B3 70%, #F4C660 100%)",
        "gold-gradient":
          "linear-gradient(135deg, #F4C660 0%, #F5D57F 100%)",
        "violet-gradient":
          "linear-gradient(135deg, #6E48E4 0%, #9D7FF0 100%)",

        /* Warm gradient — pink → red-orange → gold. Used for headline
           accents and the primary CTA. */
        "grad-warm":
          "linear-gradient(95deg, #FF3D83 0%, #FF6B3D 55%, #FFA53D 100%)",

        /* legacy aliases */
        "plum-gradient":
          "linear-gradient(180deg, #0E0A28 0%, #1B1240 60%, #3D2270 100%)",
        "plum-gradient-soft":
          "linear-gradient(160deg, #1B1240 0%, #3D2270 100%)",
        "coral-gradient":
          "linear-gradient(135deg, #FF3D83 0%, #FF6B3D 55%, #FFA53D 100%)",
      },
      fontFamily: {
        sans: [
          "var(--font-jakarta)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        arabic: [
          "var(--font-arabic)",
          "SF Arabic",
          "Segoe UI Arabic",
          "Tahoma",
          "sans-serif",
        ],
        question: [
          "var(--font-question)",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
        display: [
          "var(--font-display-italic)",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
        /* Admin body font (same Plus Jakarta as `sans`, named for clarity). */
        jakarta: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "20px",
        xl: "28px",
        "2xl": "36px",
        pill: "9999px",
        /* Admin radii */
        "adm-sm": "8px",
        "adm-md": "12px",
        "adm-lg": "20px",
        "adm-xl": "28px",
        "adm-2xl": "36px",
      },
      boxShadow: {
        "sand-sm":
          "0 1px 2px rgba(20, 16, 31, 0.04), 0 1px 3px rgba(20, 16, 31, 0.06)",
        "sand-md":
          "0 8px 24px rgba(20, 16, 31, 0.06), 0 2px 8px rgba(20, 16, 31, 0.04)",
        "sand-lg":
          "0 24px 48px rgba(20, 16, 31, 0.08), 0 8px 16px rgba(20, 16, 31, 0.05)",
        "gold-glow":
          "0 12px 28px rgba(244, 198, 96, 0.35), 0 4px 10px rgba(244, 198, 96, 0.15)",
        "violet-glow":
          "0 12px 28px rgba(110, 72, 228, 0.35), 0 4px 10px rgba(110, 72, 228, 0.15)",
        "warm-glow":
          "0 14px 32px rgba(255, 61, 131, 0.38), 0 6px 14px rgba(255, 107, 61, 0.22)",
        /* Admin elevation (warm-tinted) */
        "adm-xs": "var(--adm-shadow-xs)",
        "adm-sm": "var(--adm-shadow-sm)",
        "adm-md": "var(--adm-shadow-md)",
        "adm-lg": "var(--adm-shadow-lg)",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        emphasis: "cubic-bezier(0.3, 0, 0, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        adm: "var(--adm-ease)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "200ms",
        slow: "320ms",
        reveal: "480ms",
        "adm-fast": "150ms",
        "adm-base": "220ms",
        "adm-slow": "360ms",
      },
    },
  },
  plugins: [],
};

export default config;
