import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202A",
        mint: "#2EA871",
        coral: "#EF6F61",
        gold: "#E4A11B",
        paper: "#F7F8F3"
      }
    }
  },
  plugins: []
};

export default config;
