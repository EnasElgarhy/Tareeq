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
        bg: {
          0: "var(--bg-0)",
          1: "var(--bg-1)",
          2: "var(--bg-2)",
        },
        accent: {
          pink: "var(--accent-pink)",
          orange: "var(--accent-orange)",
          gold: "var(--accent-gold)",
        },
        logo: {
          cyan: "var(--logo-cyan)",
        },
        text: {
          100: "var(--text-100)",
          80: "var(--text-80)",
          60: "var(--text-60)",
          40: "var(--text-40)",
        },
        glass: {
          DEFAULT: "var(--glass)",
          strong: "var(--glass-strong)",
          border: "var(--glass-border)",
        },
      },
      backgroundImage: {
        "grad-warm": "var(--grad-warm)",
        "grad-warm-soft": "var(--grad-warm-soft)",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
