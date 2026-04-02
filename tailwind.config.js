/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e8f0fe",
          100: "#d2e1fd",
          200: "#a5c3fb",
          300: "#78a4f9",
          400: "#4b86f7",
          500: "#1a56db",
          600: "#1447c0",
          700: "#0f3fa0",
          800: "#0a2880",
          900: "#051460",
        },
        navy: "#0f172a",
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', "sans-serif"],
        mono: ['"DM Mono"', "monospace"],
      },
      boxShadow: {
        sm: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        md: "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)",
      },
      borderRadius: {
        default: "10px",
      },
    },
  },
  plugins: [],
};
