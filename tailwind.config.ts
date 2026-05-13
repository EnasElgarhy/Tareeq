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
        /* v2 palette */
        night: "#0E0A28",
        midnight: "#1B1240",
        dusk: "#3D2270",
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
      },
      backgroundImage: {
        "night-gradient":
          "linear-gradient(180deg, #0E0A28 0%, #1B1240 60%, #3D2270 100%)",
        aurora:
          "linear-gradient(135deg, #6E48E4 0%, #9D7FF0 35%, #F2A8B3 70%, #F4C660 100%)",
        "gold-gradient":
          "linear-gradient(135deg, #F4C660 0%, #F5D57F 100%)",
        "violet-gradient":
          "linear-gradient(135deg, #6E48E4 0%, #9D7FF0 100%)",

        /* legacy aliases */
        "plum-gradient":
          "linear-gradient(180deg, #0E0A28 0%, #1B1240 60%, #3D2270 100%)",
        "plum-gradient-soft":
          "linear-gradient(160deg, #1B1240 0%, #3D2270 100%)",
        "coral-gradient":
          "linear-gradient(135deg, #F4C660 0%, #F5D57F 100%)",
        "grad-warm":
          "linear-gradient(95deg, #F2A8B3 0%, #F4C660 50%, #FDE7A8 100%)",
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
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "20px",
        xl: "28px",
        "2xl": "36px",
        pill: "9999px",
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
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        emphasis: "cubic-bezier(0.3, 0, 0, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "200ms",
        slow: "320ms",
        reveal: "480ms",
      },
    },
  },
  plugins: [],
};

export default config;
