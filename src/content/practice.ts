import { EXTERNAL_PROBLEMS, type Tier } from "./externalProblems";
import { ORIGINAL_PROBLEMS } from "./originalProblems";

export type { Tier };
export const TIERS: { id: Tier; label: string; why: string }[] = [
  { id: "warmup", label: "Warm-up", why: "Very small problems. The goal is to prove to yourself that you can apply the idea at all." },
  { id: "core", label: "Core", why: "The technique in its standard shape. If you can do these without looking anything up, you have the basics." },
  { id: "application", label: "Application", why: "The technique is there but disguised: you must first notice it, or combine it with something you already know." },
  { id: "challenge", label: "Challenge", why: "Deeper reasoning or a combination of ideas. Expect to get stuck; that is where the learning happens." },
];

const byUrl = new Map(EXTERNAL_PROBLEMS.map((p) => [p.url, p.tier]));
const originalTier = new Map(ORIGINAL_PROBLEMS.map((p) => [p.slug, p.tier]));

/** Explicit tier when the seed knows it; otherwise a sensible default from the stored difficulty. */
export function tierOf(p: { kind: "INTERNAL" | "EXTERNAL"; slug: string; externalUrl: string | null; difficulty: string }): Tier {
  const explicit = p.kind === "EXTERNAL" ? (p.externalUrl ? byUrl.get(p.externalUrl) : undefined) : originalTier.get(p.slug);
  if (explicit) return explicit;
  return p.difficulty === "EASY" ? "core" : p.difficulty === "MEDIUM" ? "application" : "challenge";
}
