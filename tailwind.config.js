/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 🔴 Brand
        primary: {
          DEFAULT: "#E53935",
          light: "#ef5350",
          dark: "#c62828",
        },

        // 🟧 Warm food tone
        secondary: {
          DEFAULT: "#ff8c42",
          light: "#ffb066",
          dark: "#fb923c",
        },

        // 🌕 Backgrounds
        surface: "#ffffff",
        background: "#fff6e5",

        // ⚫ Dark anchor
        dark: "#0a0a0a",

        // 🧊 Neutral system
        muted: "#6b7280",
        border: "#e5e7eb",
      },

      backgroundImage: {
        // 🌅 Your main app gradient (UPDATED)
        "brand-gradient":
          "linear-gradient(to bottom right, #fff6e5, #ffb066, #E53935)",
      },

      boxShadow: {
        brand: "0 10px 25px rgba(229, 57, 53, 0.15)",
      },
    },
  },
  plugins: [],
}

