import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#E9EAEE",
        surface: "#FFFFFF",
        ink: "#0F172A",
        muted: "#64748B",
        line: "#E2E8F0",
        accent: "#6366F1",
        success: "#22C55E",
        danger: "#EF4444",
        warn: "#F59E0B",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)",
        soft: "0 2px 8px rgba(15,23,42,0.05)",
        pop: "0 12px 40px rgba(15,23,42,0.12)",
      },
      backgroundImage: {
        "gradient-lav": "linear-gradient(135deg, #EFE9FB 0%, #FBEAF1 100%)",
        "gradient-blue": "linear-gradient(135deg, #DDE8F7 0%, #EEF3FC 100%)",
        "gradient-mint": "linear-gradient(135deg, #E4F6EE 0%, #EAF6F1 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
