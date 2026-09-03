/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0f1115",
        panel: "#161922",
        border: "#242836",
        accent: "#5865F2",
      },
    },
  },
  plugins: [],
};
