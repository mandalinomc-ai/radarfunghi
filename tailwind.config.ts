import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: "#00ff66",
        sage: {
          100: "#d4e8d2",
          200: "#b8d4b5",
          300: "#9cb89a",
          400: "#7a9a78",
          500: "#5a7a58",
          600: "#3d5a3b",
        },
        enterprise: {
          bg: "#0a0f0d",
          panel: "#0f1613",
          border: "#1a2e24",
        },
        forest: {
          950: "#0a1209",
          900: "#0f1a0e",
          800: "#1a2e18",
          700: "#243d22",
          600: "#2d4f2a",
          500: "#3d6b38",
          400: "#5a8f54",
          300: "#7ab872",
        },
        mushroom: {
          600: "#c45c1a",
          500: "#e07830",
          400: "#f59a4a",
          300: "#fbb86e",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
