import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#071019",
        panel: "#0c1b26",
        cyan: "#55f6ff",
        lime: "#c7ff4a",
        amber: "#ffb84d",
        coral: "#ff6b6b",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-monospace", "monospace"],
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(85,246,255,.28), 0 18px 60px rgba(0,0,0,.35)",
        lime: "0 0 28px rgba(199,255,74,.2)",
      },
      backgroundImage: {
        "arcade-grid": "url('/arcade-grid.svg')",
      },
    },
  },
  plugins: [],
};

export default config;
