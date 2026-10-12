/** Single source of truth for the user-facing product identity. Internal identifiers (package name, DB name) are intentionally not derived from this. */
export const BRAND = {
  name: "Algoryva",
  tagline: "Learn algorithms, practice, compete",
  /** Default document title and the suffix used by the title template. */
  title: "Algoryva: learn algorithms, practice, compete",
  description: "Algoryva is a structured, free path from your first algorithm to contest-ready problem solving.",
  /** Used for the browser UI colour and the web app manifest. Values come from the official logo sheet. */
  themeColor: { light: "#F4FAFA", dark: "#151B29" },
  /** Accessible name for the home link (logo). */
  homeLabel: "Algoryva home",
} as const;

export const siteUrl = () => process.env.SITE_URL ?? "http://localhost:3000";
