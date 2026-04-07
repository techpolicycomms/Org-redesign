import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#09090b",
          surface: "#18181b",
          border: "#27272a",
          muted: "#a1a1aa",
          text: "#fafafa",
          accent: "#f59e0b",
          accentMuted: "#b45309",
        },
        role: {
          ic: "#3b82f6",
          dri: "#f59e0b",
          coach: "#22c55e",
          eliminated: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
