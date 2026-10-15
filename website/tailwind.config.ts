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
        canvas: "#0B0D0E",
        surface: {
          DEFAULT: "#141719",
          elevated: "#181C20",
          hover: "#1C2126",
          code: "#0D1012",
        },
        subtle: "#22272B",
        emerald: {
          accent: "#10B981",
          terminal: "#34D399",
        },
        mint: {
          neon: "#00F59B",
        },
        text: {
          primary: "#F3F4F6",
          muted: "rgba(255, 255, 255, 0.6)",
          dim: "#6B7280",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        sansation: ["Sansation", "sans-serif"],
        title: ["Sansation", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "JetBrains Mono",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      animation: {
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.24, 0, 0.38, 1) infinite",
        "tracer": "tracer-move 3s linear infinite",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.6)", opacity: "0.9" },
          "60%": { transform: "scale(2.4)", opacity: "0" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "tracer-move": {
          "0%": { strokeDashoffset: "300" },
          "100%": { strokeDashoffset: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
