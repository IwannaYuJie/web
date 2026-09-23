/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 带 alpha 通道，支持 bg-primary/10 这类写法
        primary: "rgb(var(--rgb-accent) / <alpha-value>)",
        surface: "rgb(var(--rgb-surface) / <alpha-value>)",
        "primary-hover": "var(--primary-hover)",
        secondary: "var(--secondary-color)",
        accent: "var(--accent-color)",
        gold: "var(--gold)",
        "bg-color": "var(--bg-color)",
        "surface-color": "var(--surface-color)",
        "text-color": "var(--text-color)",
        "text-secondary": "var(--text-secondary)",
        "text-light": "var(--text-light)",
        "border-color": "var(--border-color)",
        "card-bg": "var(--card-bg)",
        "card-hover": "var(--card-hover)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        full: "var(--radius-full)",
      }
    },
  },
  plugins: [],
}
