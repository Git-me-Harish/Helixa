import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#9D93C1",
          light:   "#EDEBF2",
          dark:    "#7C6FA0",
          mid:     "#B3AAD0",
        },
        teal: {
          DEFAULT: "#6F5F98",
          light:   "#E4E0EE",
        },
        surface: {
          bg:      "#EDEBF2",
          card:    "#ffffff",
          subtle:  "#F7F6FA",
          muted:   "#EFEDF4",
        },
        ink: {
          DEFAULT:   "#2A2830",
          secondary: "#4A4750",
          muted:     "#636262",
          faint:     "#8B8894",
        },
        border: {
          DEFAULT: "#E3E0EA",
          strong:  "#CBC5D9",
        },
        positive: { DEFAULT: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
        warning:  { DEFAULT: "#d97706", bg: "#fffbeb", border: "#fde68a" },
        critical: { DEFAULT: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
        info:     { DEFAULT: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
      },
      fontFamily: {
        sans:     ["Manrope", "system-ui", "-apple-system", "sans-serif"],
        display:  ["Manrope", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["10px",  { lineHeight: "14px" }],
        xs:    ["12px",  { lineHeight: "16px" }],
        sm:    ["13.5px",{ lineHeight: "20px" }],
        base:  ["15px",  { lineHeight: "24px" }],
        lg:    ["17px",  { lineHeight: "26px" }],
        xl:    ["20px",  { lineHeight: "28px" }],
        "2xl": ["24px",  { lineHeight: "32px" }],
        "3xl": ["30px",  { lineHeight: "38px" }],
        "4xl": ["36px",  { lineHeight: "44px" }],
        "5xl": ["48px",  { lineHeight: "56px" }],
        "6xl": ["60px",  { lineHeight: "68px" }],
        "7xl": ["72px",  { lineHeight: "80px" }],
      },
      borderRadius: {
        sm:    "8px",
        DEFAULT: "12px",
        lg:    "16px",
        xl:    "20px",
        "2xl": "24px",
        "3xl": "32px",
      },
      spacing: {
        "4.5": "18px",
        "5.5": "22px",
        "13":  "52px",
        "15":  "60px",
        "18":  "72px",
        "22":  "88px",
        "30":  "120px",
      },
      boxShadow: {
        sm:   "0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)",
        DEFAULT:"0 4px 6px -1px rgba(15,23,42,.07), 0 2px 4px -1px rgba(15,23,42,.04)",
        md:   "0 10px 15px -3px rgba(15,23,42,.08), 0 4px 6px -2px rgba(15,23,42,.04)",
        lg:   "0 20px 25px -5px rgba(15,23,42,.10), 0 10px 10px -5px rgba(15,23,42,.04)",
        xl:   "0 25px 50px -12px rgba(15,23,42,.20)",
        brand:"0 4px 14px rgba(157,147,193,.35)",
      },
      animation: {
        "fade-up":   "fadeUp .5s cubic-bezier(.16,1,.3,1) both",
        "fade-in":   "fadeIn .35s ease both",
        "scale-in":  "scaleIn .28s cubic-bezier(.16,1,.3,1) both",
        "float":     "float 3s ease-in-out infinite",
        "spin-slow": "spin-slow 3s linear infinite",
        shimmer:     "shimmer 1.6s infinite",
      },
      keyframes: {
        fadeUp:   { from:{ opacity:"0", transform:"translateY(20px)" }, to:{ opacity:"1", transform:"none" } },
        fadeIn:   { from:{ opacity:"0" }, to:{ opacity:"1" } },
        scaleIn:  { from:{ opacity:"0", transform:"scale(.95)" }, to:{ opacity:"1", transform:"scale(1)" } },
        float:    { "0%,100%":{ transform:"translateY(0)" }, "50%":{ transform:"translateY(-8px)" } },
        "spin-slow": { to:{ transform:"rotate(360deg)" } },
        shimmer:  { "0%":{ backgroundPosition:"-200% 0" }, "100%":{ backgroundPosition:"200% 0" } },
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(.16,1,.3,1)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;