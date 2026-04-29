import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        /* ── GS brand tokens — use as bg-gs-blue, text-gs-navy, etc. ── */
        gs: {
          blue:       "var(--gs-blue)",
          "deep-blue":"var(--gs-deep-blue)",
          navy:       "var(--gs-navy)",
          sky:        "var(--gs-sky)",
          green:      "var(--gs-green)",
          orange:     "var(--gs-orange)",
          red:        "var(--gs-red)",
          purple:     "var(--gs-purple)",
          bg:         "var(--gs-bg)",
          card:       "var(--gs-card)",
          border:     "var(--gs-border)",
          text:       "var(--gs-text)",
          muted:      "var(--gs-muted)",
        },
        /* ── shadcn/ui semantic aliases ── */
        background:  "var(--background)",
        foreground:  "var(--foreground)",
        primary: {
          DEFAULT:    "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT:    "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT:    "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT:    "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        border: "var(--border)",
        input:  "var(--input)",
        ring:   "var(--ring)",
      },
      borderRadius: {
        card:   "16px",
        button: "10px",
        lg:     "var(--radius)",
        md:     "calc(var(--radius) - 4px)",
        sm:     "calc(var(--radius) - 8px)",
      },
      boxShadow: {
        card:        "0 8px 24px rgba(15, 23, 42, 0.04)",
        "card-hover":"0 12px 32px rgba(15, 23, 42, 0.08)",
        "blue-glow": "0 4px 16px rgba(37, 99, 235, 0.24)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
