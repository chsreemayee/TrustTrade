import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          deep: "#0F5C5C",
          hover: "#0b4646",
          light: "#E6F0F0",
        },
        marigold: {
          DEFAULT: "#F2A900",
          hover: "#d99700",
          light: "#FEF7E6",
        },
        cream: {
          DEFAULT: "#FFF8EE",
          dark: "#F9F1E2",
        },
        card: "#FFFFFF",
        border: {
          DEFAULT: "#E5E1D8",
          dark: "#D1CCC2",
        },
        charcoal: {
          DEFAULT: "#1F2933",
          secondary: "#52606D",
        },
        verdict: {
          scam: {
            text: "#B42318",
            bg: "#FDECEA",
            border: "#FECDCA",
          },
          careful: {
            text: "#B54708",
            bg: "#FEF3E2",
            border: "#FEDF89",
          },
          no_signs: {
            text: "#1E7B34",
            bg: "#E7F5EA",
            border: "#A6F4C5",
          },
          could_not_check: {
            text: "#4B5563",
            bg: "#F1F3F5",
            border: "#D0D5DD",
          },
        },
        gain: "#1E7B34",
        loss: "#B42318",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.08)",
      },
      borderRadius: {
        card: "16px",
        btn: "16px",
      },
      fontFamily: {
        sans: ["var(--font-noto-sans)", "system-ui", "sans-serif"],
        telugu: ["var(--font-noto-telugu)", "var(--font-noto-sans)", "sans-serif"],
        devanagari: ["var(--font-noto-devanagari)", "var(--font-noto-sans)", "sans-serif"],
        kannada: ["var(--font-noto-kannada)", "var(--font-noto-sans)", "sans-serif"],
        tamil: ["var(--font-noto-tamil)", "var(--font-noto-sans)", "sans-serif"],
        malayalam: ["var(--font-noto-malayalam)", "var(--font-noto-sans)", "sans-serif"],
      },
      fontSize: {
        "title": ["26px", { lineHeight: "1.5", fontWeight: "700" }],
        "heading": ["22px", { lineHeight: "1.5", fontWeight: "600" }],
        "body": ["18px", { lineHeight: "1.5", fontWeight: "400" }],
        "btn": ["18px", { lineHeight: "1.5", fontWeight: "600" }],
        "chip": ["15px", { lineHeight: "1.5", fontWeight: "500" }],
        "verdict": ["28px", { lineHeight: "1.5", fontWeight: "700" }],
      },
    },
  },
  plugins: [],
};
export default config;
