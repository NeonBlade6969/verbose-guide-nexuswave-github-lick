import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090B",
        card: "#121216",
        "card-hover": "#18181E",
        border: "rgba(255, 255, 255, 0.08)",
        primary: {
          DEFAULT: "#6366F1", // Indigo
          hover: "#4F46E5",
          light: "#818CF8",
        },
        accent: {
          DEFAULT: "#8B5CF6", // Violet
          pink: "#EC4899",
          cyan: "#06B6D4",
        },
        muted: "#71717A",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
