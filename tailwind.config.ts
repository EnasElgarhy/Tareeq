import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        plum: {
          DEFAULT: "#1B0E3F",
          deep: "#0F0824",
          mid: "#3D2270",
        },
        mauve: "#5B3D8C",
        lavender: {
          DEFAULT: "#B8A5D9",
          mist: "#E5DAF5",
        },
        coral: {
          DEFAULT: "#FF6B47",
          glow: "#FF8252",
          deep: "#E55530",
        },
        "cyan-brand": "#5BD6E8",
        ink: {
          DEFAULT: "#0D1B21",
          soft: "#0F0824",
        },
        cream: "#F5EEE6",
        mist: "#E8E0D4",
        success: "#2E8B6F",
        warning: "#D49A2A",
        error: "#C2453A",
      },
      backgroundImage: {
        "plum-gradient":
          "linear-gradient(135deg, #1B0E3F 0%, #3D2270 55%, #5B3D8C 100%)",
        "plum-gradient-soft":
          "linear-gradient(160deg, #2A1758 0%, #4D2B7E 100%)",
        "coral-gradient":
          "linear-gradient(135deg, #FF6B47 0%, #FF8252 100%)",
        "grad-warm":
          "linear-gradient(95deg, #FF3D83 0%, #FF6B3D 55%, #FFA53D 100%)",
        "grad-warm-soft":
          "linear-gradient(95deg, rgba(255,61,131,0.18), rgba(255,138,61,0.18))",
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
        "display-italic": [
          "var(--font-display-italic)",
          "Georgia",
          "serif",
        ],
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(13, 27, 33, 0.06), 0 1px 3px rgba(13, 27, 33, 0.04)",
        md: "0 4px 8px rgba(13, 27, 33, 0.06), 0 2px 4px rgba(13, 27, 33, 0.04)",
        lg: "0 12px 24px rgba(13, 27, 33, 0.08), 0 4px 8px rgba(13, 27, 33, 0.04)",
        xl: "0 24px 48px rgba(13, 27, 33, 0.10), 0 8px 16px rgba(13, 27, 33, 0.06)",
        "coral-glow":
          "0 8px 24px rgba(255, 107, 71, 0.40), 0 4px 8px rgba(255, 107, 71, 0.20)",
        "bubble":
          "0 12px 32px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.18)",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        emphasis: "cubic-bezier(0.3, 0, 0, 1)",
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
