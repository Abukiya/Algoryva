import type { Config } from "tailwindcss";

// Every colour is an RGB-triplet CSS variable (see globals.css) so `bg-brand/10` style opacity utilities work in both themes.
const c = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: c("bg"), surface: c("surface"), sunken: c("sunken"),
        line: c("line"), "line-strong": c("line-strong"),
        fg: c("fg"), soft: c("soft"), muted: c("muted"),
        brand: c("brand"), "brand-fg": c("brand-fg"), "brand-soft": c("brand-soft"),
        ok: c("ok"), warn: c("warn"), bad: c("bad"),
        lv1: c("lv1"), lv2: c("lv2"), lv3: c("lv3"), lv4: c("lv4"), lv5: c("lv5"), lv6: c("lv6"),
        // Legacy aliases so any untouched markup keeps working.
        accent: c("brand"), card: c("surface"),
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: { ctl: "10px", card: "16px" },
      boxShadow: { e1: "var(--e1)", e2: "var(--e2)", e3: "var(--e3)" },
      keyframes: {
        pop: { "0%": { transform: "scale(.6)", opacity: "0" }, "60%": { transform: "scale(1.08)", opacity: "1" }, "100%": { transform: "scale(1)" } },
        rise: { from: { transform: "translateY(6px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        fillbar: { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
        draw: { from: { strokeDashoffset: "24" }, to: { strokeDashoffset: "0" } },
        balloon: { "0%": { transform: "translateY(16px) scale(.5)", opacity: "0" }, "70%": { transform: "translateY(-5px) scale(1.06)", opacity: "1" }, "100%": { transform: "translateY(0) scale(1)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        beacon: { "0%": { boxShadow: "0 0 0 0 rgb(var(--brand) / .45)" }, "70%,100%": { boxShadow: "0 0 0 10px rgb(var(--brand) / 0)" } },
        trace: { to: { strokeDashoffset: "0" } },
      },
      animation: {
        pop: "pop .45s cubic-bezier(.2,.9,.3,1.2) both",
        rise: "rise .35s cubic-bezier(.2,.8,.2,1) both",
        fillbar: "fillbar .9s cubic-bezier(.2,.8,.2,1) both",
        draw: "draw .4s .1s ease-out both",
        balloon: "balloon .6s cubic-bezier(.2,.9,.3,1.2) both",
        shimmer: "shimmer 1.4s infinite",
        beacon: "beacon 2.4s ease-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
