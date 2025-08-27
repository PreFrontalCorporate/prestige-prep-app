/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f7ff",
          100: "#e0efff",
          200: "#b9ddff",
          300: "#82c2ff",
          400: "#4aa5ff",
          500: "#1f89ff",
          600: "#0f6be6",
          700: "#0b53b4",
          800: "#0b458f",
          900: "#0c3c78",
        },
      },
      boxShadow: {
        soft: "0 10px 25px rgba(0,0,0,.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
