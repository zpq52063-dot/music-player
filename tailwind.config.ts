import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: {
          DEFAULT: "rgba(28, 28, 30, 0.8)",
          elevated: "rgba(44, 44, 46, 0.85)",
          highlight: "rgba(58, 58, 60, 0.9)",
        },
        accent: {
          primary: "#ff2d55",
          secondary: "#007aff",
          tertiary: "#34c759",
        },
        text: {
          primary: "#f5f5f7",
          secondary: "#98989d",
          tertiary: "#636366",
        },
      },
      backdropBlur: {
        xs: "2px",
        glass: "20px",
        heavy: "40px",
      },
      borderRadius: {
        apple: "12px",
        "apple-lg": "20px",
        "apple-xl": "28px",
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont',
          '"SF Pro Display"', '"SF Pro Text"',
          '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif',
        ],
      },
      animation: {
        "spin-slow": "spin 8s linear infinite",
        "spin-cover": "spin 12s linear infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "shimmer": "shimmer 2s infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "pulse-glow-subtle": "pulseGlowSubtle 1s ease-in-out infinite",
        "now-playing": "nowPlaying 0.6s ease-in-out infinite alternate",
        "spring-up": "springUp 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
        "spring-scale": "springScale 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        pulseGlowSubtle: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        nowPlaying: {
          "0%": { height: "4px" },
          "100%": { height: "12px" },
        },
        springUp: {
          "0%": { transform: "translateY(24px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        springScale: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.03)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
