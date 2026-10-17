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
        primary: {
          DEFAULT: "#2563eb",
          hover: "#1d4ed8",
          light: "#eff6ff",
        },
        secondary: {
          DEFAULT: "#0891b2",
          hover: "#0e7490",
          light: "#ecfeff",
        },
        accent: {
          DEFAULT: "#f59e0b",
          hover: "#d97706",
          light: "#fef3c7",
        },
        neutralBg: "#f8fafc",
      },
      fontFamily: {
        sans: ["Pretendard Variable", "Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
