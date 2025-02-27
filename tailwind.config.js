const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        rotateFull: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        skeletonTable: {
          "0%": { background: "rgb(226 232 240 / 0.8)" },
          "50%": { background: "rgb(226 232 240 / 0.4)" },
          "100%": { background: "rgb(226 232 240 / 0.8)" },
        },
      },
      animation: {
        rotateFull: "rotateFull 1s linear infinite",
        skeletonTable: "skeletonTable 1s linear infinite",
      },
      colors: {
        primary: {
          DEFAULT: "#17C964",
          light: "#3B82F6",
          dark: "#1E40AF",
        },
        secondary: {
          DEFAULT: "#9333EA",
          light: "#A855F7",
          dark: "#7E22CE",
        },
        danger: "#ef4444",
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};
