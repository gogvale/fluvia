import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fluvia dark theme — "the river" near-black with a cool blue-green cast
        night: "#060809",
        surface: "#0B0E13",
        card: "#10141B",
        elevated: "#161C26",
        line: "#1E242E",
        line2: "#2A3341",
        ink: "#F5F7FA",
        soft: "#98A2B3",
        mute: "#5B6472",
        // brand accents (water: cyan → emerald → violet depth)
        river: "#2DD4BF",
        stream: "#22D3EE",
        deep: "#8B5CF6",
        // semantic
        ok: "#34D399",
        warn: "#FBBF24",
        bad: "#F87171",
        info: "#38BDF8",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 8px 40px rgba(45, 212, 191, 0.08)",
        "glow-strong": "0 8px 60px rgba(45, 212, 191, 0.18)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
